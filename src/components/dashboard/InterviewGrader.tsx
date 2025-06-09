import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, User, Clock, Star, Users, MessageSquare, CheckSquare, Award, Target } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InterviewGraderProps {
  candidate: ApplicationData;
  onBack: () => void;
}

interface InterviewQuestion {
  id: string;
  question: string;
  maxScore: number;
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

interface Executive {
  id: string;
  name: string;
  email: string;
}

const InterviewGrader: React.FC<InterviewGraderProps> = ({ candidate, onBack }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const getInterviewQuestions = (position: string): InterviewQuestion[] => {
    const questionsMap: Record<string, InterviewQuestion[]> = {
      'Promotions Officer': [
        { id: 'promo_material', question: 'Explain the promotional material you created and why you feel it is beneficial for promoting the SAC event.', maxScore: 5 },
        { id: 'tight_deadlines', question: 'Can you give an example of a time when you had to plan something under tight deadlines? What steps did you take to ensure it was done well, and what did you learn from that experience? In other words, can you get work done quickly and efficiently?', maxScore: 5 },
        { id: 'student_excitement', question: 'What do you think is the biggest challenge in getting students excited about school events, and how would you approach solving it?', maxScore: 5 },
        { id: 'success_vision', question: 'If you were to look back at the end of the year, what would success as a promotions officer look like for you? What would you want to be remembered for?', maxScore: 5 }
      ],
      'Photography Exec': [
        { id: 'time_management', question: 'Photography can involve a lot of behind-the-scenes work—like editing and sorting photos quickly. How do you manage your time and stay organized with these tasks?', maxScore: 5 },
        { id: 'photo_experience', question: 'Can you walk us through your experience with photography? What types of photos do you most enjoy taking, and why?', maxScore: 5 },
        { id: 'event_moments', question: 'School events are often fast-paced and unpredictable. How would you ensure you\'re able to capture the most important and interesting moments?', maxScore: 5 },
        { id: 'duty_balance', question: 'Imagine you are at an SAC event and all your members are having fun, but your duty is to take photos for the event, how would you manage this?', maxScore: 5 },
        { id: 'photo_visibility', question: 'Can you think of a new way that photos or photography could be more visible in the school other than on social media?', maxScore: 5 }
      ],
      'Secretary': [
        { id: 'task_prioritization', question: 'Imagine you\'re faced with several tasks at once—taking minutes during a meeting, managing event sign-ups, and updating the council\'s calendar. How would you prioritize and manage these tasks to ensure they\'re all done well?', maxScore: 5 },
        { id: 'mistake_learning', question: 'Tell me about a time you made a mistake in organizing or managing information. How did you address it and what did you learn from the experience?', maxScore: 5 },
        { id: 'attention_detail', question: 'Being detail-oriented is key for a secretary. Can you give me an example of a time when paying attention to the small details made a big difference?', maxScore: 5 },
        { id: 'additional_responsibilities', question: 'The current role of the Secretary, outside of Council meetings, is to update the SAC website, publish meeting agendas, and draft up announcements for SAC. What other responsibilities as secretary do you want to take on and how can you put your head down, stay motivated, and work?', maxScore: 5 },
        { id: 'council_involvement', question: 'Sometimes the secretary\'s job can be slow depending on the time of year. How else can you play a big role in council when you aren\'t doing secretarial work?', maxScore: 5 }
      ],
      'Treasurer': [
        { id: 'positive_impact', question: 'What\'s one idea you have for using the treasurer role to make a positive impact on the student council and the school? Write a few sentences explaining your idea and how you\'d make it happen.', maxScore: 5 },
        { id: 'role_evolution', question: 'With emerging technology developed by this year\'s Council, and the role of the Treasurer becoming more limited and with less responsibilities, what do you propose that the treasurer for the 2025/2026 year take on? These responsibilities can include the continuity of current responsibilities or new responsibilities.', maxScore: 5 },
        { id: 'money_management', question: 'Our members contribute cash in the fall for SAC snacks. How would you ensure this money would last the school year and be accounted for.', maxScore: 5 }
      ],
      'Community Outreach': [
        { id: 'relationship_building', question: 'Community outreach often means connecting with many different people. How do you approach building relationships with people you don\'t know well?', maxScore: 5 },
        { id: 'teamwork_example', question: 'Community outreach requires strong communication and relationship-building skills. Share an example of a time when you successfully worked with others to achieve a goal', maxScore: 5 },
        { id: 'food_drive_planning', question: 'Food drives are a common community outreach activity. If you were responsible for organizing a food drive at John Fraser, how would you plan it to make sure it\'s successful and engages as many students as possible?', maxScore: 5 }
      ],
      'Athletics Liaison': [
        { id: 'innovative_ideas', question: 'Being the Athletics Liaison is a very innovative position, and the Athletics Liaisons in the last couple of years have created new events that have had great turnouts. For example, one liaison created the Spring Dance, while the other created the Fraser Games. What ideas do you have for this role? If you would create an event, or improve an existing one, how would you do so?', maxScore: 5 },
        { id: 'volunteer_crisis', question: 'The Fraser Games was brought back this year by our Athletics Liaison. Say you become the Athletics Liaison, and you have spent weeks planning this event, but the assigned SAC and FAC volunteers haven\'t shown up to a station. What would you do?', maxScore: 5 },
        { id: 'conflict_resolution', question: 'How would you handle a situation where the Athletics Council and SAC have different opinions about an event or project? How would you help both sides reach an agreement?', maxScore: 5 }
      ],
      'Arts Liaison': [
        { id: 'major_event_choice', question: 'If you could only run one major event this year, how would you choose what it is, and what would you prioritize in planning it?', maxScore: 5 },
        { id: 'creative_mediation', question: 'Tell us about a time you had to mediate between creative differences in a team. How did you approach it?', maxScore: 5 },
        { id: 'collaborative_event', question: 'If you had to plan a collaborative event with the Music or Drama department, what would it look like?', maxScore: 5 },
        { id: 'arts_support_change', question: 'If you could change how the school values or supports the arts, what would you do—and how would you make it happen?', maxScore: 5 }
      ]
    };

    return questionsMap[position] || [];
  };

  const interviewQuestions = getInterviewQuestions(candidate.position);

  const [myGrades, setMyGrades] = useState<Record<string, number>>({});
  const [myCheckboxes, setMyCheckboxes] = useState<InterviewCheckboxes>({
    pastExperience: false,
    roleKnowledge: false,
    leadershipSkills: false,
    creativeOutlook: false,
    timeManagement: false
  });
  const [myFeedback, setMyFeedback] = useState<string>('');
  const [allPanelGrades, setAllPanelGrades] = useState<PanelMemberGrade[]>([]);
  const [panelMembers, setPanelMembers] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load panel members (executives)
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'superadmin'));
        const querySnapshot = await getDocs(q);
        
        const executives: Executive[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          executives.push({
            id: doc.id,
            name: userData.name || userData.fullName || 'Unnamed User',
            email: userData.email || ''
          });
        });
        
        setPanelMembers(executives);

        // Load existing interview grades
        await loadInterviewGrades();
      } catch (error) {
        console.error('Error loading interview data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candidate.id]);

  const loadInterviewGrades = async () => {
    try {
      const interviewGradesDoc = await getDoc(doc(db, 'interviewGrades', candidate.id));
      
      if (interviewGradesDoc.exists()) {
        const gradesData = interviewGradesDoc.data();
        const panelGrades: PanelMemberGrade[] = gradesData.panelGrades || [];
        
        setAllPanelGrades(panelGrades);
        
        // Load my existing grades if any
        const myExistingGrades = panelGrades.find(g => g.panelMemberId === userProfile?.uid);
        if (myExistingGrades) {
          setMyGrades(myExistingGrades.grades);
          setMyCheckboxes(myExistingGrades.checkboxes || {
            pastExperience: false,
            roleKnowledge: false,
            leadershipSkills: false,
            creativeOutlook: false,
            timeManagement: false
          });
          setMyFeedback(myExistingGrades.feedback);
        }
      }
    } catch (error) {
      console.error('Error loading interview grades:', error);
    }
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setMyGrades(prev => ({
      ...prev,
      [questionId]: score
    }));
  };

  const handleCheckboxChange = (checkboxKey: keyof InterviewCheckboxes, checked: boolean) => {
    setMyCheckboxes(prev => ({
      ...prev,
      [checkboxKey]: checked
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
        checkboxes: myCheckboxes,
        feedback: myFeedback,
        submittedAt: new Date()
      };

      // Update the panel grades array
      const updatedGrades = allPanelGrades.filter(g => g.panelMemberId !== userProfile.uid);
      updatedGrades.push(myGradeData);
      
      // Save to Firebase
      await setDoc(doc(db, 'interviewGrades', candidate.id), {
        candidateId: candidate.id,
        candidateName: candidate.userProfile?.fullName || 'Unknown',
        panelGrades: updatedGrades,
        updatedAt: new Date()
      });

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-lg px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-6 hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview View
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview Grading
              </h1>
              <p className="text-gray-600 text-lg">
                Grade the candidate's interview responses (Scale: 0-5 with 0.5 increments)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Enhanced Candidate Info */}
        <Card className="mb-8 border-2 shadow-lg bg-gradient-to-r from-white to-gray-50">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-md">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {candidate.userProfile?.fullName || 'N/A'}
                  </h2>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Position: {candidate.position}</span>
                    </div>
                    <span>Grade {candidate.userProfile?.grade}</span>
                    <span>Student #{candidate.userProfile?.studentNumber}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm font-semibold">
                    Application Score: {candidate.score || 0}/100
                  </Badge>
                </div>
              </div>
              <div className="text-right bg-white rounded-xl p-6 shadow-md border">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {getMyScore().toFixed(1)}/5
                </div>
                <div className="text-sm text-gray-600 font-medium">My Interview Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Questions and Grading */}
          <div className="lg:col-span-2 space-y-8">
            {interviewQuestions.map((question, index) => {
              const otherGrades = getOtherPanelMemberGrades(question.id);
              const myScore = myGrades[question.id] || 0;
              
              return (
                <Card key={question.id} className="border-2 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span>Question {index + 1}</span>
                      </div>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 px-3 py-1">
                        Max: {question.maxScore} points
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed mt-3 pl-11">
                      {question.question}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {/* Enhanced My Grading */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                          Your Score (0-{question.maxScore})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 11 }, (_, i) => i * 0.5).map((score) => (
                            <Button
                              key={score}
                              variant={myScore === score ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleScoreChange(question.id, score)}
                              className={`min-w-[50px] h-10 font-semibold transition-all duration-200 ${myScore === score 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md transform scale-105" 
                                : "border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                              }`}
                            >
                              {score}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Other Panel Members' Grades */}
                      {otherGrades.length > 0 && (
                        <div className="border-t-2 border-gray-100 pt-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Other Panel Members
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {otherGrades.map((grade) => (
                              <div key={grade.name} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="text-sm font-medium text-gray-800">{grade.name}</span>
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  <span className="font-bold text-blue-600">{grade.score}/5</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Enhanced Assessment Checkboxes */}
            <Card className="border-2 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckSquare className="h-5 w-5 text-green-600" />
                  </div>
                  Assessment Criteria
                </CardTitle>
                <CardDescription className="text-base pl-11">
                  Check all that apply to this candidate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                      <Checkbox 
                        id="pastExperience"
                        checked={myCheckboxes.pastExperience}
                        onCheckedChange={(checked) => handleCheckboxChange('pastExperience', checked as boolean)}
                        className="w-5 h-5"
                      />
                      <label htmlFor="pastExperience" className="text-sm font-medium leading-relaxed cursor-pointer">
                        Past Experience or attendance at SAC events
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                      <Checkbox 
                        id="roleKnowledge"
                        checked={myCheckboxes.roleKnowledge}
                        onCheckedChange={(checked) => handleCheckboxChange('roleKnowledge', checked as boolean)}
                        className="w-5 h-5"
                      />
                      <label htmlFor="roleKnowledge" className="text-sm font-medium leading-relaxed cursor-pointer">
                        Good knowledge of tasks involved for the role
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                      <Checkbox 
                        id="leadershipSkills"
                        checked={myCheckboxes.leadershipSkills}
                        onCheckedChange={(checked) => handleCheckboxChange('leadershipSkills', checked as boolean)}
                        className="w-5 h-5"
                      />
                      <label htmlFor="leadershipSkills" className="text-sm font-medium leading-relaxed cursor-pointer">
                        Good leadership skills and leadership experience
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                      <Checkbox 
                        id="creativeOutlook"
                        checked={myCheckboxes.creativeOutlook}
                        onCheckedChange={(checked) => handleCheckboxChange('creativeOutlook', checked as boolean)}
                        className="w-5 h-5"
                      />
                      <label htmlFor="creativeOutlook" className="text-sm font-medium leading-relaxed cursor-pointer">
                        Creative and energetic outlook for the tasks required for this role
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                      <Checkbox 
                        id="timeManagement"
                        checked={myCheckboxes.timeManagement}
                        onCheckedChange={(checked) => handleCheckboxChange('timeManagement', checked as boolean)}
                        className="w-5 h-5"
                      />
                      <label htmlFor="timeManagement" className="text-sm font-medium leading-relaxed cursor-pointer">
                        Seems organized and manages time well
                      </label>
                    </div>
                  </div>
                </div>

                {/* Enhanced Other Panel Members' Checkboxes */}
                {allPanelGrades.filter(g => g.panelMemberId !== userProfile?.uid && g.checkboxes).length > 0 && (
                  <div className="border-t-2 border-gray-100 pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Other Panel Members' Assessments
                    </label>
                    <div className="space-y-4">
                      {allPanelGrades
                        .filter(g => g.panelMemberId !== userProfile?.uid && g.checkboxes)
                        .map((grade) => (
                          <div key={grade.panelMemberId} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="font-semibold text-sm mb-3 text-blue-800">{grade.panelMemberName}</div>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              {grade.checkboxes.pastExperience && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Past Experience or attendance at SAC events</div>}
                              {grade.checkboxes.roleKnowledge && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Good knowledge of tasks involved for the role</div>}
                              {grade.checkboxes.leadershipSkills && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Good leadership skills and leadership experience</div>}
                              {grade.checkboxes.creativeOutlook && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Creative and energetic outlook for the tasks required for this role</div>}
                              {grade.checkboxes.timeManagement && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Seems organized and manages time well</div>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Panel Feedback Section */}
            <Card className="border-2 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  Panel Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* My Feedback */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Your Feedback
                  </label>
                  <Textarea
                    value={myFeedback}
                    onChange={(e) => setMyFeedback(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                    rows={4}
                    placeholder="Enter your feedback about the candidate's interview performance..."
                  />
                </div>

                {/* Other Panel Members' Feedback */}
                {allPanelGrades.filter(g => g.panelMemberId !== userProfile?.uid && g.feedback).length > 0 && (
                  <div className="border-t-2 border-gray-100 pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Other Panel Members' Feedback
                    </label>
                    <div className="space-y-4">
                      {allPanelGrades
                        .filter(g => g.panelMemberId !== userProfile?.uid && g.feedback)
                        .map((grade) => (
                          <div key={grade.panelMemberId} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-sm text-purple-800">{grade.panelMemberName}</span>
                              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                {new Date(grade.submittedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">{grade.feedback}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Summary Panel */}
          <div className="space-y-6">
            <Card className="sticky top-8 border-2 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
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
                    <div key={member.id} className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 ${
                      isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isMe ? 'bg-blue-200' : 'bg-gray-200'
                        }`}>
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-sm">
                          {member.name} {isMe && <span className="text-blue-600 font-semibold">(You)</span>}
                        </span>
                      </div>
                      <div className="text-right">
                        {hasGraded ? (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-lg">{avgScore.toFixed(1)}/5</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Enhanced Submit Button */}
            <Button
              onClick={handleSubmitGrades}
              size="lg"
              className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                Object.keys(myGrades).length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-gray-950 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
              disabled={Object.keys(myGrades).length === 0}
            >
              {Object.keys(myGrades).length === 0 ? 'Complete Grading to Submit' : 'Submit My Grades'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewGrader;
