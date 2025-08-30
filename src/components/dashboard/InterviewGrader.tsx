import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, User, Star, CheckCircle, Users } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface InterviewGraderProps {
  candidate: ApplicationData;
  interviewType: 'one' | 'two';
  onBack: () => void;
}

interface InterviewCheckboxes {
  pastExperience: boolean;
  roleKnowledge: boolean;
  leadershipSkills: boolean;
  creativeOutlook: boolean;
  timeManagement: boolean;
}

interface PanelMemberGrade {
  panelMemberId: string;
  panelMemberName: string;
  grades: Record<string, number>;
  checkboxes: InterviewCheckboxes;
  feedback: string;
  submittedAt: Date;
}

interface InterviewGrades {
  candidateId: string;
  interviewType: 'one' | 'two';
  panelGrades: PanelMemberGrade[];
  averageScore: number;
}

const InterviewGrader: React.FC<InterviewGraderProps> = ({ candidate, interviewType, onBack }) => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [checkboxes, setCheckboxes] = useState<InterviewCheckboxes>({
    pastExperience: false,
    roleKnowledge: false,
    leadershipSkills: false,
    creativeOutlook: false,
    timeManagement: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [panelGrades, setPanelGrades] = useState<PanelMemberGrade[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const getQuestionsForPosition = (position: string, interviewType: 'one' | 'two') => {
    const questionSets: Record<string, { one: string[], two: string[] }> = {
      'Honourary Member': {
        one: [
          'no idea what to put for the questions but this is for interview one',
          'no idea what to put for the questions but this is for interview one',
          'no idea what to put for the questions but this is for interview one',
        ],
        two: [
          'no idea what to put for the questions but this is for interview two',
          'no idea what to put for the questions but this is for interview two',
          'no idea what to put for the questions but this is for interview two',
        ]
      },
    };

    const positionQuestions = questionSets[position];
    if (!positionQuestions) {
      // Default questions if position not found
      return interviewType === 'one' 
        ? [
            "Tell us about yourself and why you are interested in this position.",
            "How would you handle challenges in this role?",
            "What makes you a good fit for this position?"
          ]
        : [
            "What specific contributions do you hope to make to the student council?",
            "How do you plan to stay engaged and active throughout the year?",
            "Describe a time when you went above and beyond in a leadership or service role."
          ];
    }

    return positionQuestions[interviewType];
  };

  const questions = getQuestionsForPosition(candidate.position, interviewType);

  // ...existing code remains the same...
  useEffect(() => {
    const loadExistingGrades = async () => {
      try {
        // Use separate document IDs for each interview type
        const gradeDocId = `${candidate.id}_interview_${interviewType}`;
        const gradeDoc = await getDoc(doc(db, 'interviewGrades', gradeDocId));
        
        if (gradeDoc.exists()) {
          const data = gradeDoc.data() as InterviewGrades;
          setPanelGrades(data.panelGrades || []);
          
          // Check if current user has already submitted
          const existingGrade = data.panelGrades?.find(pg => pg.panelMemberId === user?.uid);
          if (existingGrade) {
            setGrades(existingGrade.grades);
            setCheckboxes(existingGrade.checkboxes);
            setFeedback(existingGrade.feedback);
            setHasSubmitted(true);
          }
        }
      } catch (error) {
        console.error('Error loading existing grades:', error);
      }
    };

    if (user) {
      loadExistingGrades();
    }
  }, [candidate.id, interviewType, user]);

  const handleGradeChange = (questionIndex: number, score: number) => {
    setGrades(prev => ({
      ...prev,
      [`question_${questionIndex}`]: score
    }));
  };

  const handleCheckboxChange = (key: keyof InterviewCheckboxes, checked: boolean) => {
    setCheckboxes(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const newGrade: PanelMemberGrade = {
        panelMemberId: user.uid,
        panelMemberName: user.displayName || user.email || 'Unknown',
        grades,
        checkboxes,
        feedback,
        submittedAt: new Date()
      };

      // Update or create the interview grades document with separate ID for each interview
      const gradeDocId = `${candidate.id}_interview_${interviewType}`;
      const gradeDocRef = doc(db, 'interviewGrades', gradeDocId);
      const existingDoc = await getDoc(gradeDocRef);

      let updatedPanelGrades: PanelMemberGrade[];
      
      if (existingDoc.exists()) {
        const existingData = existingDoc.data() as InterviewGrades;
        updatedPanelGrades = existingData.panelGrades || [];
        
        // Remove existing grade from this panel member if it exists
        updatedPanelGrades = updatedPanelGrades.filter(pg => pg.panelMemberId !== user.uid);
        updatedPanelGrades.push(newGrade);
      } else {
        updatedPanelGrades = [newGrade];
      }

      // Calculate average score
      const allScores = updatedPanelGrades.map(panelGrade => {
        const scores = Object.values(panelGrade.grades).filter(s => s > 0);
        return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
      });
      
      const averageScore = allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0;

      const interviewGradeData: InterviewGrades = {
        candidateId: candidate.id,
        interviewType,
        panelGrades: updatedPanelGrades,
        averageScore
      };

      await setDoc(gradeDocRef, interviewGradeData);
      
      setPanelGrades(updatedPanelGrades);
      setHasSubmitted(true);
      
      // Show success feedback
      alert(`Interview ${interviewType === 'one' ? 'One' : 'Two'} grades submitted successfully!`);
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Error submitting grades. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormComplete = () => {
    const hasAllGrades = questions.every((_, index) => 
      grades[`question_${index}`] !== undefined && grades[`question_${index}`] > 0
    );
    return hasAllGrades && feedback.trim().length > 0;
  };

  const renderScoreButtons = (questionIndex: number) => {
    const currentScore = grades[`question_${questionIndex}`] || 0;
    
    return (
      <div className="grid grid-cols-11 gap-2 mt-4">
        {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((score) => (
          <Button
            key={score}
            variant={currentScore === score ? "default" : "outline"}
            size="sm"
            onClick={() => handleGradeChange(questionIndex, score)}
            className={`h-10 text-sm font-medium transition-all duration-200 ${
              currentScore === score 
                ? 'bg-blue-600 text-white shadow-md scale-105 border-blue-600' 
                : 'hover:bg-blue-50 hover:border-blue-300 hover:scale-102'
            }`}
            disabled={hasSubmitted}
          >
            {score}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview View
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview {interviewType === 'one' ? 'One' : 'Two'} Grading
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{candidate.userProfile?.fullName || 'N/A'}</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {candidate.position}
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  Grade {candidate.userProfile?.grade}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`border-2 ${
                    interviewType === 'one' 
                      ? 'border-blue-300 text-blue-700 bg-blue-50' 
                      : 'border-green-300 text-green-700 bg-green-50'
                  }`}
                >
                  Interview {interviewType === 'one' ? 'One' : 'Two'}
                </Badge>
              </div>
            </div>
            {hasSubmitted && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Submitted</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Add a notice about which interview this is */}
            <Card className={`border-2 shadow-sm ${
              interviewType === 'one' 
                ? 'border-blue-200 bg-blue-50' 
                : 'border-green-200 bg-green-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    interviewType === 'one' ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {interviewType === 'one' ? '1' : '2'}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      interviewType === 'one' ? 'text-blue-800' : 'text-green-800'
                    }`}>
                      Grading Interview {interviewType === 'one' ? 'One' : 'Two'}
                    </h3>
                    <p className={`text-sm ${
                      interviewType === 'one' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      This is the {interviewType === 'one' ? 'first' : 'second'} interview session for this candidate. 
                      Each interview has different questions to assess different aspects.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview Questions */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={index} className="border shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm text-white ${
                          interviewType === 'one' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {index + 1}
                        </div>
                        Question {index + 1} ({interviewType === 'one' ? 'Interview 1' : 'Interview 2'})
                      </CardTitle>
                      <Badge variant="outline" className={`${
                        interviewType === 'one' 
                          ? 'border-blue-300 text-blue-700 bg-blue-50' 
                          : 'border-green-300 text-green-700 bg-green-50'
                      }`}>
                        Max: 5 points
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                      {question}
                    </p>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Your Score (0-5)
                      </label>
                      {renderScoreButtons(index)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Assessment Criteria */}
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Assessment Criteria
                </CardTitle>
                <CardDescription>
                  Check all criteria that apply to this candidate during Interview {interviewType === 'one' ? 'One' : 'Two'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { key: 'pastExperience', label: 'Past Experience or attendance at SAC events' },
                    { key: 'roleKnowledge', label: 'Good knowledge of tasks involved for the role' },
                    { key: 'leadershipSkills', label: 'Good leadership skills and leadership experience' },
                    { key: 'creativeOutlook', label: 'Creative and energetic outlook for the tasks required for this role' },
                    { key: 'timeManagement', label: 'Seems organized and manages time well' }
                  ].map((criterion) => (
                    <div key={criterion.key} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      <Checkbox
                        id={criterion.key}
                        checked={checkboxes[criterion.key as keyof InterviewCheckboxes]}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange(criterion.key as keyof InterviewCheckboxes, checked as boolean)
                        }
                        disabled={hasSubmitted}
                        className="mt-0.5"
                      />
                      <label 
                        htmlFor={criterion.key} 
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
                      >
                        {criterion.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feedback Section */}
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Interview {interviewType === 'one' ? 'One' : 'Two'} Feedback</CardTitle>
                <CardDescription>
                  Provide detailed feedback about the candidate's performance in Interview {interviewType === 'one' ? 'One' : 'Two'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={`Enter your detailed feedback about the candidate's responses during Interview ${interviewType === 'one' ? 'One' : 'Two'}, communication skills, and overall impression...`}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-32 resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  disabled={hasSubmitted}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Interview Panel */}
              <Card className="border shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    Interview {interviewType === 'one' ? 'One' : 'Two'} Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {panelGrades.map((grade) => {
                    const isCurrentUser = grade.panelMemberId === user?.uid;
                    const avgScore = Object.values(grade.grades).length > 0 
                      ? (Object.values(grade.grades).reduce((sum, s) => sum + s, 0) / Object.values(grade.grades).length).toFixed(1)
                      : '0.0';
                    
                    return (
                      <div key={grade.panelMemberId} className={`p-3 rounded-lg border transition-all ${
                        isCurrentUser 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-sm text-gray-900">
                            {grade.panelMemberName}
                            {isCurrentUser && (
                              <span className="text-blue-600 ml-1 font-normal">(You)</span>
                            )}
                          </span>
                          <Star className="h-3 w-3 text-yellow-500 ml-auto" />
                        </div>
                        <div className="text-xs text-gray-600">
                          Score: <span className="font-medium text-blue-600">{avgScore}/5</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {panelGrades.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No grades submitted yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isFormComplete() 
                ? hasSubmitted 
                  ? `✅ Interview ${interviewType === 'one' ? 'One' : 'Two'} grades submitted successfully` 
                  : "✅ All fields completed - ready to submit"
                : "⚠️ Please complete all questions and provide feedback"
              }
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete() || submitting || hasSubmitted}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 font-medium shadow-md"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : hasSubmitted ? (
                'Submitted'
              ) : (
                `Submit Interview ${interviewType === 'one' ? 'One' : 'Two'} Grades`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewGrader;