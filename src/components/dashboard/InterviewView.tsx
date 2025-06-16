import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Users, Plus, CheckCircle, XCircle, History } from 'lucide-react';
import { getAllApplications, ApplicationData } from '@/services/applicationService';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import InterviewScheduler from './InterviewScheduler';
import InterviewGrader from './InterviewGrader';
import InterviewResults from './InterviewResults';
import InterviewCalendarView from './InterviewCalendarView';

interface InterviewViewProps {
  onBack: () => void;
}

interface ScheduledInterview {
  candidateId: string;
  candidateName: string;
  position: string;
  grade: string;
  studentNumber: string;
  date: Date;
  timeSlot: string;
  endTime: string;
  hasGrades?: boolean;
}

const InterviewView: React.FC<InterviewViewProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showGrader, setShowGrader] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);

  const positions = [
    'Secretary', 
    'Treasurer', 
    'Community Outreach', 
    'Athletics Liaison', 
    'Promotions Officer', 
    'Photography Exec',
    'Technology Executive',
    'Arts Liaison'
  ];

  // 8-minute interviews with 2-minute buffer (10-minute intervals): 11:05 AM - 12:05 PM and 3:00 PM - 5:00 PM
  const timeSlots = [
    // Morning slots: 11:05 - 12:05 (6 slots)
    '11:05 AM', '11:15 AM', '11:25 AM', '11:35 AM', '11:45 AM', '11:55 AM',
    // Afternoon slots: 3:00 - 5:00 (12 slots)
    '3:00 PM', '3:10 PM', '3:20 PM', '3:30 PM', '3:40 PM', '3:50 PM', '4:00 PM', '4:10 PM', '4:20 PM', '4:30 PM', '4:40 PM', '4:50 PM'
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const allApplications = await getAllApplications();
        // Only show submitted applications with scores
        const submittedWithScores = allApplications.filter(app => 
          app.status === 'submitted' && app.score !== undefined
        );
        setApplications(submittedWithScores);

        // Load actual scheduled interviews from Firebase
        await loadScheduledInterviews(submittedWithScores);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadScheduledInterviews = async (applications: ApplicationData[]) => {
    const interviews: ScheduledInterview[] = [];
    
    for (const app of applications) {
      if (app.interviewScheduled) {
        try {
          const interviewDoc = await getDoc(doc(db, 'interviews', app.id));
          if (interviewDoc.exists()) {
            const data = interviewDoc.data();
            const interviewDate = data.date.toDate();
            
            // Check if grades have been submitted for this interview
            const gradeDoc = await getDoc(doc(db, 'interviewGrades', app.id));
            console.log(`Checking grades for ${app.id}:`, gradeDoc.exists(), gradeDoc.data());
            
            let hasGrades = false;
            if (gradeDoc.exists()) {
              const gradeData = gradeDoc.data();
              // Check if there are any panel grades with actual scores submitted
              hasGrades = gradeData?.panelGrades && 
                         Array.isArray(gradeData.panelGrades) && 
                         gradeData.panelGrades.length > 0 &&
                         gradeData.panelGrades.some((grade: any) => 
                           grade.scores && 
                           Object.keys(grade.scores).length > 0 &&
                           Object.values(grade.scores).some((score: any) => score !== null && score !== undefined)
                         );
            }
            
            interviews.push({
              candidateId: app.id,
              candidateName: app.userProfile?.fullName || 'Unknown',
              position: app.position,
              grade: app.userProfile?.grade || 'N/A',
              studentNumber: app.userProfile?.studentNumber || 'N/A',
              date: interviewDate,
              timeSlot: data.timeSlot,
              endTime: data.endTime || getEndTime(data.timeSlot),
              hasGrades
            });
          }
        } catch (error) {
          console.error('Error loading interview for candidate:', app.id, error);
        }
      }
    }
    
    setScheduledInterviews(interviews);
  };

  const getPositionApplications = (position: string) => {
    return applications
      .filter(app => app.position === position)
      .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by score descending
  };

  const getUpcomingInterviews = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return scheduledInterviews.filter(interview => {
      // Interview is upcoming if the scheduled date hasn't passed yet (date is today or in the future)
      const interviewDate = new Date(interview.date.getFullYear(), interview.date.getMonth(), interview.date.getDate());
      return interviewDate >= today;
    });
  };

  const getPreviousInterviews = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return scheduledInterviews.filter(interview => {
      // Interview is previous if the scheduled date has completely passed (before today)
      const interviewDate = new Date(interview.date.getFullYear(), interview.date.getMonth(), interview.date.getDate());
      return interviewDate < today;
    });
  };

  const getEndTime = (startTime: string) => {
    // Parse start time
    const [time, period] = startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    
    // Add 8 minutes
    totalMinutes += 8;
    
    // Convert back to 12-hour format
    const endHours24 = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    const endPeriod = endHours24 >= 12 ? 'PM' : 'AM';
    const endHours12 = endHours24 > 12 ? endHours24 - 12 : endHours24 === 0 ? 12 : endHours24;
    
    return `${endHours12}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (showScheduler && selectedPosition) {
    return (
      <InterviewScheduler
        positionName={selectedPosition}
        onBack={() => {
          setShowScheduler(false);
          setSelectedPosition(null);
        }}
        onGoToCalendar={() => setShowCalendar(true)}
      />
    );
  }

  if (showGrader && selectedCandidate) {
    return (
      <InterviewGrader
        candidate={selectedCandidate}
        onBack={() => {
          setShowGrader(false);
          setSelectedCandidate(null);
        }}
      />
    );
  }

  if (showResults) {
    return (
      <InterviewResults
        onBack={() => setShowResults(false)}
      />
    );
  }

  if (showCalendar) {
    return (
      <InterviewCalendarView
        onBack={() => setShowCalendar(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview data...</p>
        </div>
      </div>
    );
  }

  const upcomingInterviews = getUpcomingInterviews();
  const previousInterviews = getPreviousInterviews();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Executive Dashboard
            </Button>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowCalendar(true)}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
              
              <Button
                onClick={() => setShowResults(true)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                View Interview Results
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Management
          </h1>
          <p className="text-gray-600">
            Schedule and manage candidate interviews 
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Upcoming Interviews */}
        <Card className="mb-8 border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Upcoming Interviews
            </CardTitle>
            <CardDescription>
              Interviews scheduled for today or future dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No upcoming interviews scheduled
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.candidateId} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {interview.candidateName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {interview.position} • Grade {interview.grade}
                      </p>
                      <p className="text-sm text-blue-600 font-medium">
                        {formatDate(interview.date)} {interview.timeSlot} - {interview.endTime}
                      </p>
                      {interview.hasGrades && (
                        <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
                          Graded
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        // Find the candidate in applications
                        const candidate = applications.find(app => app.id === interview.candidateId);
                        if (candidate) {
                          setSelectedCandidate(candidate);
                          setShowGrader(true);
                        }
                      }}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {interview.hasGrades ? 'View Grades' : 'Start Interview'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Interviews */}
        {previousInterviews.length > 0 && (
          <Card className="mb-8 border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                Previous Interviews
              </CardTitle>
              <CardDescription>
                Interviews that occurred on previous dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {previousInterviews.map((interview) => (
                  <div key={interview.candidateId} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {interview.candidateName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {interview.position} • Grade {interview.grade}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        Completed: {formatDate(interview.date)} {interview.timeSlot} - {interview.endTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {interview.hasGrades ? (
                        <Badge variant="secondary" className="bg-green-200 text-green-700">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-200 text-yellow-700">
                          Needs Grading
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Positions Grid */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Interview Scheduling by Position</CardTitle>
            <CardDescription>
              Schedule interviews for candidates by position (ordered by application grade)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {positions.map((position) => {
                const positionApps = getPositionApplications(position);
                const scheduled = positionApps.filter(app => app.interviewScheduled).length;
                
                return (
                  <Card 
                    key={position}
                    className="border shadow-sm bg-gray-50 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg text-gray-900">{position}</h3>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-800">
                          {positionApps.length} qualified
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Scheduled:</span>
                          <span className="font-medium text-blue-600">{scheduled}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-medium text-gray-600">{positionApps.length - scheduled}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setSelectedPosition(position);
                          setShowScheduler(true);
                        }}
                        disabled={positionApps.length === 0}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Interviews
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewView;
