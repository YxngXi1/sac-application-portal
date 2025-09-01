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
  interviewType?: 'one' | 'two'; // Add this field
}

const InterviewView: React.FC<InterviewViewProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showGrader, setShowGrader] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
   const [selectedInterviewType, setSelectedInterviewType] = useState<'one' | 'two' | null>(null);

  const grades = ['9', '10', '11', '12'];

  // 8-minute interviews with 2-minute buffer (10-minute intervals): 11:05 AM - 12:05 PM and 3:00 PM - 5:00 PM
  const timeSlots = [
    // Morning slots: 11:05 - 12:05 (6 slots)
    '11:05 AM', '11:15 AM', '11:25 AM', '11:35 AM', '11:45 AM', '11:55 AM',
    // Afternoon slots: 3:00 - 5:00 (12 slots)
    '3:00 PM', '3:10 PM', '3:20 PM', '3:30 PM', '3:40 PM', '3:50 PM', '4:00 PM', '4:10 PM', '4:20 PM', '4:30 PM', '4:40 PM', '4:50 PM'
  ];

  const getGradeApplications = (grade: string) => {
    return applications
      .filter(app => app.position === 'Honourary Member' && app.userProfile?.grade === grade)
      .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by score descending
  };

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
          // Look for the new scheduled interview format
          const scheduledInterviewDoc = await getDoc(doc(db, 'scheduledInterviews', `${app.id}_${app.position}`));
          
          if (scheduledInterviewDoc.exists()) {
            const data = scheduledInterviewDoc.data();
            
            // Check if grades have been submitted for this candidate's interviews
            const gradeDocOne = await getDoc(doc(db, 'interviewGrades', `${app.id}_interview_one`));
            const gradeDocTwo = await getDoc(doc(db, 'interviewGrades', `${app.id}_interview_two`));
            const hasGradesOne = gradeDocOne.exists() && gradeDocOne.data()?.panelGrades?.length > 0;
            const hasGradesTwo = gradeDocTwo.exists() && gradeDocTwo.data()?.panelGrades?.length > 0;
            
            // Add Group Interview if it exists
            if (data.interviewOneDate && data.interviewOneTime) {
              const interviewOneDate = data.interviewOneDate.toDate();
              
              interviews.push({
                candidateId: `${app.id}_interview_one`,
                candidateName: `${app.userProfile?.fullName || 'Unknown'} - Group Interview`,
                position: app.position,
                grade: app.userProfile?.grade || 'N/A',
                studentNumber: app.userProfile?.studentNumber || 'N/A',
                date: interviewOneDate,
                timeSlot: data.interviewOneTime,
                endTime: getEndTime(data.interviewOneTime),
                hasGrades: hasGradesOne,
                interviewType: 'one'
              });
            }
            
            // Add Individual Interview if it exists
            if (data.interviewTwoDate && data.interviewTwoTime) {
              const interviewTwoDate = data.interviewTwoDate.toDate();
              
              interviews.push({
                candidateId: `${app.id}_interview_two`,
                candidateName: `${app.userProfile?.fullName || 'Unknown'} - Individual Interview`,
                position: app.position,
                grade: app.userProfile?.grade || 'N/A',
                studentNumber: app.userProfile?.studentNumber || 'N/A',
                date: interviewTwoDate,
                timeSlot: data.interviewTwoTime,
                endTime: getEndTime(data.interviewTwoTime),
                hasGrades: hasGradesTwo,
                interviewType: 'two'
              });
            }
          }
        } catch (error) {
          console.error('Error loading scheduled interview for candidate:', app.id, error);
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
    // const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return scheduledInterviews
      .filter(interview => {
        // Create the full interview datetime
        const [time, period] = interview.timeSlot.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let totalMinutes = hours * 60 + minutes;
        if (period === 'PM' && hours !== 12) {
          totalMinutes += 12 * 60;
        } else if (period === 'AM' && hours === 12) {
          totalMinutes -= 12 * 60;
        }
        
        const interviewDateTime = new Date(interview.date);
        interviewDateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
        
        // // Always check the 24-hour window first
        // const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // const isWithin24Hours = interviewDateTime >= twentyFourHoursAgo && interviewDateTime <= twentyFourHoursFromNow;
        
        // // Only show interviews within 24 hours
        // if (!isWithin24Hours) {
        //   return false;
        // }
        
        // If no grades have been submitted, show with a 5-minute grace period after start
        if (!interview.hasGrades) {
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          return interviewDateTime >= fiveMinutesAgo;
        }
        
        // If grades exist, only show if the interview hasn't started yet
        return interviewDateTime > now;
      })
      .sort((a, b) => {
        // Sort by datetime (earliest first)
        const getDateTime = (interview: ScheduledInterview) => {
          const [time, period] = interview.timeSlot.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          
          let totalMinutes = hours * 60 + minutes;
          if (period === 'PM' && hours !== 12) {
            totalMinutes += 12 * 60;
          } else if (period === 'AM' && hours === 12) {
            totalMinutes -= 12 * 60;
          }
          
          const dateTime = new Date(interview.date);
          dateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
          return dateTime;
        };
        
        return getDateTime(a).getTime() - getDateTime(b).getTime();
      });
  };

  const getPreviousInterviews = () => {
    const now = new Date();
    
    return scheduledInterviews
      .filter(interview => {
        // Only show as previous if grades have been submitted
        if (!interview.hasGrades) {
          return false;
        }

        // Check if the interview date/time has passed
        const [time, period] = interview.timeSlot.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let totalMinutes = hours * 60 + minutes;
        if (period === 'PM' && hours !== 12) {
          totalMinutes += 12 * 60;
        } else if (period === 'AM' && hours === 12) {
          totalMinutes -= 12 * 60;
        }
        
        const interviewDateTime = new Date(interview.date);
        interviewDateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
        
        // Add 30 minutes buffer to consider it "previous"
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        
        return interviewDateTime <= thirtyMinutesAgo;
      })
      .sort((a, b) => {
        // Sort by datetime (most recent first for previous interviews)
        const getDateTime = (interview: ScheduledInterview) => {
          const [time, period] = interview.timeSlot.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          
          let totalMinutes = hours * 60 + minutes;
          if (period === 'PM' && hours !== 12) {
            totalMinutes += 12 * 60;
          } else if (period === 'AM' && hours === 12) {
            totalMinutes -= 12 * 60;
          }
          
          const dateTime = new Date(interview.date);
          dateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
          return dateTime;
        };
        
        return getDateTime(b).getTime() - getDateTime(a).getTime();
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

  if (showScheduler && selectedGrade) {
    return (
      <InterviewScheduler
        positionName="Honourary Member"
        selectedGrade={selectedGrade} // Pass the selected grade
        onBack={() => {
          setShowScheduler(false);
          setSelectedGrade(null);
        }}
        onGoToCalendar={() => setShowCalendar(true)}
      />
    );
  }

if (showGrader && selectedCandidate && selectedInterviewType) {
    return (
      <InterviewGrader
        candidate={selectedCandidate}
        interviewType={selectedInterviewType}
        onBack={() => {
          setShowGrader(false);
          setSelectedCandidate(null);
          setSelectedInterviewType(null);
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
            Schedule and manage candidate interviews for Honourary Members
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
              Scheduled interviews that haven't been completed yet 
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No upcoming interviews scheduled
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => {
                  // Calculate if interview can be started (5 minutes before)
                  const now = new Date();
                  const [time, period] = interview.timeSlot.split(' ');
                  const [hours, minutes] = time.split(':').map(Number);
                  
                  let totalMinutes = hours * 60 + minutes;
                  if (period === 'PM' && hours !== 12) {
                    totalMinutes += 12 * 60;
                  } else if (period === 'AM' && hours === 12) {
                    totalMinutes -= 12 * 60;
                  }
                  
                  const interviewDateTime = new Date(interview.date);
                  interviewDateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
                  
                  // Allow starting 5 minutes before interview time
                  // const fiveMinutesBefore = new Date(interviewDateTime.getTime() - 5 * 60 * 1000);
                  // const canStartInterview = now >= fiveMinutesBefore;
                  const canStartInterview = true; // Allow starting anytime for now
                  
                  // Calculate time until interview can be started
                  // const timeUntilStart = fiveMinutesBefore.getTime() - now.getTime();
                  // const minutesUntilStart = Math.ceil(timeUntilStart / (60 * 1000));
                  
                  return (
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
                        {/* {!canStartInterview && minutesUntilStart > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Available in {minutesUntilStart} minute{minutesUntilStart !== 1 ? 's' : ''}
                          </p>
                        )} */}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Button
                          onClick={() => {
                            // Extract the original candidate ID from the modified format
                            const originalCandidateId = interview.candidateId.includes('_interview_') 
                              ? interview.candidateId.split('_interview_')[0]
                              : interview.candidateId;
                              
                            // Find the candidate in applications
                            const candidate = applications.find(app => app.id === originalCandidateId);
                            if (candidate) {
                              setSelectedCandidate(candidate);
                              setSelectedInterviewType(interview.interviewType || 'one');
                              setShowGrader(true);
                            }
                          }}
                          size="sm"
                          // disabled={!canStartInterview}
                          className={`${
                            canStartInterview 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                          }`}
                        >
                          {canStartInterview ? 'Start Interview' : 'Not Available'}
                        </Button>
                        {/* {!canStartInterview && (
                          <span className="text-xs text-gray-500">
                            Available 5min before
                          </span>
                        )} */}
                      </div>
                    </div>
                  );
                })}
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
                Completed interviews with submitted grades
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
                    <Badge variant="secondary" className="bg-green-200 text-green-700">
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grades Grid */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Interview Scheduling by Grade</CardTitle>
            <CardDescription>
              Schedule interviews for Honourary Member candidates by grade (ordered by application score)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {grades.map((grade) => {
                const gradeApps = getGradeApplications(grade);
                const scheduled = gradeApps.filter(app => app.interviewScheduled).length;
                
                return (
                  <Card 
                    key={grade}
                    className="border shadow-sm bg-gray-50 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg text-gray-900">Grade {grade}</h3>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-800">
                          {gradeApps.length} qualified
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Scheduled:</span>
                          <span className="font-medium text-blue-600">{scheduled}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-medium text-gray-600">{gradeApps.length - scheduled}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setSelectedGrade(grade);
                          setShowScheduler(true);
                        }}
                        disabled={gradeApps.length === 0}
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