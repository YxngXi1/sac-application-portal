import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, User, Clock, Star, Users, MessageSquare } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface InterviewGraderProps {
  candidate: ApplicationData;
  onBack: () => void;
}

interface InterviewQuestion {
  id: string;
  question: string;
  maxScore: number;
}

interface PanelMemberGrade {
  panelMemberId: string;
  panelMemberName: string;
  grades: Record<string, number>;
  feedback: string;
  submittedAt: Date;
}

interface InterviewGrades {
  candidateId: string;
  panelGrades: PanelMemberGrade[];
  averageScore: number;
}

const InterviewGrader: React.FC<InterviewGraderProps> = ({ candidate, onBack }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const interviewQuestions: InterviewQuestion[] = [
    { id: 'sac_motivation', question: 'Why do you want to join SAC?', maxScore: 5 },
    { id: 'question_2', question: 'To be added later', maxScore: 5 },
    { id: 'question_3', question: 'To be added later', maxScore: 5 },
    { id: 'question_4', question: 'To be added later', maxScore: 5 },
    { id: 'question_5', question: 'To be added later', maxScore: 5 }
  ];

  const [myGrades, setMyGrades] = useState<Record<string, number>>({});
  const [myFeedback, setMyFeedback] = useState<string>('');
  const [allPanelGrades, setAllPanelGrades] = useState<PanelMemberGrade[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock panel members - in a real app, this would come from the scheduled interview data
  const panelMembers = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Sarah Johnson' },
    { id: '3', name: 'Mike Chen' }
  ];

  useEffect(() => {
    // Load existing grades for this interview
    loadInterviewGrades();
  }, [candidate.id]);

  const loadInterviewGrades = async () => {
    try {
      // Mock loading existing grades - in a real app, this would be from your database
      const mockGrades: PanelMemberGrade[] = [
        {
          panelMemberId: '2',
          panelMemberName: 'Sarah Johnson',
          grades: { sac_motivation: 4, question_2: 0, question_3: 0, question_4: 0, question_5: 0 },
          feedback: 'Great enthusiasm and clear understanding of SAC goals.',
          submittedAt: new Date()
        }
      ];
      
      setAllPanelGrades(mockGrades);
      
      // Load my existing grades if any
      const myExistingGrades = mockGrades.find(g => g.panelMemberId === userProfile?.uid);
      if (myExistingGrades) {
        setMyGrades(myExistingGrades.grades);
        setMyFeedback(myExistingGrades.feedback);
      }
    } catch (error) {
      console.error('Error loading interview grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setMyGrades(prev => ({
      ...prev,
      [questionId]: score
    }));
  };

  const getMyScore = () => {
    const scores = Object.values(myGrades);
    const activeScores = scores.filter(score => score > 0);
    return activeScores.length > 0 ? activeScores.reduce((sum, score) => sum + score, 0) / activeScores.length : 0;
  };

  const getOtherPanelMemberGrades = (questionId: string) => {
    return allPanelGrades
      .filter(grade => grade.panelMemberId !== userProfile?.uid)
      .map(grade => ({
        name: grade.panelMemberName,
        score: grade.grades[questionId] || 0
      }));
  };

  const handleSubmitGrades = async () => {
    if (!userProfile?.uid || !userProfile?.fullName) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create or update my grades
      const myGradeData: PanelMemberGrade = {
        panelMemberId: userProfile.uid,
        panelMemberName: userProfile.fullName,
        grades: myGrades,
        feedback: myFeedback,
        submittedAt: new Date()
      };

      // Update the panel grades array
      const updatedGrades = allPanelGrades.filter(g => g.panelMemberId !== userProfile.uid);
      updatedGrades.push(myGradeData);
      setAllPanelGrades(updatedGrades);

      // Calculate average score
      const totalScore = getMyScore();
      
      toast({
        title: "Interview Grades Submitted",
        description: `Your grades submitted for ${candidate.userProfile?.fullName} (Score: ${totalScore.toFixed(1)}/5)`,
      });
      
    } catch (error) {
      console.error('Error submitting grades:', error);
      toast({
        title: "Error",
        description: "Failed to submit grades",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview View
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Grading
          </h1>
          <p className="text-gray-600">
            Grade the candidate's interview responses (Scale: 0-5 with 0.5 increments)
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
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
                  {getMyScore().toFixed(1)}/5
                </div>
                <div className="text-sm text-gray-600">My Interview Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions and Grading */}
          <div className="lg:col-span-2 space-y-6">
            {interviewQuestions.map((question, index) => {
              const otherGrades = getOtherPanelMemberGrades(question.id);
              const myScore = myGrades[question.id] || 0;
              const isPlaceholder = question.question === 'To be added later';
              
              return (
                <Card key={question.id} className="border shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">Question {index + 1}</span>
                      <Badge variant="outline" className="border-gray-300">
                        Max: {question.maxScore} points
                      </Badge>
                    </CardTitle>
                    <CardDescription className={`text-base ${isPlaceholder ? 'italic text-gray-400' : ''}`}>
                      {question.question}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {!isPlaceholder && (
                        <>
                          {/* My Grading */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Score (0-{question.maxScore})
                            </label>
                            <div className="flex gap-1">
                              {Array.from({ length: 11 }, (_, i) => i * 0.5).map((score) => (
                                <Button
                                  key={score}
                                  variant={myScore === score ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleScoreChange(question.id, score)}
                                  className={`min-w-[40px] ${myScore === score 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Other Panel Members' Grades */}
                          {otherGrades.length > 0 && (
                            <div className="border-t pt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Other Panel Members
                              </label>
                              <div className="space-y-2">
                                {otherGrades.map((grade) => (
                                  <div key={grade.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium">{grade.name}</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-yellow-500" />
                                      <span className="font-semibold">{grade.score}/5</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {isPlaceholder && (
                        <div className="text-center py-4 text-gray-400 italic">
                          Question will be added later
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Panel Feedback Section */}
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Panel Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* My Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <Textarea
                    value={myFeedback}
                    onChange={(e) => setMyFeedback(e.target.value)}
                    className="w-full"
                    rows={3}
                    placeholder="Enter your feedback about the candidate's interview performance..."
                  />
                </div>

                {/* Other Panel Members' Feedback */}
                {allPanelGrades.filter(g => g.panelMemberId !== userProfile?.uid && g.feedback).length > 0 && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Other Panel Members' Feedback
                    </label>
                    <div className="space-y-3">
                      {allPanelGrades
                        .filter(g => g.panelMemberId !== userProfile?.uid && g.feedback)
                        .map((grade) => (
                          <div key={grade.panelMemberId} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{grade.panelMemberName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(grade.submittedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{grade.feedback}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            <Card className="sticky top-8 border shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Interview Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {panelMembers.map((member) => {
                  const memberGrades = allPanelGrades.find(g => g.panelMemberId === member.id);
                  const isMe = member.id === userProfile?.uid;
                  const hasGraded = isMe ? Object.keys(myGrades).length > 0 : !!memberGrades;
                  
                  let avgScore = 0;
                  if (isMe && Object.keys(myGrades).length > 0) {
                    avgScore = getMyScore();
                  } else if (memberGrades) {
                    const scores = Object.values(memberGrades.grades).filter(s => s > 0);
                    avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
                  }
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">
                          {member.name} {isMe && '(You)'}
                        </span>
                      </div>
                      <div className="text-right">
                        {hasGraded ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{avgScore.toFixed(1)}/5</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitGrades}
              size="lg"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white"
              disabled={Object.keys(myGrades).length === 0}
            >
              Submit My Grades
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewGrader;
