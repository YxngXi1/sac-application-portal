
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Clock } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';

interface InterviewGraderProps {
  candidate: ApplicationData;
  onBack: () => void;
}

interface InterviewQuestion {
  id: string;
  question: string;
  maxScore: number;
}

const InterviewGrader: React.FC<InterviewGraderProps> = ({ candidate, onBack }) => {
  const { toast } = useToast();
  
  const interviewQuestions: InterviewQuestion[] = [
    { id: 'leadership', question: 'Describe a time when you demonstrated leadership skills.', maxScore: 20 },
    { id: 'teamwork', question: 'How do you handle conflicts within a team?', maxScore: 20 },
    { id: 'initiative', question: 'Tell us about a project you initiated on your own.', maxScore: 20 },
    { id: 'communication', question: 'How would you communicate SAC events to the student body?', maxScore: 20 },
    { id: 'commitment', question: 'How will you balance SAC responsibilities with your studies?', maxScore: 20 }
  ];

  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const handleScoreChange = (questionId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [questionId]: score
    }));
  };

  const handleFeedbackChange = (questionId: string, text: string) => {
    setFeedback(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSubmitGrades = () => {
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const maxTotal = interviewQuestions.reduce((sum, q) => sum + q.maxScore, 0);
    
    toast({
      title: "Interview Grades Submitted",
      description: `Total Score: ${totalScore}/${maxTotal} for ${candidate.userProfile?.fullName}`,
    });
    
    onBack();
  };

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxTotal = interviewQuestions.reduce((sum, q) => sum + q.maxScore, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview View
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Grading
          </h1>
          <p className="text-gray-600">
            Grade the candidate's interview responses
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {/* Candidate Info */}
        <Card className="mb-8 border shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {candidate.userProfile?.fullName || 'N/A'}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Position: {candidate.position}</span>
                    <span>Grade {candidate.userProfile?.grade}</span>
                    <span>Student #{candidate.userProfile?.studentNumber}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 mt-1">
                    Application Score: {candidate.score || 0}/100
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {totalScore}/{maxTotal}
                </div>
                <div className="text-sm text-gray-600">Interview Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Questions */}
        <div className="space-y-6">
          {interviewQuestions.map((question, index) => (
            <Card key={question.id} className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Question {index + 1}</span>
                  <Badge variant="outline" className="border-gray-300">
                    Max: {question.maxScore} points
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  {question.question}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score (0-{question.maxScore})
                    </label>
                    <div className="flex gap-2">
                      {Array.from({ length: question.maxScore + 1 }, (_, i) => (
                        <Button
                          key={i}
                          variant={scores[question.id] === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScoreChange(question.id, i)}
                          className={scores[question.id] === i 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }
                        >
                          {i}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={feedback[question.id] || ''}
                      onChange={(e) => handleFeedbackChange(question.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter feedback for this response..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmitGrades}
            size="lg"
            className="bg-gray-800 hover:bg-gray-900 text-white px-8"
            disabled={Object.keys(scores).length !== interviewQuestions.length}
          >
            Submit Interview Grades
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewGrader;
