import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Trash2, Users, Clock, CheckCircle } from 'lucide-react';
import { getAllApplications, updateInterviewStatus, ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InterviewSchedulerProps {
  positionName: string;
  onBack: () => void;
  onGoToCalendar: () => void;
}

interface Executive {
  id: string;
  name: string;
  email: string;
}

interface ScheduledInterview {
  candidateId: string;
  candidateName: string;
  date: Date;
  timeSlot: string;
  panelMembers: string[];
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  positionName,
  onBack,
  onGoToCalendar
}) => {
  const [qualifiedApplications, setQualifiedApplications] = useState<ApplicationData[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedPanelMembers, setSelectedPanelMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const timeSlots = [
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM', '4:00 PM', '4:15 PM', '4:30 PM'
  ];

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  };

  const formatDateEST = (date: Date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'superadmin'));
        const querySnapshot = await getDocs(q);
        
        const superAdminUsers: Executive[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          superAdminUsers.push({
            id: doc.id,
            name: userData.name || userData.fullName || 'Unnamed User',
            email: userData.email || ''
          });
        });
        
        setExecutives(superAdminUsers);
      } catch (error) {
        console.error('Error fetching executives:', error);
      }
    };

    fetchExecutives();
  }, []);

  useEffect(() => {
    const loadQualifiedApplications = async () => {
      try {
        const applications = await getAllApplications();
        // Show all submitted applications for the position, regardless of score
        const qualified = applications.filter(app => 
          app.position === positionName && 
          app.status === 'submitted'
        );
        
        // Sort by score if available, otherwise by submission date
        const sortedQualified = qualified.sort((a, b) => {
          if (a.score && b.score) {
            return (b.score || 0) - (a.score || 0);
          }
          if (a.score && !b.score) return -1;
          if (!a.score && b.score) return 1;
          // If no scores, sort by submission date
          const aDate = a.submittedAt || a.updatedAt;
          const bDate = b.submittedAt || b.updatedAt;
          return bDate.getTime() - aDate.getTime();
        });
        
        console.log(`Found ${qualified.length} applications for ${positionName}:`, qualified);
        setQualifiedApplications(sortedQualified);
        
        await loadScheduledInterviews(sortedQualified);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQualifiedApplications();
  }, [positionName]);

  const loadScheduledInterviews = async (applications: ApplicationData[]) => {
    const interviews: ScheduledInterview[] = [];
    
    for (const app of applications) {
      if (app.interviewScheduled) {
        try {
          const interviewDoc = await getDoc(doc(db, 'interviews', app.id));
          if (interviewDoc.exists()) {
            const data = interviewDoc.data();
            interviews.push({
              candidateId: app.id,
              candidateName: app.userProfile?.fullName || 'Unknown',
              date: data.date.toDate(),
              timeSlot: data.timeSlot,
              panelMembers: data.panelMembers || []
            });
          }
        } catch (error) {
          console.error('Error loading interview for candidate:', app.id, error);
        }
      }
    }
    
    setScheduledInterviews(interviews);
  };

  const saveInterviewToFirebase = async (candidateId: string, interview: Omit<ScheduledInterview, 'candidateId' | 'candidateName'>) => {
    try {
      await setDoc(doc(db, 'interviews', candidateId), {
        date: interview.date,
        timeSlot: interview.timeSlot,
        panelMembers: interview.panelMembers,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving interview to Firebase:', error);
      throw error;
    }
  };

  const isTimeSlotTaken = (timeSlot: string, date: Date, excludeCandidateId?: string) => {
    return scheduledInterviews.some(interview => 
      interview.timeSlot === timeSlot && 
      interview.date.toDateString() === date.toDateString() &&
      interview.candidateId !== excludeCandidateId
    );
  };

  const getCandidateScheduledInfo = (candidateId: string) => {
    return scheduledInterviews.find(interview => interview.candidateId === candidateId);
  };

  const handlePanelMemberToggle = (executiveId: string) => {
    setSelectedPanelMembers(prev => 
      prev.includes(executiveId)
        ? prev.filter(id => id !== executiveId)
        : [...prev, executiveId]
    );
  };

  const handleScheduleInterview = async (candidate: ApplicationData) => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time slot",
        variant: "destructive",
      });
      return;
    }

    if (selectedPanelMembers.length < 2) {
      toast({
        title: "Panel Members Required",
        description: "Please select at least 2 panel members for the interview",
        variant: "destructive",
      });
      return;
    }

    if (isTimeSlotTaken(selectedTimeSlot, selectedDate)) {
      toast({
        title: "Time Slot Unavailable",
        description: "This time slot is already booked. Please select another time.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateInterviewStatus(candidate.id, true);
      
      const newInterview: ScheduledInterview = {
        candidateId: candidate.id,
        candidateName: candidate.userProfile?.fullName || 'Unknown',
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        panelMembers: selectedPanelMembers
      };
      
      await saveInterviewToFirebase(candidate.id, newInterview);
      
      setScheduledInterviews(prev => [...prev, newInterview]);
      
      setQualifiedApplications(prev => 
        prev.map(app => 
          app.id === candidate.id 
            ? { ...app, interviewScheduled: true }
            : app
        )
      );
      
      setSelectedTimeSlot('');
      setSelectedPanelMembers([]);
      
      const panelMemberNames = selectedPanelMembers.map(id => 
        executives.find(exec => exec.id === id)?.name
      ).join(', ');
      
      toast({
        title: "Interview Scheduled",
        description: `Interview scheduled for ${candidate.userProfile?.fullName} on ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot} with panel: ${panelMemberNames}`,
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive",
      });
    }
  };

  const handleRemoveInterview = async (candidateId: string) => {
    try {
      await updateInterviewStatus(candidateId, false);
      
      setScheduledInterviews(prev => prev.filter(interview => interview.candidateId !== candidateId));
      
      setQualifiedApplications(prev => 
        prev.map(app => 
          app.id === candidateId 
            ? { ...app, interviewScheduled: false }
            : app
        )
      );
      
      const candidateName = qualifiedApplications.find(app => app.id === candidateId)?.userProfile?.fullName || 'Unknown';
      
      toast({
        title: "Interview Removed",
        description: `Interview for ${candidateName} has been removed`,
      });
    } catch (error) {
      console.error('Error removing interview:', error);
      toast({
        title: "Error",
        description: "Failed to remove interview",
        variant: "destructive",
      });
    }
  };

  const getPanelMemberNames = (panelMemberIds: string[]) => {
    return panelMemberIds
      .map(id => executives.find(exec => exec.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Scheduler - {positionName}
          </h1>
          <p className="text-gray-600">
            Schedule interviews for qualified candidates
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Interview</CardTitle>
              <CardDescription>
                Select date, time, and panel members for interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date() || !isWeekday(date)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Interviews are only available on weekdays
                </p>
              </div>

              {selectedDate && (
                <div>
                  <Label className="text-sm font-medium">Time Slot</Label>
                  <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => {
                        const isTaken = isTimeSlotTaken(time, selectedDate);
                        return (
                          <SelectItem 
                            key={time} 
                            value={time}
                            disabled={isTaken}
                          >
                            {time} {isTaken && '(Taken)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Panel Members (minimum 2)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {executives.map((exec) => (
                    <div key={exec.id} className="flex items-center space-x-2">
                      <Button
                        variant={selectedPanelMembers.includes(exec.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePanelMemberToggle(exec.id)}
                        className="w-full justify-start"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {exec.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidates for {positionName}</CardTitle>
              <CardDescription>
                {qualifiedApplications.length} submitted applications (sorted by grade)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualifiedApplications.map((application, index) => {
                  const scheduledInfo = getCandidateScheduledInfo(application.id);
                  
                  return (
                    <div key={application.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div>
                            <h4 className="font-semibold text-lg">{application.userProfile?.fullName}</h4>
                            <p className="text-sm text-gray-600">
                              Grade {application.userProfile?.grade} • Student #{application.userProfile?.studentNumber}
                            </p>
                            {application.score ? (
                              <p className="text-sm font-medium text-blue-600">
                                Score: {application.score?.toFixed(1)}/10
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Score: Not yet graded
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {scheduledInfo && (
                        <div className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <div className="flex items-center text-sm text-blue-700 mb-1">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="font-medium">Interview Scheduled</span>
                          </div>
                          <p className="text-sm text-blue-600">
                            {formatDateEST(scheduledInfo.date)}
                          </p>
                          <p className="text-sm text-blue-600">
                            Panel: {getPanelMemberNames(scheduledInfo.panelMembers)}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {!application.interviewScheduled ? (
                          <Button
                            onClick={() => handleScheduleInterview(application)}
                            disabled={!selectedDate || !selectedTimeSlot || selectedPanelMembers.length < 2}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Schedule Interview
                          </Button>
                        ) : (
                          <div className="flex space-x-2 w-full">
                            <Button
                              onClick={onGoToCalendar}
                              size="sm"
                              variant="outline"
                              className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleRemoveInterview(application.id)}
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove Interview
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {qualifiedApplications.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No submitted applications found for this position.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;
