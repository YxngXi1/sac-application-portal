
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveApplicationProgress, loadApplicationProgress } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import PositionQuestions from './PositionQuestions';
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
    'Secretary',
    'Treasurer', 
    'Community Outreach',
    'Athletics Liaison',
    'Promotions Officer',
    'Photography Exec',
    'Technology Executive',
    'Arts Liaison'
  ];

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      
      try {
        const savedApplication = await loadApplicationProgress(user.uid);
        if (savedApplication && !forceStartFromBeginning) {
          setHasExistingApplication(true);
          setCurrentStep(2); // Go directly to questions if application exists
          setSelectedPosition(savedApplication.position);
          setAnswers(savedApplication.answers || {});
          
          if (savedApplication.status === 'submitted') {
            setCurrentStep(3); // Go to confirmation if already submitted
          }
        } else {
          // Start from the beginning
          setCurrentStep(0);
          setSelectedPosition('');
          setAnswers({});
          setUploadedFiles({});
          setHasExistingApplication(false);
        }
      } catch (error) {
        console.error('Error loading application progress:', error);
        toast({
          title: "Error",
          description: "Failed to load your application progress. Please try again.",
          variant: "destructive",
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
    setCurrentStep(1);
  };

  const handlePositionSelect = async () => {
    if (selectedPosition && user) {
      try {
        const progress = calculateProgress();
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
        
        setHasExistingApplication(true);
        setCurrentStep(2);
        toast({
          title: "Progress Saved",
          description: "Your position selection has been saved.",
        });
      } catch (error) {
        console.error('Error saving position selection:', error);
        toast({
          title: "Error",
          description: "Failed to save your selection. Please try again.",
          variant: "destructive",
        });
      }
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
      case 'Secretary': return 4;
      case 'Treasurer': return 6;
      case 'Community Outreach': return 6;
      case 'Athletics Liaison': return 5;
      case 'Promotions Officer': return 3;
      case 'Photography Exec': return 4;
      case 'Technology Executive': return 4;
      case 'Arts Liaison': return 5;
      default: return 1;
    }
  };

  const saveProgress = async () => {
    if (!user) return;
    
    try {
      const progress = calculateProgress();
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
            <p className="text-gray-600 text-sm sm:text-base">Ready to join the Student Activity Council?</p>
          </CardHeader>
          <CardContent className="text-center space-y-4 p-4 sm:p-6">
            <div className="bg-blue-50 p-3 rounded-lg text-xs sm:text-sm text-blue-800">
              Your progress is automatically saved. We recommend saving a backup of these answers on another safe platform too.
            </div>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Position Selection
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">Choose Your Position</CardTitle>
            <p className="text-gray-600 text-sm sm:text-base">Select the SAC position you'd like to apply for. You can only apply to one position.</p>
            {hasExistingApplication && !forceStartFromBeginning && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-800 font-medium">Position Already Selected</span>
                </div>
                <p className="text-amber-700 mt-1">
                  You've already selected {selectedPosition}. To change positions, you must reset your entire application.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetApplication}
                  className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  Reset Application
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Select 
              value={selectedPosition} 
              onValueChange={setSelectedPosition}
              disabled={hasExistingApplication && !forceStartFromBeginning}
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position} value={position} className="text-sm sm:text-base">
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="flex-1 text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handlePositionSelect}
                disabled={!selectedPosition || (hasExistingApplication && !forceStartFromBeginning)}
                className="flex-1 text-sm sm:text-base"
              >
                {hasExistingApplication && !forceStartFromBeginning ? 'Continue Application' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Position Questions
  if (currentStep === 2) {
    return (
      <PositionQuestions
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
