
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import positionQuestions from './PositionQuestions';

interface PositionQuestionsComponentProps {
  position: string;
  answers: Record<string, string>;
  uploadedFiles: Record<string, File[]>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onFileChange: (questionId: string, files: File[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSave: () => Promise<void>;
}

const PositionQuestionsComponent: React.FC<PositionQuestionsComponentProps> = ({
  position,
  answers,
  onAnswerChange,
  onNext,
  onBack,
  onSave
}) => {
  const { toast } = useToast();
  const questions = positionQuestions[position] || [];

  const handleSave = async () => {
    try {
      await onSave();
      toast({
        title: "Progress Saved",
        description: "Your answers have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    // Check if all required questions are answered
    const unansweredRequired = questions.filter(q => 
      q.required && (!answers[q.id] || answers[q.id].trim() === '')
    );

    if (unansweredRequired.length > 0) {
      toast({
        title: "Incomplete Application",
        description: `Please answer all required questions before proceeding.`,
        variant: "destructive",
      });
      return;
    }

    onNext();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{position} Application Questions</CardTitle>
            <p className="text-gray-600">Please answer all questions thoroughly. Your responses will help us understand your qualifications and motivation.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {question.type === 'textarea' && (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[120px] resize-y"
                    required={question.required}
                  />
                )}
              </div>
            ))}
            
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSave}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Progress
              </Button>
              <Button 
                onClick={handleNext}
                className="flex-1"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionQuestionsComponent;
