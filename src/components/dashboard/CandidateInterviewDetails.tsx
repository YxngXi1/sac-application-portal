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
  interviewType?: 'one' | 'two'; // Add this to track which interview it's from
}

interface InterviewGrades {
  candidateId: string;
  interviewType: 'one' | 'two';
  panelGrades: PanelMemberGrade[];
  averageScore: number;
}

interface CombinedInterviewGrades {
  candidateId: string;
  interviewOne?: InterviewGrades;
  interviewTwo?: InterviewGrades;
  combinedAverageScore: number;
  allPanelGrades: PanelMemberGrade[];
}

const CandidateInterviewDetails: React.FC<CandidateInterviewDetailsProps> = ({ candidate, onBack }) => {
  const [combinedGrades, setCombinedGrades] = useState<CombinedInterviewGrades | null>(null);
  const [loading, setLoading] = useState(true);

  const getInterviewQuestions = (position: string, interviewType: 'one' | 'two'): string[] => {
    const questionSets: Record<string, { one: string[], two: string[] }> = {
    'Honourary Member': {
      one: [
        'Explain the promotional material you created and why you feel it is beneficial for promoting the SAC event.',
        'Can you give an example of a time when you had to plan something under tight deadlines? What steps did you take to ensure it was done well, and what did you learn from that experience? In other words, can you get work done quickly and efficiently?',
        'What do you think is the biggest challenge in getting students excited about school events, and how would you approach solving it?'
      ],
      two: [
        'If you were to look back at the end of the year, what would success as a promotions officer look like for you? What would you want to be remembered for?',
        'How would you handle a situation where multiple events are happening at the same time and you need to promote all of them effectively?',
        'Describe a creative promotional idea you would implement for a school event that hasn\'t been done before.'
      ]
    },
  };

  const positionQuestions = questionSets[position];

  return positionQuestions[interviewType];
};

  useEffect(() => {
    const loadInterviewGrades = async () => {
      try {
        // Load both interview types
        const [gradeDocOne, gradeDocTwo] = await Promise.all([
          getDoc(doc(db, 'interviewGrades', `${candidate.id}_interview_one`)),
          getDoc(doc(db, 'interviewGrades', `${candidate.id}_interview_two`))
        ]);

        let interviewOne: InterviewGrades | undefined;
        let interviewTwo: InterviewGrades | undefined;

        if (gradeDocOne.exists()) {
          const data = gradeDocOne.data() as InterviewGrades;
          interviewOne = {
            ...data,
            panelGrades: data.panelGrades.map(pg => ({
              ...pg,
              submittedAt: pg.submittedAt instanceof Date ? pg.submittedAt : new Date(pg.submittedAt),
              interviewType: 'one' // Tag each panel grade with interview type
            }))
          };
        }

        if (gradeDocTwo.exists()) {
          const data = gradeDocTwo.data() as InterviewGrades;
          interviewTwo = {
            ...data,
            panelGrades: data.panelGrades.map(pg => ({
              ...pg,
              submittedAt: pg.submittedAt instanceof Date ? pg.submittedAt : new Date(pg.submittedAt),
              interviewType: 'two' // Tag each panel grade with interview type
            }))
          };
        }

        // Combine grades if either interview exists
        if (interviewOne || interviewTwo) {
          // Calculate combined average score
          let combinedAverageScore = 0;
          let scoreCount = 0;
          
          if (interviewOne && interviewOne.averageScore) {
            combinedAverageScore += parseFloat(interviewOne.averageScore.toString());
            scoreCount++;
          }
          
          if (interviewTwo && interviewTwo.averageScore) {
            combinedAverageScore += parseFloat(interviewTwo.averageScore.toString());
            scoreCount++;
          }
          
          if (scoreCount > 0) {
            combinedAverageScore = combinedAverageScore / scoreCount;
          }

          // Combine all panel grades from both interviews
          const allPanelGrades: PanelMemberGrade[] = [];
          if (interviewOne?.panelGrades) {
            allPanelGrades.push(...interviewOne.panelGrades);
          }
          if (interviewTwo?.panelGrades) {
            allPanelGrades.push(...interviewTwo.panelGrades);
          }

          setCombinedGrades({
            candidateId: candidate.id,
            interviewOne,
            interviewTwo,
            combinedAverageScore,
            allPanelGrades
          });
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

  const applicationScore = ((candidate.score || 0) / 100) * 10; // Convert to score out of 10
  const interviewScore = combinedGrades?.combinedAverageScore || 0;

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
            {combinedGrades?.interviewOne && (
              <span>Interview One: {combinedGrades.interviewOne.averageScore.toFixed(1)}/5</span>
            )}
            {combinedGrades?.interviewTwo && (
              <span>Interview Two: {combinedGrades.interviewTwo.averageScore.toFixed(1)}/5</span>
            )}
            <span>Combined Interview: {interviewScore.toFixed(1)}/5</span>
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

        {/* Interview One Questions */}
        {combinedGrades?.interviewOne && (
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-600" />
                Interview One Questions & Grades
              </CardTitle>
              <CardDescription>
                Results from Interview One (Average: {combinedGrades.interviewOne.averageScore.toFixed(1)}/5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getInterviewQuestions(candidate.position, 'one').map((question, index) => (
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
                        {combinedGrades.interviewOne.panelGrades.map((panelGrade, gradeIndex) => {
                          const questionKey = `question_${index}`;
                          const grade = panelGrade.grades && panelGrade.grades[questionKey] !== undefined 
                            ? panelGrade.grades[questionKey] 
                            : null;
                          
                          return (
                            <TableRow key={`${panelGrade.panelMemberId}-one-${gradeIndex}`}>
                              <TableCell className="font-medium">
                                {panelGrade.panelMemberName}
                              </TableCell>
                              <TableCell>
                                {grade !== null && grade !== undefined ? (
                                  <Badge variant="secondary" className="font-medium">
                                    {grade}/5
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">Not graded</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {panelGrade.submittedAt && !isNaN(panelGrade.submittedAt.getTime()) ? 
                                  panelGrade.submittedAt.toLocaleDateString() : 
                                  'Not submitted'
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Interview Two Questions */}
        {combinedGrades?.interviewTwo && (
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-green-600" />
                Interview Two Questions & Grades
              </CardTitle>
              <CardDescription>
                Results from Interview Two (Average: {combinedGrades.interviewTwo.averageScore.toFixed(1)}/5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getInterviewQuestions(candidate.position, 'two').map((question, index) => (
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
                        {combinedGrades.interviewTwo.panelGrades.map((panelGrade, gradeIndex) => {
                          const questionKey = `question_${index}`;
                          const grade = panelGrade.grades && panelGrade.grades[questionKey] !== undefined 
                            ? panelGrade.grades[questionKey] 
                            : null;
                          
                          return (
                            <TableRow key={`${panelGrade.panelMemberId}-two-${gradeIndex}`}>
                              <TableCell className="font-medium">
                                {panelGrade.panelMemberName}
                              </TableCell>
                              <TableCell>
                                {grade !== null && grade !== undefined ? (
                                  <Badge variant="secondary" className="font-medium">
                                    {grade}/5
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">Not graded</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {panelGrade.submittedAt && !isNaN(panelGrade.submittedAt.getTime()) ? 
                                  panelGrade.submittedAt.toLocaleDateString() : 
                                  'Not submitted'
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment Criteria */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Assessment Criteria
            </CardTitle>
            <CardDescription>
              Panel member assessments on key criteria (Combined from both interviews)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {combinedGrades?.allPanelGrades?.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(checkboxLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {combinedGrades.allPanelGrades.map((panelGrade, gradeIndex) => {
                        const interviewType = panelGrade.interviewType === 'one' ? 'Interview One' : 'Interview Two';

                        return (
                          <div key={`${panelGrade.panelMemberId}-${panelGrade.interviewType}-${gradeIndex}`} className="flex items-center gap-1 bg-white p-2 rounded border">
                            <span className="text-xs text-gray-600">{panelGrade.panelMemberName} ({interviewType}):</span>
                            {panelGrade.checkboxes && panelGrade.checkboxes[key as keyof InterviewCheckboxes] ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        );
                      })}
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
              Individual feedback from each panel member (Both interviews)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {combinedGrades?.allPanelGrades?.filter(pg => pg.feedback)?.length > 0 ? (
              <div className="space-y-4">
                {combinedGrades.allPanelGrades
                  .filter(pg => pg.feedback)
                  .map((panelGrade, gradeIndex) => {
                    const interviewType = panelGrade.interviewType === 'one' ? 'Interview One' : 'Interview Two';

                    return (
                      <div key={`${panelGrade.panelMemberId}-${panelGrade.interviewType}-${gradeIndex}`} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{panelGrade.panelMemberName}</span>
                          <Badge variant={panelGrade.interviewType === 'one' ? 'default' : 'secondary'} className="text-xs">
                            {interviewType}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {panelGrade.submittedAt && !isNaN(panelGrade.submittedAt.getTime()) ? 
                              panelGrade.submittedAt.toLocaleDateString() : 
                              'Date not available'
                            }
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{panelGrade.feedback}</p>
                      </div>
                    );
                  })}
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