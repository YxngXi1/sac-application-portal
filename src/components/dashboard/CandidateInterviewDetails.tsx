
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, User, MessageSquare, CheckCircle, XCircle, Star } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CandidateInterviewDetailsProps {
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

const CandidateInterviewDetails: React.FC<CandidateInterviewDetailsProps> = ({ candidate, onBack }) => {
  const [interviewGrades, setInterviewGrades] = useState<InterviewGrades | null>(null);
  const [loading, setLoading] = useState(true);

  const getInterviewQuestions = (position: string): string[] => {
    const questions: Record<string, string[]> = {
      'Promotions Officer': [
        'Explain the promotional material you created and why you feel it is beneficial for promoting the SAC event.',
        'Can you give an example of a time when you had to plan something under tight deadlines? What steps did you take to ensure it was done well, and what did you learn from that experience? In other words, can you get work done quickly and efficiently?',
        'What do you think is the biggest challenge in getting students excited about school events, and how would you approach solving it?',
        'If you were to look back at the end of the year, what would success as a promotions officer look like for you? What would you want to be remembered for?'
      ],
      'Photography Exec': [
        'Photography can involve a lot of behind-the-scenes work—like editing and sorting photos quickly. How do you manage your time and stay organized with these tasks?',
        'Can you walk us through your experience with photography? What types of photos do you most enjoy taking, and why?',
        'School events are often fast-paced and unpredictable. How would you ensure you\'re able to capture the most important and interesting moments?',
        'Imagine you are at an SAC event and all your members are having fun, but your duty is to take photos for the event, how would you manage this?',
        'Can you think of a new way that photos or photography could be more visible in the school other than on social media?'
      ],
      'Secretary': [
        'Imagine you\'re faced with several tasks at once—taking minutes during a meeting, managing event sign-ups, and updating the council\'s calendar. How would you prioritize and manage these tasks to ensure they\'re all done well?',
        'Tell me about a time you made a mistake in organizing or managing information. How did you address it and what did you learn from the experience?',
        'Being detail-oriented is key for a secretary. Can you give me an example of a time when paying attention to the small details made a big difference?',
        'The current role of the Secretary, outside of Council meetings, is to update the SAC website, publish meeting agendas, and draft up announcements for SAC. What other responsibilities as secretary do you want to take on and how can you put your head down, stay motivated, and work?',
        'Sometimes the secretary\'s job can be slow depending on the time of year. How else can you play a big role in council when you aren\'t doing secretarial work?'
      ],
      'Treasurer': [
        'What\'s one idea you have for using the treasurer role to make a positive impact on the student council and the school? Write a few sentences explaining your idea and how you\'d make it happen.',
        'With emerging technology developed by this year\'s Council, and the role of the Treasurer becoming more limited and with less responsibilities, what do you propose that the treasurer for the 2025/2026 year take on? These responsibilities can include the continuity of current responsibilities or new responsibilities.',
        'Our members contribute cash in the fall for SAC snacks. How would you ensure this money would last the school year and be accounted for.'
      ],
      'Community Outreach': [
        'Community outreach often means connecting with many different people. How do you approach building relationships with people you don\'t know well?',
        'Community outreach requires strong communication and relationship-building skills. Share an example of a time when you successfully worked with others to achieve a goal',
        'Food drives are a common community outreach activity. If you were responsible for organizing a food drive at John Fraser, how would you plan it to make sure it\'s successful and engages as many students as possible?'
      ],
      'Athletics Liaison': [
        'Being the Athletics Liaison is a very innovative position, and the Athletics Liaisons in the last couple of years have created new events that have had great turnouts. For example, one liaison created the Spring Dance, while the other created the Fraser Games. What ideas do you have for this role? If you would create an event, or improve an existing one, how would you do so?',
        'The Fraser Games was brought back this year by our Athletics Liaison. Say you become the Athletics Liaison, and you have spent weeks planning this event, but the assigned SAC and FAC volunteers haven\'t shown up to a station. What would you do?',
        'How would you handle a situation where the Athletics Council and SAC have different opinions about an event or project? How would you help both sides reach an agreement?'
      ],
      'Arts Liaison': [
        'If you could only run one major event this year, how would you choose what it is, and what would you prioritize in planning it?',
        'Tell us about a time you had to mediate between creative differences in a team. How did you approach it?',
        'If you had to plan a collaborative event with the Music or Drama department, what would it look like?',
        'If you could change how the school values or supports the arts, what would you do—and how would you make it happen?'
      ]
    };
    return questions[position] || [];
  };

  useEffect(() => {
    const loadInterviewGrades = async () => {
      try {
        const gradeDoc = await getDoc(doc(db, 'interviewGrades', candidate.id));
        if (gradeDoc.exists()) {
          setInterviewGrades(gradeDoc.data() as InterviewGrades);
        }
      } catch (error) {
        console.error('Error loading interview grades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInterviewGrades();
  }, [candidate.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  const questions = getInterviewQuestions(candidate.position);
  const applicationScore = ((candidate.score || 0) / 100) * 10;
  const interviewScore = interviewGrades?.panelGrades?.length > 0 
    ? interviewGrades.panelGrades.map(pg => {
        const scores = Object.values(pg.grades).filter(s => typeof s === 'number' && s >= 0);
        return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
      }).reduce((sum, s) => sum + s, 0) / interviewGrades.panelGrades.length
    : 0;

  const checkboxLabels = {
    pastExperience: 'Past Experience or attendance at SAC events',
    roleKnowledge: 'Good knowledge of tasks involved for the role',
    leadershipSkills: 'Good leadership skills and leadership experience',
    creativeOutlook: 'Creative and energetic outlook for the tasks required for this role',
    timeManagement: 'Seems organized and manages time well'
  };

  // Get application feedback safely
  const applicationFeedback = (candidate as any).feedback || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview Results
          </Button>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {candidate.userProfile?.fullName || 'N/A'}
            </h1>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {candidate.position}
            </Badge>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <span>Grade: {candidate.userProfile?.grade || 'N/A'}</span>
            <span>Application Score: {applicationScore.toFixed(1)}/10</span>
            <span>Interview Score: {interviewScore.toFixed(1)}/5</span>
            <span className="font-semibold">Total: {(applicationScore + interviewScore).toFixed(1)}/15</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Application Stage Feedback */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Application Stage Feedback
            </CardTitle>
            <CardDescription>
              Feedback and score from the application review process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Application Score</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {applicationScore.toFixed(1)}/10
                </Badge>
              </div>
              {applicationFeedback && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Executive Feedback</h4>
                  <p className="text-gray-700">{applicationFeedback}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interview Questions and Grades */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Interview Questions & Panel Grades
            </CardTitle>
            <CardDescription>
              Live results showing each panel member's score for every question
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length > 0 && interviewGrades?.panelGrades?.length > 0 ? (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-gray-900">
                      Question {index + 1}: {question}
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Panel Member</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interviewGrades.panelGrades.map((panelGrade) => {
                          const grade = panelGrade.grades[`question${index + 1}`];
                          return (
                            <TableRow key={panelGrade.panelMemberId}>
                              <TableCell className="font-medium">
                                {panelGrade.panelMemberName}
                              </TableCell>
                              <TableCell>
                                {grade !== undefined ? (
                                  <Badge variant="secondary" className="font-medium">
                                    {grade}/5
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">Not graded</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {new Date(panelGrade.submittedAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No interview grades available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assessment Criteria */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Assessment Criteria
            </CardTitle>
            <CardDescription>
              Panel member assessments on key criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviewGrades?.panelGrades?.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(checkboxLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      {interviewGrades.panelGrades.map((panelGrade) => (
                        <div key={panelGrade.panelMemberId} className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">{panelGrade.panelMemberName}:</span>
                          {panelGrade.checkboxes && panelGrade.checkboxes[key as keyof InterviewCheckboxes] ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No assessment criteria available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Panel Feedback */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Panel Member Feedback
            </CardTitle>
            <CardDescription>
              Individual feedback from each panel member
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviewGrades?.panelGrades?.filter(pg => pg.feedback)?.length > 0 ? (
              <div className="space-y-4">
                {interviewGrades.panelGrades
                  .filter(pg => pg.feedback)
                  .map((panelGrade) => (
                    <div key={panelGrade.panelMemberId} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{panelGrade.panelMemberName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(panelGrade.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{panelGrade.feedback}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No panel feedback available yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateInterviewDetails;
