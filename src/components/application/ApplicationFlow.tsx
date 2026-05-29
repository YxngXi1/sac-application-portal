import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveApplicationProgress, loadApplicationProgress } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import PositionQuestionsComponent from './PositionQuestionsComponent';
import ConfirmationPage from './ConfirmationPage';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { APPLICATION_POSITIONS, getQuestionCountForPosition } from '@/lib/applicationConfig';

const ApplicationFlow = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [forceStartFromBeginning, setForceStartFromBeginning] = useState(false);

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

  const handleGetStarted = () => {
    console.log('Getting started, moving to position selection');
    setCurrentStep(1);
  };

  const handlePositionSelect = async (position = selectedPosition) => {
    if (!position || !user) {
      console.error('Cannot select position: missing data', { position, user: !!user });
      return;
    }

    try {
      console.log('Saving position selection:', position);
      const progress = 20; // Position selected = 20% progress
      
      await saveApplicationProgress(user.uid, {
        position,
        answers: {},
        progress,
        status: 'draft',
        userProfile: {
          fullName: userProfile?.fullName || '',
          studentNumber: userProfile?.studentNumber || '',
          grade: userProfile?.grade || '',
        }
      });
      
      setSelectedPosition(position);
      setCurrentStep(2);
      
      toast({
        title: "Position Selected",
        description: `You're applying for ${position}.`,
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
    return getQuestionCountForPosition(position);
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
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader className="text-center px-4 py-6 sm:px-8 sm:py-8">
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl">Start Your Application</CardTitle>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto">
              Apply for one of this year's SAC positions.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 px-4 pb-4 sm:px-8 sm:pb-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-900 text-lg sm:text-xl text-center">Available Roles</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-left">
                {APPLICATION_POSITIONS.map((position) => (
                  <div
                    key={position.id}
                    className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 sm:px-5 sm:py-5 shadow-sm"
                  >
                    <h4 className="font-semibold text-blue-900 text-base sm:text-lg mb-2">
                      {position.title}
                    </h4>
                    <p className="text-sm sm:text-base text-blue-700 leading-7">
                      {position.fullDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 px-4 py-3 sm:px-5 sm:py-4 rounded-lg text-sm sm:text-base text-blue-800 text-center">
              Your progress is automatically saved. We recommend saving a backup of these answers on another safe platform too.
            </div>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base lg:text-lg"
            >
              Start Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Position Selection
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Card className="w-full max-w-5xl mx-auto">
          <CardHeader className="px-4 py-6 sm:px-8 sm:py-8">
            <CardTitle className="text-2xl sm:text-3xl">Choose Your Position</CardTitle>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Select the SAC role you want to apply for.</p>
          </CardHeader>
          <CardContent className="space-y-5 px-4 pb-4 sm:px-8 sm:pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {APPLICATION_POSITIONS.map((position) => (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => setSelectedPosition(position.id)}
                  className={`rounded-xl border p-4 sm:p-5 text-left transition ${
                    selectedPosition === position.id
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{position.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{position.shortDescription}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => handlePositionSelect()}
                disabled={!selectedPosition}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
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
