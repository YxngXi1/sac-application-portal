
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PositionQuestions from './PositionQuestions';
import ConfirmationPage from './ConfirmationPage';

const ApplicationFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const positions = [
    'Secretary',
    'Treasurer', 
    'Community Outreach',
    'Athletics Liaison',
    'Promotions Officer',
    'Photography Exec'
  ];

  const handleGetStarted = () => {
    setCurrentStep(1);
  };

  const handlePositionSelect = () => {
    if (selectedPosition) {
      setCurrentStep(2);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const saveProgress = () => {
    // Save to localStorage for now
    localStorage.setItem('applicationProgress', JSON.stringify({
      currentStep,
      selectedPosition,
      answers
    }));
  };

  React.useEffect(() => {
    // Load saved progress on mount
    const saved = localStorage.getItem('applicationProgress');
    if (saved) {
      const progress = JSON.parse(saved);
      setCurrentStep(progress.currentStep);
      setSelectedPosition(progress.selectedPosition);
      setAnswers(progress.answers);
    }
  }, []);

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
        onBack={handleBack}
      />
    );
  }

  return null;
};

export default ApplicationFlow;
