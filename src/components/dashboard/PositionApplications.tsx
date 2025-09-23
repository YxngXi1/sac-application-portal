import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Eye, Star, MessageSquare } from 'lucide-react';
import { getAllApplicationsByPosition } from '@/services/applicationService';
import { ApplicationData } from '@/services/applicationService';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import ApplicationGrader from './ApplicationGrader';

interface PositionApplicationsProps {
  positionId: string;
  positionName: string;
  onBack: () => void;
  filteredApplications?: ApplicationData[];
  gradeFilter?: string;
}

interface ScheduledInterview {
  id?: string;
  candidateId: string;
  positionId: string;
  interviewOneDate?: Date;
  interviewOneTime?: string;
  interviewOnePanelMembers?: string[];
  interviewOneRoom?: string;
  interviewTwoDate?: Date;
  interviewTwoTime?: string;
  interviewTwoPanelMembers?: string[];
  interviewTwoRoom?: string;
  createdAt: Date;
  updatedAt: Date;
}

const POSITION_QUESTIONS: Record<string, Array<{question: string, key: string}>> = {
  'Grade Rep': [
    { question: 'Tell us your “why” - why do you want to be a Grade Representative in the 2025-26 school year?', key: 'honorary_1' },
    { question: "What is your platform? In other words, what ideas, initiatives, or changes would you like to introduce, and how will it benefit the student body?", key: 'honorary_2' },
    { question: "As a Grade Rep, communication is key. How will you actively represent and voice your grade’s ideas and opinions during SAC meetings, events, and spirit weeks? Please be specific.", key: 'honorary_3' },
    { question: 'What are your other commitments that you are in or plan to be in, both in and out of school? Please write down your role, time commitment per week, and the day(s) of the week if applicable. Jot notes only.', key: 'honorary_4' },
    { question: 'Do you know anyone currently on the SAC Executive Council?', key: 'honorary_5' },
    { question: 'Which 2 John Fraser teachers support you as a SAC Grade Representative. Include their name and emails.', key: 'honorary_6' }
  ]
};

