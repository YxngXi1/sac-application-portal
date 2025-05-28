import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveApplicationProgress, loadApplicationProgress } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import PositionQuestions from './PositionQuestions';
import ConfirmationPage from './ConfirmationPage';

const ApplicationFlow = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const positions = [
    'Secretary',
    'Treasurer', 
    'Community Outreach',
    'Athletics Liaison',
    'Promotions Officer',
    'Photography Exec'
  ];

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      
      try {
        const savedApplication = await loadApplicationProgress(user.uid);
        if (savedApplication) {
          setCurrentStep(2); // Go directly to questions if application exists
          setSelectedPosition(savedApplication.position);
          setAnswers(savedApplication.answers || {});
          
          if (savedApplication.status === 'submitted') {
            setCurrentStep(3); // Go to confirmation if already submitted
          }
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
  }, [user, toast]);

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

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
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
      case 'Secretary': return 3;
      case 'Treasurer': return 2;
      case 'Community Outreach': return 3;
      case 'Athletics Liaison': return 3;
      case 'Promotions Officer': return 3;
      case 'Photography Exec': return 1;
      default: return 0;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Start Your Application</CardTitle>
            <p className="text-gray-600">Ready to join the Student Activity Council?</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Choose Your Position</CardTitle>
            <p className="text-gray-600">Select the SAC position you'd like to apply for. You can only apply to one position.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handlePositionSelect}
                disabled={!selectedPosition}
                className="flex-1"
              >
                Next
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
        onAnswerChange={handleAnswerChange}
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
        onBack={isSubmitted ? undefined : handleBack}
        onSubmissionComplete={handleSubmissionComplete}
      />
    );
  }

  return null;
};

export default ApplicationFlow;
