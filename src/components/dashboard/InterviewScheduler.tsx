import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Trash2, Users, Clock, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { getAllApplications, updateInterviewStatus, ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
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
  id?: string;
  candidateId: string;
  positionId: string;
  interviewOneDate?: Date;
  interviewOneTime?: string;
  interviewOnePanelMembers?: string[];
  interviewTwoDate?: Date;
  interviewTwoTime?: string;
  interviewTwoPanelMembers?: string[];
  createdAt: Date;
  updatedAt: Date;
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
  const [schedulingCandidate, setSchedulingCandidate] = useState<string | null>(null);
  const [schedulingInterviewType, setSchedulingInterviewType] = useState<'one' | 'two'>('one');

  const { toast } = useToast();

  // Time slots: 11:00 AM - 12:00 PM and 3:00 PM - 4:45 PM in 15-minute intervals
  const timeSlots = [
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM', '4:00 PM', '4:15 PM', '4:30 PM'
  ];

  // Function to check if a date is valid for interview scheduling
  const isValidInterviewDate = (date: Date, interviewType: 'one' | 'two') => {
    const year = 2025; // Assuming interviews are in 2025
    
    if (interviewType === 'one') {
      // September 11-12, 2025
      const sept11 = new Date(year, 8, 11); // Month is 0-indexed
      const sept12 = new Date(year, 8, 12);
      return (date.toDateString() === sept11.toDateString() || 
              date.toDateString() === sept12.toDateString());
    } else {
      // September 15-18, 2025 (weekdays only: 16, 17, 18 since 15 is Sunday)
      const sept16 = new Date(year, 8, 16); // Monday
      const sept17 = new Date(year, 8, 17); // Tuesday
      const sept18 = new Date(year, 8, 18); // Wednesday
      return (date.toDateString() === sept16.toDateString() || 
              date.toDateString() === sept17.toDateString() || 
              date.toDateString() === sept18.toDateString());
    }
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

  // Firebase operations
  const saveScheduledInterview = async (interview: Partial<ScheduledInterview> & { candidateId: string; positionId: string }): Promise<string> => {
    try {
      const interviewRef = doc(db, 'scheduledInterviews', `${interview.candidateId}_${interview.positionId}`);
      const existingDoc = await getDoc(interviewRef);
      
      // Only include defined fields to avoid undefined errors
      const dataToSave: any = {
        candidateId: interview.candidateId,
        positionId: interview.positionId,
        updatedAt: new Date(),
      };
      
      // Only add fields that are defined
      if (interview.interviewOneDate !== undefined) {
        dataToSave.interviewOneDate = interview.interviewOneDate;
      }
      if (interview.interviewOneTime !== undefined) {
        dataToSave.interviewOneTime = interview.interviewOneTime;
      }
      if (interview.interviewOnePanelMembers !== undefined) {
        dataToSave.interviewOnePanelMembers = interview.interviewOnePanelMembers;
      }
      if (interview.interviewTwoDate !== undefined) {
        dataToSave.interviewTwoDate = interview.interviewTwoDate;
      }
      if (interview.interviewTwoTime !== undefined) {
        dataToSave.interviewTwoTime = interview.interviewTwoTime;
      }
      if (interview.interviewTwoPanelMembers !== undefined) {
        dataToSave.interviewTwoPanelMembers = interview.interviewTwoPanelMembers;
      }
      
      if (existingDoc.exists()) {
        // Merge with existing data
        const existingData = existingDoc.data();
        const mergedData = { ...existingData, ...dataToSave };
        await updateDoc(interviewRef, mergedData);
        return interviewRef.id;
      } else {
        // Create new document
        await setDoc(interviewRef, {
          ...dataToSave,
          createdAt: new Date(),
        });
        return interviewRef.id;
      }
    } catch (error) {
      console.error('Error saving scheduled interview:', error);
      throw error;
    }
  };

  const getScheduledInterviewsByPosition = async (positionId: string): Promise<ScheduledInterview[]> => {
    try {
      const q = query(
        collection(db, 'scheduledInterviews'),
        where('positionId', '==', positionId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          interviewOneDate: data.interviewOneDate?.toDate(),
          interviewTwoDate: data.interviewTwoDate?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      }) as ScheduledInterview[];
    } catch (error) {
      console.error('Error getting scheduled interviews:', error);
      throw error;
    }
  };

  const clearSpecificInterview = async (candidateId: string, positionId: string, interviewType: 'one' | 'two'): Promise<void> => {
    try {
      const interviewRef = doc(db, 'scheduledInterviews', `${candidateId}_${positionId}`);
      
      if (interviewType === 'one') {
        await updateDoc(interviewRef, {
          interviewOneDate: deleteField(),
          interviewOneTime: deleteField(),
          interviewOnePanelMembers: deleteField(),
          updatedAt: new Date(),
        });
      } else {
        await updateDoc(interviewRef, {
          interviewTwoDate: deleteField(),
          interviewTwoTime: deleteField(),
          interviewTwoPanelMembers: deleteField(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error clearing specific interview:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        // Fetch both executives and superadmins
        const executivesQuery = query(
          collection(db, 'users'),
          where('role', '==', 'executive')
        );
        const superadminsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'superadmin')
        );
        
        const [executivesSnapshot, superadminsSnapshot] = await Promise.all([
          getDocs(executivesQuery),
          getDocs(superadminsQuery)
        ]);
        
        const allExecutives: Executive[] = [];
        
        // Add executives
        executivesSnapshot.forEach((doc) => {
          const userData = doc.data();
          allExecutives.push({
            id: doc.id,
            name: userData.name || userData.fullName || 'Unnamed User',
            email: userData.email || ''
          });
        });
        
        // Add superadmins
        superadminsSnapshot.forEach((doc) => {
          const userData = doc.data();
          allExecutives.push({
            id: doc.id,
            name: userData.name || userData.fullName || 'Unnamed User',
            email: userData.email || ''
          });
        });
        
        setExecutives(allExecutives);
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
        
        // Load scheduled interviews
        const interviews = await getScheduledInterviewsByPosition(positionName);
        setScheduledInterviews(interviews);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQualifiedApplications();
  }, [positionName]);

  const isTimeSlotTaken = (timeSlot: string, date: Date) => {
    return scheduledInterviews.some(interview => {
      const interviewOneMatch = interview.interviewOneDate && 
        interview.interviewOneTime === timeSlot && 
        interview.interviewOneDate.toDateString() === date.toDateString();
      
      const interviewTwoMatch = interview.interviewTwoDate && 
        interview.interviewTwoTime === timeSlot && 
        interview.interviewTwoDate.toDateString() === date.toDateString();
      
      return interviewOneMatch || interviewTwoMatch;
    });
  };

  const getCandidateInterview = (candidateId: string): ScheduledInterview | null => {
    return scheduledInterviews.find(interview => interview.candidateId === candidateId) || null;
  };

  const handlePanelMemberToggle = (executiveId: string) => {
    setSelectedPanelMembers(prev => 
      prev.includes(executiveId)
        ? prev.filter(id => id !== executiveId)
        : [...prev, executiveId]
    );
  };

  const handleScheduleInterview = async (candidate: ApplicationData, interviewType: 'one' | 'two') => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time slot",
        variant: "destructive",
      });
      return;
    }

    // MAKE SURE TO CHANGE WHEN ACTUALLY DEPLOYING
    // if (selectedPanelMembers.length < 2) {
    //   toast({
    //     title: "Panel Members Required",
    //     description: "Please select at least 2 panel members for the interview",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (isTimeSlotTaken(selectedTimeSlot, selectedDate)) {
      toast({
        title: "Time Slot Unavailable",
        description: "This time slot is already booked. Please select another time.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare the interview data - only include the specific interview being scheduled
      const interviewData: Partial<ScheduledInterview> & { candidateId: string; positionId: string } = {
        candidateId: candidate.id,
        positionId: positionName,
      };
      
      // Only add the fields for the specific interview type
      if (interviewType === 'one') {
        interviewData.interviewOneDate = selectedDate;
        interviewData.interviewOneTime = selectedTimeSlot;
        interviewData.interviewOnePanelMembers = selectedPanelMembers;
      } else {
        interviewData.interviewTwoDate = selectedDate;
        interviewData.interviewTwoTime = selectedTimeSlot;
        interviewData.interviewTwoPanelMembers = selectedPanelMembers;
      }

      // Save to Firebase
      await saveScheduledInterview(interviewData);
      
      // Reload interviews to get updated data
      const updatedInterviews = await getScheduledInterviewsByPosition(positionName);
      setScheduledInterviews(updatedInterviews);
      
      // Check if both interviews are now scheduled
      const updatedCandidateInterview = updatedInterviews.find(int => int.candidateId === candidate.id);
      const hasBothInterviews = updatedCandidateInterview?.interviewOneDate && updatedCandidateInterview?.interviewTwoDate;
      
      // Update interview status in applications
      if (hasBothInterviews) {
        await updateInterviewStatus(candidate.id, true);
        setQualifiedApplications(prev => 
          prev.map(app => 
            app.id === candidate.id 
              ? { ...app, interviewScheduled: true }
              : app
          )
        );
      }
      
      setSelectedTimeSlot('');
      setSelectedPanelMembers([]);
      
      const panelMemberNames = selectedPanelMembers.map(id => 
        executives.find(exec => exec.id === id)?.name
      ).join(', ');
      
      const interviewLabel = interviewType === 'one' ? 'Interview One' : 'Interview Two';
      
      toast({
        title: `${interviewLabel} Scheduled`,
        description: `${interviewLabel} scheduled for ${candidate.userProfile?.fullName} on ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot} with panel: ${panelMemberNames}`,
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

  const handleRemoveInterview = async (candidateId: string, interviewType: 'one' | 'two') => {
    try {
      // Clear the specific interview
      await clearSpecificInterview(candidateId, positionName, interviewType);
      
      // Reload interviews
      const updatedInterviews = await getScheduledInterviewsByPosition(positionName);
      setScheduledInterviews(updatedInterviews);
      
      // Check if candidate still has any interviews
      const candidateInterview = updatedInterviews.find(int => int.candidateId === candidateId);
      const hasAnyInterview = candidateInterview?.interviewOneDate || candidateInterview?.interviewTwoDate;
      
      // Update interview status if no interviews remain
      if (!hasAnyInterview) {
        await updateInterviewStatus(candidateId, false);
        setQualifiedApplications(prev => 
          prev.map(app => 
            app.id === candidateId 
              ? { ...app, interviewScheduled: false }
              : app
          )
        );
      }
      
      const candidateName = qualifiedApplications.find(app => app.id === candidateId)?.userProfile?.fullName || 'Unknown';
      const interviewLabel = interviewType === 'one' ? 'Interview One' : 'Interview Two';
      
      toast({
        title: `${interviewLabel} Removed`,
        description: `${interviewLabel} for ${candidateName} has been removed and time slot freed up`,
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
            Schedule two interviews for each qualified candidate
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Candidates for {positionName}</CardTitle>
            <CardDescription>
              {qualifiedApplications.length} submitted applications (sorted by grade) - Each candidate needs 2 interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualifiedApplications.map((application, index) => {
                const candidateInterview = getCandidateInterview(application.id);
                
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

                    {/* Interview One Display */}
                    {candidateInterview?.interviewOneDate && (
                      <div className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <div className="flex items-center text-sm text-blue-700 mb-1">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="font-medium">Interview One Scheduled</span>
                        </div>
                        <p className="text-sm text-blue-600">
                          {formatDateEST(candidateInterview.interviewOneDate)} at {candidateInterview.interviewOneTime}
                        </p>
                        <p className="text-sm text-blue-600">
                          Panel: {getPanelMemberNames(candidateInterview.interviewOnePanelMembers || [])}
                        </p>
                      </div>
                    )}

                    {/* Interview Two Display */}
                    {candidateInterview?.interviewTwoDate && (
                      <div className="mb-3 p-3 bg-green-50 rounded border-l-4 border-green-400">
                        <div className="flex items-center text-sm text-green-700 mb-1">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="font-medium">Interview Two Scheduled</span>
                        </div>
                        <p className="text-sm text-green-600">
                          {formatDateEST(candidateInterview.interviewTwoDate)} at {candidateInterview.interviewTwoTime}
                        </p>
                        <p className="text-sm text-green-600">
                          Panel: {getPanelMemberNames(candidateInterview.interviewTwoPanelMembers || [])}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {/* Interview One Actions */}
                      {!candidateInterview?.interviewOneDate ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSchedulingCandidate(application.id);
                                setSchedulingInterviewType('one');
                              }}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Schedule Interview One
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Schedule Interview One</DialogTitle>
                              <DialogDescription>
                                Schedule Interview One for {application.userProfile?.fullName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Date Selection */}
                              <div>
                                <Label className="text-sm font-medium">Select Date</Label>
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  className="rounded-md border"
                                  disabled={(date) => !isValidInterviewDate(date, 'one')}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Available: September 11-12, 2025
                                </p>
                              </div>

                              {/* Time Selection */}
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

                              {/* Panel Selection */}
                              <div>
                                <Label className="text-sm font-medium">Panel Members (min 2)</Label>
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

                              <Button
                                onClick={() => handleScheduleInterview(application, 'one')}
                                className="w-full"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Schedule Interview One
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : !candidateInterview?.interviewTwoDate ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSchedulingCandidate(application.id);
                                setSchedulingInterviewType('two');
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Schedule Interview Two
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Schedule Interview Two</DialogTitle>
                              <DialogDescription>
                                Schedule Interview Two for {application.userProfile?.fullName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Date Selection */}
                              <div>
                                <Label className="text-sm font-medium">Select Date</Label>
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  className="rounded-md border"
                                  disabled={(date) => !isValidInterviewDate(date, 'two')}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Available: September 16-18, 2025 (weekdays only)
                                </p>
                              </div>

                              {/* Time Selection */}
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

                              {/* Panel Selection */}
                              <div>
                                <Label className="text-sm font-medium">Panel Members (min 2)</Label>
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

                              <Button
                                onClick={() => handleScheduleInterview(application, 'two')}
                                className="w-full"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Schedule Interview Two
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="flex space-x-2 w-full">
                          <Button
                            onClick={onGoToCalendar}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Interviews
                          </Button>
                        </div>
                      )}
                      
                      {/* Remove buttons for each interview */}
                      {candidateInterview?.interviewOneDate && (
                        <Button
                          onClick={() => handleRemoveInterview(application.id, 'one')}
                          size="sm"
                          variant="destructive"
                          className="px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {candidateInterview?.interviewTwoDate && (
                        <Button
                          onClick={() => handleRemoveInterview(application.id, 'two')}
                          size="sm"
                          variant="destructive"
                          className="px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
};

export default InterviewScheduler;