const PositionApplications: React.FC<PositionApplicationsProps> = ({
  positionId,
  positionName,
  onBack,
  filteredApplications,
  gradeFilter
}) => {
  const { userProfile } = useAuth();
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicationData | null>(null);
  const [gradeMode, setGradeMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [allSubmittedApplications, setAllSubmittedApplications] = useState<ApplicationData[]>([]);

  const isExec = userProfile?.role === 'exec';
  const isSuperAdmin = userProfile?.role === 'superadmin';

  // Helper function to anonymize names for exec users
  const getDisplayName = (application: ApplicationData) => {
    if (isSuperAdmin) {
      return application.userProfile?.fullName || 'Unknown';
    }
    if (isExec) {
      // Use the consistent submitted applications array for numbering
      const candidateNumber = allSubmittedApplications.findIndex(app => app.id === application.id) + 1;
      return `Candidate ${candidateNumber}`;
    }
    return application.userProfile?.fullName || 'Unknown';
  };

  // Helper function to format date in EST
  const formatDateEST = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getScheduledInterviewsByPosition = async (positionId: string): Promise<ScheduledInterview[]> => {
    try {
      const q = query(
        collection(db, 'scheduledInterviews'),
        where('positionId', '==', positionId)
      );
      const querySnapshot = await getDocs(q);
      
      const interviews = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw Firebase interview data:', doc.id, data); // Debug log
        
        return {
          id: doc.id,
          candidateId: data.candidateId,
          positionId: data.positionId,
          interviewOneDate: data.interviewOneDate?.toDate() || undefined,
          interviewOneTime: data.interviewOneTime || undefined,
          interviewOnePanelMembers: data.interviewOnePanelMembers || undefined,
          interviewOneRoom: data.interviewOneRoom || undefined,
          interviewTwoDate: data.interviewTwoDate?.toDate() || undefined,
          interviewTwoTime: data.interviewTwoTime || undefined,
          interviewTwoPanelMembers: data.interviewTwoPanelMembers || undefined,
          interviewTwoRoom: data.interviewTwoRoom || undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as ScheduledInterview[];
      
      console.log('Processed interviews in PositionApplications:', interviews); // Debug log
      return interviews;
    } catch (error) {
      console.error('Error getting scheduled interviews:', error);
      throw error;
    }
  };

   // Load applications and scheduled interviews
  useEffect(() => {
    const loadData = async () => {
      try {
        let applicationsToUse: ApplicationData[];
        
        if (filteredApplications) {
          applicationsToUse = filteredApplications;
          // Also get all submitted applications for consistent numbering
          const allPositionApps = await getAllApplicationsByPosition(positionId);
          const allSubmitted = allPositionApps.filter(app => app.status === 'submitted').sort((a, b) => a.id.localeCompare(b.id));
          setAllSubmittedApplications(allSubmitted);
        } else {
          const positionApplications = await getAllApplicationsByPosition(positionId);
          applicationsToUse = positionApplications;
          const allSubmitted = positionApplications.filter(app => app.status === 'submitted').sort((a, b) => a.id.localeCompare(b.id));
          setAllSubmittedApplications(allSubmitted);
        }
        
        setApplications(applicationsToUse);

        // Load scheduled interviews for display purposes only
        const interviews = await getScheduledInterviewsByPosition(positionId);
        setScheduledInterviews(interviews);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [positionId, filteredApplications]);

  const getCandidateInterview = (candidateId: string): ScheduledInterview | null => {
    const interview = scheduledInterviews.find(interview => interview.candidateId === candidateId) || null;
    console.log(`PositionApplications - Looking for interview for candidate ${candidateId}:`, interview); // Debug log
    return interview;
  };

  const handleViewApplication = (application: ApplicationData) => {
    setSelectedApplicant(application);
    setViewMode(true);
  };

  if (selectedApplicant && gradeMode) {
    return (
      <ApplicationGrader
        application={selectedApplicant}
        positionName={positionName}
        onBack={() => {
          setSelectedApplicant(null);
          setGradeMode(false);
        }}
        onNavigateToApplication={(newApplication) => setSelectedApplicant(newApplication)}
        filteredApplications={allSubmittedApplications}
        gradeFilter={gradeFilter}
      />
    );
  }

  if (selectedApplicant && viewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4 mb-2">
              <Button variant="ghost" onClick={() => {
                setSelectedApplicant(null);
                setViewMode(false);
              }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getDisplayName(selectedApplicant)}
            </h1>
            <p className="text-gray-600">
              Position: {positionName} • Status: {selectedApplicant.status}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>
                Review the applicant's information and responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Applicant Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {getDisplayName(selectedApplicant)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Grade</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedApplicant.userProfile?.grade || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Student Number</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {isSuperAdmin ? (selectedApplicant.userProfile?.studentNumber || 'Not provided') : '████████'}
                  </p>
                </div>
              </div>

              {/* Application Responses */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Application Responses</h3>
                {selectedApplicant.answers && Object.keys(selectedApplicant.answers).length > 0 ? (
                  (() => {
                    // Get position-specific questions with proper mapping
                    const positionQuestions = POSITION_QUESTIONS[positionName] || [
                        { question: 'Tell us your “why” - why do you want to be a Grade Representative in the 2025-26 school year?', key: 'honorary_1' },
                        { question: "What is your platform? In other words, what ideas, initiatives, or changes would you like to introduce, and how will it benefit the student body?", key: 'honorary_2' },
                        { question: "As a Grade Rep, communication is key. How will you actively represent and voice your grade’s ideas and opinions during SAC meetings, events, and spirit weeks? Please be specific.", key: 'honorary_3' },
                        { question: 'What are your other commitments that you are in or plan to be in, both in and out of school? Please write down your role, time commitment per week, and the day(s) of the week if applicable. Jot notes only.', key: 'honorary_4' },
                        { question: 'Do you know anyone currently on the SAC Executive Council?', key: 'honorary_5' },
                        { question: 'Which 2 John Fraser teachers support you as a SAC Grade Representative. Include their name and emails.', key: 'honorary_6' }
                    ];

                    // Map questions in the correct order
                    return positionQuestions.map((questionData, index) => {
                      const answer = selectedApplicant.answers?.[questionData.key];
                      if (!answer) return null;

                      return (
                        <div key={questionData.key} className="mb-6 p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">
                            Question {index + 1}: {questionData.question}
                          </h4>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-800 whitespace-pre-wrap">{answer as string}</p>
                          </div>
                        </div>
                      );
                    }).filter(Boolean);
                  })()
                ) : (
                  <p className="text-gray-500">No responses found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  const submittedApplications = applications.filter(app => app.status === 'submitted');
  const inProgressApplications = applications.filter(app => app.status === 'draft' && app.progress > 0);
  const interviewedApplications = applications.filter(app => app.interviewScheduled);
  const interviewedCount = interviewedApplications.length;
  
  // Debug log to see which applications are marked as interviewed
  console.log('Applications marked as interviewed:', interviewedApplications.map(app => ({
    id: app.id,
    name: app.userProfile?.fullName,
    interviewScheduled: app.interviewScheduled
  })));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{positionName}</h1>
          <p className="text-gray-600">
            {gradeFilter ? `Applications with grade: ${gradeFilter}` : 'All applications for this position'}
            {isExec && (
              <span className="ml-2 text-orange-600 font-medium">
                • Anonymous Mode (Executive View)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submittedApplications.length}</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Click on an applicant to view details or enter grade mode
                  {isExec && (
                    <span className="block text-orange-600 font-medium mt-1">
                      Names are anonymized for fair evaluation
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications found for this position.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Student Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Interviews</TableHead>
                    <TableHead>Submitted (EST)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => {
                    const candidateInterview = getCandidateInterview(application.id);
                    
                    return (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {getDisplayName(application)}
                        </TableCell>
                        <TableCell>{application.userProfile?.grade || 'N/A'}</TableCell>
                        <TableCell>
                          {isSuperAdmin ? (application.userProfile?.studentNumber || 'N/A') : '████████'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={application.status === 'submitted' ? "default" : "secondary"}>
                            {application.status === 'submitted' ? 'Submitted' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${application.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{application.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {application.score ? (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{application.score.toFixed(1)}/10</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not graded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {(() => {
                              console.log(`Interview data for ${application.userProfile?.fullName}:`, candidateInterview); // Debug log
                              return null;
                            })()}
                            {candidateInterview?.interviewOneDate ? (
                              <div className="text-xs">
                                <Badge variant="default" className="mb-1">Group Interview</Badge>
                                <div className="text-gray-600">
                                  {candidateInterview.interviewOneDate.toLocaleDateString()} at {candidateInterview.interviewOneTime}
                                  {candidateInterview.interviewOneRoom && (
                                    <div>Room: [{candidateInterview.interviewOneRoom}]</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Group Interview: Pending</Badge>
                            )}
                            
                            {candidateInterview?.interviewTwoDate ? (
                              <div className="text-xs">
                                <Badge variant="default" className="mb-1">Individual Interview</Badge>
                                <div className="text-gray-600">
                                  {candidateInterview.interviewTwoDate.toLocaleDateString()} at {candidateInterview.interviewTwoTime}
                                  {candidateInterview.interviewTwoRoom && (
                                    <div>Room: [{candidateInterview.interviewTwoRoom}]</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Individual Interview: Pending</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {application.submittedAt ? 
                            formatDateEST(application.submittedAt) : 
                            'Not submitted'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {application.status === 'submitted' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedApplicant(application);
                                  setGradeMode(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Grade
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewApplication(application)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionApplications;