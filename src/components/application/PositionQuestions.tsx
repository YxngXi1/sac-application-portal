
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PositionQuestionsProps {
  position: string;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSave: () => Promise<void>;
}

const PositionQuestions: React.FC<PositionQuestionsProps> = ({
  position,
  answers,
  onAnswerChange,
  onNext,
  onBack,
  onSave
}) => {
  const { toast } = useToast();

  const getQuestions = () => {
    switch (position) {
      case 'Secretary':
        return [
          {
            id: 'secretary_1',
            type: 'textarea',
            question: 'Share an example of a time when you had to manage multiple commitments or deadlines. How did you organize yourself, and what tools or strategies did you use to stay on track?'
          },
          {
            id: 'secretary_2',
            type: 'textarea',
            question: "Being SAC's secretary requires a great deal of knowledge and attention to detail about SAC's events. During an event like Charity Week, the Secretary has a lot of responsibilities and must get things done on time independently, with little guidance from other executives. Explain what duties you think would need to be done as Secretary during Charity Week, and create a timeline for these tasks to be completed."
          },
          {
            id: 'secretary_3',
            type: 'textarea',
            question: "What's one strength you have that you think will help you be a great secretary? Give a brief example of how you've used that strength in the past."
          }
        ];

      case 'Treasurer':
        return [
          {
            id: 'treasurer_1',
            type: 'textarea',
            question: 'Describe a time when you managed money or helped organize a budget, even if it was for something small like a club, a fundraiser, or a family project. How did you keep track of what was coming in and going out?'
          },
          {
            id: 'treasurer_2',
            type: 'textarea',
            question: "Imagine you're managing a budget for a school event, but the cost of something important is more than you expected. In a short paragraph, explain how you'd handle the situation to make sure the event still happens without overspending."
          }
        ];

      case 'Community Outreach':
        return [
          {
            id: 'outreach_1',
            type: 'textarea',
            question: 'Describe any volunteer work or community service activities you have participated in. What did you enjoy about these experiences?'
          },
          {
            id: 'outreach_2',
            type: 'textarea',
            question: 'What was your favourite SAC event this year that heavily involved input from the Community Outreach executive?'
          },
          {
            id: 'outreach_3',
            type: 'textarea',
            question: 'Community outreach requires strong communication and relationship-building skills. Share an example of a time when you successfully worked with others to achieve a goal'
          }
        ];

      case 'Athletics Liaison':
        return [
          {
            id: 'athletics_1',
            type: 'textarea',
            question: 'Being an athletics liaison requires knowledge of the athletics programs here at Fraser. What experience do you have with athletics at Fraser? This includes taking phys-ed classes, being a part of sports teams, and/or being on the Fraser Athletics Council (FAC). What experience, if any, do you have on SAC?'
          },
          {
            id: 'athletics_2',
            type: 'textarea',
            question: 'Being the Athletics Liaison involves liaison between both FAC and SAC. Explain a time where you led or were part of a sports-related event, either at school or outside. Clearly detail your role, and how you contributed to the success of your event.'
          },
          {
            id: 'athletics_3',
            type: 'textarea',
            question: "As the Athletics Liaison, you'll need to communicate between two councils. Describe a time when you successfully helped different groups work together toward a common goal."
          }
        ];

      case 'Promotions Officer':
        return [
          {
            id: 'promotions_1',
            type: 'file',
            question: 'Create a cohesive, engaging video promoting a SAC event using the provided clips',
            note: 'Upload your edited video file'
          },
          {
            id: 'promotions_2',
            type: 'file',
            question: 'Make a poster for carnival and upload to form',
            note: 'Upload your carnival poster design'
          },
          {
            id: 'promotions_3',
            type: 'textarea',
            question: 'What access do you have to digital media and editing platforms?'
          }
        ];

      case 'Photography Exec':
        return [
          {
            id: 'photo_1',
            type: 'file',
            question: 'Submit a good photo you\'ve taken',
            note: 'Upload your best photography work'
          }
        ];

      default:
        return [];
    }
  };

  const questions = getQuestions();
  const isComplete = questions.every(q => answers[q.id]);

  const handleSave = async () => {
    try {
      await onSave();
      toast({
        title: "Progress Saved",
        description: "Your application progress has been saved to Firebase.",
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

  const handleSaveAndGoBack = async () => {
    try {
      await onSave();
      toast({
        title: "Progress Saved",
        description: "Your application progress has been saved.",
      });
      onBack();
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{position} Application</CardTitle>
            <p className="text-gray-600">Please answer all questions below. Your progress is automatically saved to Firebase.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <Label className="text-base font-medium">
                  {index + 1}. {question.question}
                </Label>
                {question.note && (
                  <p className="text-sm text-gray-500">{question.note}</p>
                )}
                
                {question.type === 'textarea' ? (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                    placeholder="Enter your answer here..."
                    className="min-h-[120px]"
                  />
                ) : question.type === 'file' ? (
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onAnswerChange(question.id, file.name);
                      }
                    }}
                    accept={question.id.includes('video') ? 'video/*' : 
                           question.id.includes('poster') ? 'image/*' : 
                           question.id.includes('photo') ? 'image/*' : '*'}
                  />
                ) : null}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
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
                onClick={handleSaveAndGoBack}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Go Back
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
                onClick={onNext}
                disabled={!isComplete}
                className="flex-1"
              >
                Review & Submit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionQuestions;
