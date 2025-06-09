
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
  panelGrades: PanelMemberGrade[];
  averageScore: number;
}

const InterviewGrader: React.FC<InterviewGraderProps> = ({ candidate, onBack }) => {
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

  const getQuestionsForPosition = (position: string) => {
    const questionSets: Record<string, string[]> = {
      'Promotions Officer': [
        "Explain the promotional material you created and why you feel it is beneficial for promoting the SAC event.",
        "Can you give an example of a time when you had to plan something under tight deadlines? What steps did you take to ensure it was done well, and what did you learn from that experience? In other words, can you get work done quickly and efficiently?",
        "What do you think is the biggest challenge in getting students excited about school events, and how would you approach solving it?",
        "If you were to look back at the end of the year, what would success as a promotions officer look like for you? What would you want to be remembered for?"
      ],
      'Photography Exec': [
        "Photography can involve a lot of behind-the-scenes work—like editing and sorting photos quickly. How do you manage your time and stay organized with these tasks?",
        "Can you walk us through your experience with photography? What types of photos do you most enjoy taking, and why?",
        "School events are often fast-paced and unpredictable. How would you ensure you're able to capture the most important and interesting moments?",
        "Imagine you are at an SAC event and all your members are having fun, but your duty is to take photos for the event, how would you manage this?",
        "Can you think of a new way that photos or photography could be more visible in the school other than on social media?"
      ],
      'Secretary': [
        "Imagine you're faced with several tasks at once—taking minutes during a meeting, managing event sign-ups, and updating the council's calendar. How would you prioritize and manage these tasks to ensure they're all done well?",
        "Tell me about a time you made a mistake in organizing or managing information. How did you address it and what did you learn from the experience?",
        "Being detail-oriented is key for a secretary. Can you give me an example of a time when paying attention to the small details made a big difference?",
        "The current role of the Secretary, outside of Council meetings, is to update the SAC website, publish meeting agendas, and draft up announcements for SAC. What other responsibilities as secretary do you want to take on and how can you put your head down, stay motivated, and work?",
        "Sometimes the secretary's job can be slow depending on the time of year. How else can you play a big role in council when you aren't doing secretarial work?"
      ],
      'Treasurer': [
        "What's one idea you have for using the treasurer role to make a positive impact on the student council and the school? Write a few sentences explaining your idea and how you'd make it happen.",
        "With emerging technology developed by this year's Council, and the role of the Treasurer becoming more limited and with less responsibilities, what do you propose that the treasurer for the 2025/2026 year take on? These responsibilities can include the continuity of current responsibilities or new responsibilities.",
        "Our members contribute cash in the fall for SAC snacks. How would you ensure this money would last the school year and be accounted for."
      ],
      'Community Outreach': [
        "Community outreach often means connecting with many different people. How do you approach building relationships with people you don't know well?",
        "Community outreach requires strong communication and relationship-building skills. Share an example of a time when you successfully worked with others to achieve a goal",
        "Food drives are a common community outreach activity. If you were responsible for organizing a food drive at John Fraser, how would you plan it to make sure it's successful and engages as many students as possible?"
      ],
      'Athletics Liaison': [
        "Being the Athletics Liaison is a very innovative position, and the Athletics Liaisons in the last couple of years have created new events that have had great turnouts. For example, one liaison created the Spring Dance, while the other created the Fraser Games. What ideas do you have for this role? If you would create an event, or improve an existing one, how would you do so?",
        "The Fraser Games was brought back this year by our Athletics Liaison. Say you become the Athletics Liaison, and you have spent weeks planning this event, but the assigned SAC and FAC volunteers haven't shown up to a station. What would you do?",
        "How would you handle a situation where the Athletics Council and SAC have different opinions about an event or project? How would you help both sides reach an agreement?"
      ],
      'Arts Liaison': [
        "If you could only run one major event this year, how would you choose what it is, and what would you prioritize in planning it?",
        "Tell us about a time you had to mediate between creative differences in a team. How did you approach it?",
        "If you had to plan a collaborative event with the Music or Drama department, what would it look like?",
        "If you could change how the school values or supports the arts, what would you do—and how would you make it happen?"
      ]
    };

    return questionSets[position] || [
      "Tell us about yourself and why you are interested in this position.",
      "How would you handle challenges in this role?",
      "What makes you a good fit for this position?"
    ];
  };

  const questions = getQuestionsForPosition(candidate.position);

  useEffect(() => {
    const loadExistingGrades = async () => {
      try {
        const gradeDoc = await getDoc(doc(db, 'interviewGrades', candidate.id));
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
  }, [candidate.id, user]);

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

      // Update or create the interview grades document
      const gradeDocRef = doc(db, 'interviewGrades', candidate.id);
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
        panelGrades: updatedPanelGrades,
        averageScore
      };

      await setDoc(gradeDocRef, interviewGradeData);
      
      setPanelGrades(updatedPanelGrades);
      setHasSubmitted(true);
      
      // Show success feedback
      alert('Grades submitted successfully!');
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
                Interview Grading
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
            {/* Interview Questions */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={index} className="border shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        Question {index + 1}
                      </CardTitle>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
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
                  Check all criteria that apply to this candidate
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
                <CardTitle>Additional Feedback</CardTitle>
                <CardDescription>
                  Provide detailed feedback about the candidate's interview performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your detailed feedback about the candidate's responses, communication skills, and overall impression..."
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
                    Interview Panel
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
                  ? "✅ Grades have been submitted successfully" 
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
                'Submit My Grades'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewGrader;
