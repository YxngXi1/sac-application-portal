import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveApplicationProgress, loadApplicationProgress } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import PositionQuestionsComponent from './PositionQuestionsComponent';
import ConfirmationPage from './ConfirmationPage';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ApplicationFlow = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [forceStartFromBeginning, setForceStartFromBeginning] = useState(false);

  const positions = [
    'Grade Rep',
  ];

  // Load application progress on component mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Loading application progress for user:', user.uid);
        const savedApplication = await loadApplicationProgress(user.uid);
        
        if (savedApplication && !forceStartFromBeginning) {
          console.log('Found existing application:', savedApplication);
          setHasExistingApplication(true);
          setSelectedPosition(savedApplication.position);
          setAnswers(savedApplication.answers || {});
          
          if (savedApplication.status === 'submitted') {
            setCurrentStep(3); // Go to confirmation if already submitted
          } else {
            setCurrentStep(2); // Go to questions if draft exists
          }
        } else {
          console.log('No existing application found, starting fresh');
          // Start from the beginning - go to get started page
          setCurrentStep(0);
          setSelectedPosition('');
          setAnswers({});
          setUploadedFiles({});
          setHasExistingApplication(false);
        }
      } catch (error) {
        console.error('Error loading application progress:', error);
        // If there's an error, start fresh
        setCurrentStep(0);
        toast({
          title: "Welcome",
          description: "Let's start your application process.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user, toast, forceStartFromBeginning]);

  // Check for reset flag from localStorage
  useEffect(() => {
    const resetFlag = localStorage.getItem('applicationReset');
    if (resetFlag === 'true') {
      setForceStartFromBeginning(true);
      localStorage.removeItem('applicationReset');
    }
  }, []);

  useEffect(() => {
    if (currentStep === 1 && !loading && !selectedPosition) {
      console.log('Auto-selecting Grade Rep position');
      setSelectedPosition('Grade Rep');
    }
  }, [currentStep, loading, selectedPosition]);

  // Handle position selection and proceed to next step
  useEffect(() => {
    if (currentStep === 1 && selectedPosition === 'Grade Rep' && !loading) {
      console.log('Position is set, proceeding to save and continue');
      
      const proceedWithApplication = async () => {
        try {
          await handlePositionSelect();
        } catch (error) {
          console.error('Error during auto-position selection:', error);
          toast({
            title: "Error",
            description: "Failed to save your position selection. Please try again.",
            variant: "destructive",
          });
        }
      };

      // Small delay to ensure state is properly updated
      const timeoutId = setTimeout(proceedWithApplication, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, selectedPosition, loading]);

  const handleGetStarted = () => {
    console.log('Getting started, moving to position selection');
    setCurrentStep(1);
  };

  const handlePositionSelect = async () => {
    if (!selectedPosition || !user) {
      console.error('Cannot select position: missing data', { selectedPosition, user: !!user });
      return;
    }

    try {
      console.log('Saving position selection:', selectedPosition);
      const progress = 20; // Position selected = 20% progress
      
      await saveApplicationProgress(user.uid, {
        position: selectedPosition,
        answers: {},
        progress,
        status: 'draft',
        userProfile: {
          fullName: userProfile?.fullName || '',
          studentNumber: userProfile?.studentNumber || '',
          grade: userProfile?.grade || '',
        }
      });
      
      setHasExistingApplication(true);
      setCurrentStep(2);
      
      toast({
        title: "Position Selected",
        description: "You're applying for Grade Rep position.",
      });
    } catch (error) {
      console.error('Error saving position selection:', error);
      toast({
        title: "Error",
        description: "Failed to save your selection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetApplication = async () => {
    if (!user) return;
    
    try {
      // Delete the application document
      const applicationRef = doc(db, 'applications', user.uid);
      await deleteDoc(applicationRef);
      
      // Reset all state
      setSelectedPosition('');
      setAnswers({});
      setUploadedFiles({});
      setHasExistingApplication(false);
      setCurrentStep(0);
      
      toast({
        title: "Application Reset",
        description: "Your application has been deleted. You can now start fresh.",
      });
    } catch (error) {
      console.error('Error resetting application:', error);
      toast({
        title: "Error",
        description: "Failed to reset your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFileChange = (questionId: string, files: File[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [questionId]: files
    }));
  };

  const calculateProgress = () => {
    if (!selectedPosition) return 0;
    if (currentStep === 1) return 20;
    if (currentStep === 2) {
      const totalQuestions = getQuestionCount(selectedPosition);
      const answeredQuestions = Object.keys(answers).length;
      return Math.min(20 + (answeredQuestions / totalQuestions) * 70, 90);
    }
    return 100;
  };

  const getQuestionCount = (position: string) => {
    switch (position) {
      case 'Grade Rep': return 5;
      default: return 1;
    }
  };

const saveProgress = async () => {
  if (!user) return;
  
  try {
    const progress = calculateProgress();
    
    console.log('Saving progress with data:', {
      position: selectedPosition,
      answers: answers,
      answersCount: Object.keys(answers).length,
      progress,
      userProfile: {
        fullName: userProfile?.fullName || '',
        studentNumber: userProfile?.studentNumber || '',
        grade: userProfile?.grade || '',
      }
    });
    
    await saveApplicationProgress(user.uid, {
      position: selectedPosition,
      answers,
      progress,
      userProfile: {
        fullName: userProfile?.fullName || '',
        studentNumber: userProfile?.studentNumber || '',
        grade: userProfile?.grade || '',
      }
    });
    
    console.log('Save completed successfully');
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
};

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmissionComplete = () => {
    setIsSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  // Step 0: Get Started
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">Start Your Application</CardTitle>
            <p className="text-gray-600 text-sm sm:text-base">Ready to join the Student Activity Council as an Grade Rep?</p>
          </CardHeader>
          <CardContent className="text-center space-y-4 p-4 sm:p-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Grade Rep Position</h3>
              <p className="text-sm text-blue-700">
                Grade Reps are elected members that represent and voice the opinions of their grade at SAC initiatives, as well as carry out the responsibilities of an honourary member.
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-xs sm:text-sm text-blue-800">
              Your progress is automatically saved. We recommend saving a backup of these answers on another safe platform too.
            </div>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
            >
              Start Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Position Selection (Auto-select Grade Rep)
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">Setting Up Your Application</CardTitle>
            <p className="text-gray-600 text-sm sm:text-base">Preparing your Grade Rep application...</p>
          </CardHeader>
          <CardContent className="text-center space-y-4 p-4 sm:p-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Grade Rep Position</h3>
              <p className="text-sm text-blue-700">
                Grade Reps are elected members that represent and voice the opinions of their grade at SAC initiatives, as well as carry out the responsibilities of an honourary member.
              </p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 text-sm">Setting up your application...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Questions
  if (currentStep === 2) {
    return (
      <PositionQuestionsComponent
        position={selectedPosition}
        answers={answers}
        uploadedFiles={uploadedFiles}
        onAnswerChange={handleAnswerChange}
        onFileChange={handleFileChange}
        onNext={handleNext}
        onBack={handleBack}
        onSave={saveProgress}
      />
    );
  }

  // Step 3: Confirmation
  if (currentStep === 3) {
    return (
      <ConfirmationPage
        position={selectedPosition}
        answers={answers}
        uploadedFiles={uploadedFiles}
        onBack={isSubmitted ? undefined : handleBack}
        onSubmissionComplete={handleSubmissionComplete}
      />
    );
  }

  return null;
};

export default ApplicationFlow;