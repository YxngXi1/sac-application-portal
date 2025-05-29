
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Clock, User, CheckCircle, XCircle, Calendar as CalendarIcon, Users, Edit } from 'lucide-react';
import { ApplicationData, updateInterviewStatus, getApplicationGrades } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InterviewSchedulerProps {
  position: string;
  applications: ApplicationData[];
  onBack: () => void;
}

interface ScheduledInterview {
  candidateId: string;
  date: Date;
  timeSlot: string;
  panelMembers: string[];
}

interface Executive {
  id: string;
  name: string;
  email: string;
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({ 
  position, 
  applications, 
  onBack 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [selectedPanelMembers, setSelectedPanelMembers] = useState<string[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [editingInterview, setEditingInterview] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTimeSlot, setEditTimeSlot] = useState<string>('');
  const [editPanelMembers, setEditPanelMembers] = useState<string[]>([]);
  
  // Updated time slots: 11:00 AM - 12:00 PM and 3:00 PM - 4:45 PM in 15-minute intervals
  const timeSlots = [
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM', '4:00 PM', '4:15 PM', '4:30 PM'
  ];
  
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Function to check if a date is a weekday
  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday (1) to Friday (5)
  };

  // Load existing interview schedules from Firebase
  useEffect(() => {
    const loadInterviewSchedules = async () => {
      try {
        const interviewsRef = collection(db, 'interviewSchedules');
        const q = query(interviewsRef, where('position', '==', position));
        const querySnapshot = await getDocs(q);
        
        const loadedInterviews: ScheduledInterview[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          loadedInterviews.push({
            candidateId: data.candidateId,
            date: data.date.toDate ? data.date.toDate() : new Date(data.date),
            timeSlot: data.timeSlot,
            panelMembers: data.panelMembers || []
          });
        });
        
        setScheduledInterviews(loadedInterviews);
      } catch (error) {
        console.error('Error loading interview schedules:', error);
      }
    };

    loadInterviewSchedules();
  }, [position]);

  // Fetch superadmin users from Firebase
  useEffect(() => {
    const fetchSuperAdminUsers = async () => {
      try {
        console.log('Fetching superadmin users...');
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
        
        console.log('Found superadmin users:', superAdminUsers);
        setExecutives(superAdminUsers);
      } catch (error) {
        console.error('Error fetching superadmin users:', error);
        toast({
          title: "Error",
          description: "Failed to load panel members",
          variant: "destructive",
        });
      }
    };

    fetchSuperAdminUsers();
  }, [toast]);

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

  const handleEditPanelMemberToggle = (executiveId: string) => {
    setEditPanelMembers(prev => 
      prev.includes(executiveId)
        ? prev.filter(id => id !== executiveId)
        : [...prev, executiveId]
    );
  };

