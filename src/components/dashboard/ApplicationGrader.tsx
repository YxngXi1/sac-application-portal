
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Star } from 'lucide-react';

interface ApplicationGraderProps {
  applicantId: string;
  applicantName: string;
  positionName: string;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  answer: string;
  score: number;
  maxScore: number;
}

const ApplicationGrader: React.FC<ApplicationGraderProps> = ({
  applicantId,
  applicantName,
  positionName,
  onBack
}) => {
  // Mock application data
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      question: 'Why do you want to join Student Council?',
      answer: 'I am passionate about making positive changes in our school community. I believe student council provides an excellent platform to voice student concerns and implement meaningful initiatives that can improve our school experience for everyone.',
      score: 8,
      maxScore: 10
    },
    {
      id: '2',
      question: 'Describe a leadership experience you have had.',
      answer: 'Last year, I organized a charity drive for the local food bank. I coordinated with 15 volunteers, created promotional materials, and managed the collection process. We collected over 500 items and raised $300 in donations.',
      score: 9,
      maxScore: 10
    },
    {
      id: '3',
      question: 'What specific skills would you bring to this position?',
      answer: 'I have strong organizational skills from managing multiple projects, excellent communication abilities from my debate team experience, and creative problem-solving skills that I have developed through various group projects.',
      score: 7,
      maxScore: 10
    },
    {
      id: '4',
      question: 'How would you handle conflicts between different student groups?',
      answer: 'I would listen to all parties involved, identify common ground, and work towards a solution that addresses everyone\'s core concerns. I believe in open dialogue and finding compromises that benefit the entire school community.',
      score: 8,
      maxScore: 10
    }
  ]);

  const updateScore = (questionId: string, newScore: number) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, score: Math.max(0, Math.min(q.maxScore, newScore)) }
          : q
      )
    );
  };

  const averageScore = questions.reduce((sum, q) => sum + q.score, 0) / questions.length;

  const handleSave = () => {
    // Save scores to database
    console.log('Saving scores for applicant:', applicantId);
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Button variant="ghost" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Grading: {applicantName}
              </h1>
              <p className="text-gray-600">
                Position: {positionName}
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{averageScore.toFixed(1)}/10</span>
              </div>
              <Badge variant="secondary">
                Current Average
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions and Answers */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Responses</CardTitle>
                <CardDescription>
                  Review the applicant's answers below
                </CardDescription>
              </CardHeader>
            </Card>

            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Question {index + 1}
                  </CardTitle>
                  <CardDescription>
                    {question.question}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed">
                      {question.answer}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scoring Panel */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Score Questions</CardTitle>
                <CardDescription>
                  Rate each response out of {questions[0]?.maxScore || 10} points
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={`score-${question.id}`}>
                      Question {index + 1} Score
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`score-${question.id}`}
                        type="number"
                        min="0"
                        max={question.maxScore}
                        value={question.score}
                        onChange={(e) => updateScore(question.id, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">
                        / {question.maxScore}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Average Score</Label>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-xl font-bold">{averageScore.toFixed(1)}/10</span>
                    </div>
                  </div>
                  
                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Scores
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationGrader;
