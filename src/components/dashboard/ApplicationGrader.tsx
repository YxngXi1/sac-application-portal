
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Star } from 'lucide-react';
import { ApplicationData, saveApplicationGrades, getApplicationGrades } from '@/services/applicationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ApplicationGraderProps {
  application: ApplicationData;
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
  application,
  positionName,
  onBack
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGradesAndAnswers = async () => {
      try {
        // Load existing grades if any
        const existingGrades = await getApplicationGrades(application.id);
        
        // Convert application answers to questions format
        const questionsList: Question[] = Object.entries(application.answers || {}).map(([key, answer], index) => {
          const existingGrade = existingGrades?.grades.find(g => g.questionId === key);
          
          return {
            id: key,
            question: `Question ${index + 1}`, // You might want to store actual questions
            answer: answer as string,
            score: existingGrade?.score || 0,
            maxScore: existingGrade?.maxScore || 10
          };
        });

        setQuestions(questionsList);
      } catch (error) {
        console.error('Error loading grades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGradesAndAnswers();
  }, [application.id, application.answers]);

  const updateScore = (questionId: string, newScore: number) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, score: Math.max(0, Math.min(q.maxScore, newScore)) }
          : q
      )
    );
  };

  const averageScore = questions.length > 0 ? 
    questions.reduce((sum, q) => sum + q.score, 0) / questions.length : 0;

  const handleSave = async () => {
    if (!userProfile?.uid) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const gradesData = {
        applicationId: application.id,
        grades: questions.map(q => ({
          questionId: q.id,
          score: q.score,
          maxScore: q.maxScore,
          feedback: ''
        })),
        totalScore: averageScore,
        maxTotalScore: 10,
        gradedBy: userProfile.uid,
        gradedAt: new Date()
      };

      await saveApplicationGrades(gradesData);
      
      toast({
        title: "Grades Saved",
        description: "Application has been graded successfully.",
      });
      
      onBack();
    } catch (error) {
      console.error('Error saving grades:', error);
      toast({
        title: "Error",
        description: "Failed to save grades. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
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
                Grading: {application.userProfile?.fullName || 'Unknown Applicant'}
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
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle>Application Responses</CardTitle>
                <CardDescription>
                  Review the applicant's answers below
                </CardDescription>
              </CardHeader>
            </Card>

            {questions.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No responses found for this application.</p>
                </CardContent>
              </Card>
            ) : (
              questions.map((question, index) => (
                <Card key={question.id} className="border-0 shadow-lg bg-white">
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
              ))
            )}
          </div>

          {/* Scoring Panel */}
          <div className="space-y-6">
            <Card className="sticky top-8 border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle>Score Questions</CardTitle>
                <CardDescription>
                  Rate each response out of 10 points
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
                  
                  <Button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
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