  const saveInterviewToFirebase = async (interview: ScheduledInterview) => {
    try {
      const interviewRef = doc(db, 'interviewSchedules', `${position}_${interview.candidateId}`);
      await updateDoc(interviewRef, {
        candidateId: interview.candidateId,
        position: position,
        date: interview.date,
        timeSlot: interview.timeSlot,
        panelMembers: interview.panelMembers,
        updatedAt: new Date()
      });
    } catch (error) {
      // If document doesn't exist, create it
      const interviewRef = doc(db, 'interviewSchedules', `${position}_${interview.candidateId}`);
      await updateDoc(interviewRef, {
        candidateId: interview.candidateId,
        position: position,
        date: interview.date,
        timeSlot: interview.timeSlot,
        panelMembers: interview.panelMembers,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
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
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        panelMembers: selectedPanelMembers
      };
      
      await saveInterviewToFirebase(newInterview);
      setScheduledInterviews(prev => [...prev, newInterview]);
      setSelectedTimeSlot('');
      setSelectedCandidate('');
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

  const handleEditInterview = async (candidate: ApplicationData) => {
    if (!editDate || !editTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time slot",
        variant: "destructive",
      });
      return;
    }

    if (editPanelMembers.length < 2) {
      toast({
        title: "Panel Members Required",
        description: "Please select at least 2 panel members for the interview",
        variant: "destructive",
      });
      return;
    }

    if (isTimeSlotTaken(editTimeSlot, editDate, candidate.id)) {
      toast({
        title: "Time Slot Unavailable",
        description: "This time slot is already booked. Please select another time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedInterview: ScheduledInterview = {
        candidateId: candidate.id,
        date: editDate,
        timeSlot: editTimeSlot,
        panelMembers: editPanelMembers
      };
      
      await saveInterviewToFirebase(updatedInterview);
      setScheduledInterviews(prev => 
        prev.map(interview => 
          interview.candidateId === candidate.id ? updatedInterview : interview
        )
      );
      
      setEditingInterview(null);
      setEditDate(undefined);
      setEditTimeSlot('');
      setEditPanelMembers([]);
      
      const panelMemberNames = editPanelMembers.map(id => 
        executives.find(exec => exec.id === id)?.name
      ).join(', ');
      
      toast({
        title: "Interview Updated",
        description: `Interview updated for ${candidate.userProfile?.fullName} on ${editDate.toLocaleDateString()} at ${editTimeSlot} with panel: ${panelMemberNames}`,
      });
    } catch (error) {
      console.error('Error updating interview:', error);
      toast({
        title: "Error",
        description: "Failed to update interview",
        variant: "destructive",
      });
    }
  };

  const handleRemoveInterview = async (candidate: ApplicationData) => {
    try {
      await updateInterviewStatus(candidate.id, false);
      
      // Remove from Firebase
      const interviewRef = doc(db, 'interviewSchedules', `${position}_${candidate.id}`);
      await updateDoc(interviewRef, {
        deleted: true,
        deletedAt: new Date()
      });
      
      setScheduledInterviews(prev => prev.filter(interview => interview.candidateId !== candidate.id));
      
      toast({
        title: "Interview Removed",
        description: `Interview removed for ${candidate.userProfile?.fullName}`,
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

  const handleRejectCandidate = async (candidate: ApplicationData) => {
    try {
      // Remove any scheduled interview first
      if (getCandidateScheduledInfo(candidate.id)) {
        setScheduledInterviews(prev => prev.filter(interview => interview.candidateId !== candidate.id));
      }
      
      toast({
        title: "Candidate Rejected",
        description: `${candidate.userProfile?.fullName} has been rejected`,
      });
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to reject candidate",
        variant: "destructive",
      });
    }
  };

  const startEditingInterview = (candidateId: string) => {
    const scheduledInfo = getCandidateScheduledInfo(candidateId);
    if (scheduledInfo) {
      setEditingInterview(candidateId);
      setEditDate(scheduledInfo.date);
      setEditTimeSlot(scheduledInfo.timeSlot);
      setEditPanelMembers(scheduledInfo.panelMembers);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview View
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schedule Interviews: {position}
          </h1>
          <p className="text-gray-600">
            Candidates ordered by application grade (highest first)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar, Time Selection, and Panel Assignment */}
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Schedule Interview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calendar */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-900">Select Date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date() || !isWeekday(date)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Interviews are only available on weekdays
                </p>
              </div>
              
              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">
                    Available Times - {selectedDate.toLocaleDateString()}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Available: 11:00 AM - 12:00 PM & 3:00 PM - 4:45 PM (15-min slots)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => {
                      const isTaken = isTimeSlotTaken(time, selectedDate);
                      const isSelected = selectedTimeSlot === time;
                      
                      return (
                        <Button
                          key={time}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          disabled={isTaken}
                          onClick={() => setSelectedTimeSlot(isSelected ? '' : time)}
                          className={`
                            ${isTaken ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isSelected ? 'bg-blue-600 text-white' : ''}
                          `}
                        >
                          {time}
                          {isTaken && <span className="ml-1 text-xs">(Taken)</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Panel Member Selection */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select Panel Members (minimum 2)
                </h3>
                {executives.length === 0 ? (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      No superadmin users found. Contact your system administrator.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executives.map((exec) => (
                      <div key={exec.id} className="flex items-center space-x-2">
                        <Button
                          variant={selectedPanelMembers.includes(exec.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePanelMemberToggle(exec.id)}
                          className="w-full justify-start"
                        >
                          <User className="h-4 w-4 mr-2" />
                          {exec.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedPanelMembers.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <p className="text-sm text-blue-800 font-medium">
                      Selected Panel ({selectedPanelMembers.length}):
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPanelMembers.map(id => {
                        const exec = executives.find(e => e.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {exec?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selection Summary */}
              {selectedDate && selectedTimeSlot && selectedPanelMembers.length >= 2 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Ready to schedule: {selectedDate.toLocaleDateString()} at {selectedTimeSlot}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Panel: {selectedPanelMembers.map(id => executives.find(e => e.id === id)?.name).join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Candidates List */}
          <div className="lg:col-span-2">
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Candidates for {position}</CardTitle>
                <CardDescription>
                  {applications.length} qualified candidates (sorted by grade)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((candidate, index) => {
                    const scheduledInfo = getCandidateScheduledInfo(candidate.id);
                    const isScheduled = !!scheduledInfo || candidate.interviewScheduled;
                    
                    return (
                      <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            #{index + 1}
                          </Badge>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {candidate.userProfile?.fullName || 'N/A'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Grade {candidate.userProfile?.grade}</span>
                              <span>Student #{candidate.userProfile?.studentNumber}</span>
                              {candidate.userProfile?.studentType && candidate.userProfile.studentType !== 'none' && (
                                <Badge variant="outline" className="text-xs border-gray-300">
                                  {candidate.userProfile.studentType}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium text-blue-600">
                                Score: {candidate.score || 0}/100
                              </span>
                            </div>
                            {isScheduled && scheduledInfo && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <div className="text-sm font-medium text-green-800">
                                  Interview Scheduled:
                                </div>
                                <div className="text-sm text-green-700">
                                  📅 {scheduledInfo.date.toLocaleDateString()} at {scheduledInfo.timeSlot}
                                </div>
                                {scheduledInfo.panelMembers.length > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    Panel: {scheduledInfo.panelMembers.map(id => 
                                      executives.find(e => e.id === id)?.name
                                    ).join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!isScheduled ? (
                            <>
                              <Button
                                onClick={() => handleScheduleInterview(candidate)}
                                size="sm"
                                className="bg-gray-800 hover:bg-gray-900 text-white"
                                disabled={!selectedDate || !selectedTimeSlot || selectedPanelMembers.length < 2}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Schedule Interview
                              </Button>
                              <Button
                                onClick={() => handleRejectCandidate(candidate)}
                                size="sm"
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => startEditingInterview(candidate.id)}
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Edit Interview</DialogTitle>
                                    <DialogDescription>
                                      Update interview details for {candidate.userProfile?.fullName}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {/* Date Selection */}
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Select Date</h4>
                                      <Calendar
                                        mode="single"
                                        selected={editDate}
                                        onSelect={setEditDate}
                                        className="rounded-md border"
                                        disabled={(date) => date < new Date() || !isWeekday(date)}
                                      />
                                    </div>

                                    {/* Time Selection */}
                                    {editDate && (
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Time Slot</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          {timeSlots.map((time) => {
                                            const isTaken = isTimeSlotTaken(time, editDate, candidate.id);
                                            const isSelected = editTimeSlot === time;
                                            
                                            return (
                                              <Button
                                                key={time}
                                                variant={isSelected ? "default" : "outline"}
                                                size="sm"
                                                disabled={isTaken}
                                                onClick={() => setEditTimeSlot(isSelected ? '' : time)}
                                                className={`text-xs ${isTaken ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              >
                                                {time}
                                                {isTaken && <span className="ml-1">(Taken)</span>}
                                              </Button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Panel Selection */}
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Panel Members (min 2)</h4>
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {executives.map((exec) => (
                                          <div key={exec.id} className="flex items-center space-x-2">
                                            <Button
                                              variant={editPanelMembers.includes(exec.id) ? "default" : "outline"}
                                              size="sm"
                                              onClick={() => handleEditPanelMemberToggle(exec.id)}
                                              className="w-full justify-start text-xs"
                                            >
                                              <User className="h-3 w-3 mr-2" />
                                              {exec.name}
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <Button
                                      onClick={() => handleEditInterview(candidate)}
                                      disabled={!editDate || !editTimeSlot || editPanelMembers.length < 2}
                                      className="w-full"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Update Interview
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                onClick={() => handleRemoveInterview(candidate)}
                                size="sm"
                                variant="destructive"
                              >
                                Remove Interview
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;
