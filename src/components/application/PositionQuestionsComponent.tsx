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

  // Function to count words in a text
  const countWords = (text: string): number => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  // Function to check if answer exceeds word limit
  const isOverWordLimit = (questionId: string, text: string): boolean => {
    const question = questions.find(q => q.id === questionId);
    if (!question?.wordLimit) return false;
    return countWords(text) > question.wordLimit;
  };

  // Function to get word count status for styling
  const getWordCountStatus = (questionId: string, text: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question?.wordLimit) return 'normal';
    
    const wordCount = countWords(text);
    const limit = question.wordLimit;
    
    if (wordCount > limit) return 'over';
    if (wordCount >= limit * 0.9) return 'warning'; // 90% of limit
    return 'normal';
  };

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

    // Check for word limit violations
    const overLimitQuestions = questions.filter(q => 
      q.wordLimit && answers[q.id] && isOverWordLimit(q.id, answers[q.id])
    );

    if (overLimitQuestions.length > 0) {
      toast({
        title: "Word Limit Exceeded",
        description: `Please reduce the word count for questions that exceed their limit before proceeding.`,
        variant: "destructive",
      });
      return;
    }

    onNext();
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    const question = questions.find(q => q.id === questionId);
    
    // If there's a word limit and the new value exceeds it, show a toast
    if (question?.wordLimit && isOverWordLimit(questionId, value)) {
      toast({
        title: "Word Limit Exceeded",
        description: `This question has a ${question.wordLimit} word limit. Current count: ${countWords(value)} words.`,
        variant: "destructive",
      });
    }
    
    onAnswerChange(questionId, value);
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
            {questions.map((question, index) => {
              const currentAnswer = answers[question.id] || '';
              const wordCount = countWords(currentAnswer);
              const wordCountStatus = getWordCountStatus(question.id, currentAnswer);
              
              return (
                <div key={question.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    {index + 1}. {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {question.wordLimit && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">
                        Word limit: {question.wordLimit} words
                      </span>
                      <span className={`font-medium ${
                        wordCountStatus === 'over' ? 'text-red-600' :
                        wordCountStatus === 'warning' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {wordCount} / {question.wordLimit} words
                      </span>
                    </div>
                  )}
                  
                  {question.type === 'textarea' && (
                    <Textarea
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className={`min-h-[120px] resize-y ${
                        wordCountStatus === 'over' ? 'border-red-300 focus:border-red-500 focus:ring-red-200' :
                        wordCountStatus === 'warning' ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200' :
                        ''
                      }`}
                      required={question.required}
                    />
                  )}
                  
                  {question.wordLimit && wordCountStatus === 'over' && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ This answer exceeds the word limit. Please reduce it to {question.wordLimit} words or fewer.
                    </p>
                  )}
                </div>
              );
            })}
            
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