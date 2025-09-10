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
  selectedGrade?: string;
  onBack: () => void;
  onGoToCalendar: () => void;
}

interface Executive {
  id: string;
  name: string;
  fullName: string;
  email: string;
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

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  positionName,
  selectedGrade,
  onBack,
  onGoToCalendar
}) => {
  const [qualifiedApplications, setQualifiedApplications] = useState<ApplicationData[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedPanelMembers, setSelectedPanelMembers] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [schedulingCandidate, setSchedulingCandidate] = useState<string | null>(null);
  const [schedulingInterviewType, setSchedulingInterviewType] = useState<'one' | 'two'>('one');

  const { toast } = useToast();

  // Time slots for Group Interviews (Interview One) - 15 minute intervals
  const groupInterviewTimeSlots = [
    '11:05 AM', '11:17 AM', '11:29 AM', '11:41 AM'
  ];

  // Time slots for Individual Interviews (Interview Two) - 10 minute intervals
  const individualInterviewTimeSlots = [
    '11:05 AM', '11:15 AM', '11:25 AM', '11:35 AM', '11:45 AM', '11:55 AM',
    '3:00 PM', '3:11 PM', '3:22 PM', '3:33 PM', '3:44 PM', '3:55 PM', '4:06 PM', '4:17 PM'
  ];

  // Helper function to get time slots based on interview type
  const getTimeSlots = (interviewType: 'one' | 'two') => {
    return interviewType === 'one' ? groupInterviewTimeSlots : individualInterviewTimeSlots;
  };

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
      // September 15-18, 2025 (weekdays only: 16, 17, 18, 19 since 15 is Sunday)
      const sept15 = new Date(year, 8, 15);
      const sept16 = new Date(year, 8, 16); // Monday
      const sept17 = new Date(year, 8, 17); // Tuesday
      const sept18 = new Date(year, 8, 18); // Wednesday
      const sept19 = new Date(year, 8, 19); // Wednesday
      return (date.toDateString() === sept15.toDateString() || 
              date.toDateString() === sept16.toDateString() || 
              date.toDateString() === sept17.toDateString() || 
              date.toDateString() === sept18.toDateString() ||
              date.toDateString() === sept19.toDateString());
    }
  };

    // Function to get the next available time slot for a given interview type
  const getNextAvailableSlot = (interviewType: 'one' | 'two') => {
    const validDates = [];
    const timeSlots = getTimeSlots(interviewType);
    
    if (interviewType === 'one') {
      // September 11-12, 2025
      validDates.push(new Date(2025, 8, 11), new Date(2025, 8, 12));
    } else {
      // September 15-19, 2025
      validDates.push(new Date(2025, 8, 15), new Date(2025, 8, 16), new Date(2025, 8, 17), new Date(2025, 8, 18), new Date(2025, 8, 19));
    }
    
    // Check each date and time slot for availability
    for (const date of validDates) {
      for (const timeSlot of timeSlots) {
        if (!isTimeSlotTaken(timeSlot, date, interviewType)) {
          return { date, timeSlot };
        }
      }
    }
    
    return null; // No available slots
  };

  // Function to set next available slot when opening dialog
  const setNextAvailableSlot = (interviewType: 'one' | 'two') => {
    // Clear panel members when switching interview types
    setSelectedPanelMembers([]);
    
    const nextSlot = getNextAvailableSlot(interviewType);
    if (nextSlot) {
      setSelectedDate(nextSlot.date);
      setSelectedTimeSlot(nextSlot.timeSlot);
    } else {
      // If no slots available, still set a valid date but clear time slot
      const validDates = interviewType === 'one' 
        ? [new Date(2025, 8, 11)] 
        : [new Date(2025, 8, 15)];
      setSelectedDate(validDates[0]);
      setSelectedTimeSlot('');
    }
    
    // Set default room based on interview type
    if (interviewType === 'one') {
      setSelectedRoom(''); // Group interview allows choice between 216 and 217
    } else {
      setSelectedRoom('217'); // Individual interview defaults to 217
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
      if (interview.interviewOneRoom !== undefined) {
        dataToSave.interviewOneRoom = interview.interviewOneRoom;
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
      if (interview.interviewTwoRoom !== undefined) {
        dataToSave.interviewTwoRoom = interview.interviewTwoRoom;
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
      
      const interviews = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw Firebase data for interview:', doc.id, data); // Debug log
        
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
      
      console.log('Processed interviews:', interviews); // Debug log
      return interviews;
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
          interviewOneRoom: deleteField(),
          updatedAt: new Date(),
        });
      } else {
        await updateDoc(interviewRef, {
          interviewTwoDate: deleteField(),
          interviewTwoTime: deleteField(),
          interviewTwoPanelMembers: deleteField(),
          interviewTwoRoom: deleteField(),
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
          where('role', '==', 'exec')
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
          const resolvedName = userData.fullName;
          allExecutives.push({
            id: doc.id,
            name: String(resolvedName),
            fullName: String(resolvedName),
            email: userData.email || ''
          });
        });
        
        // Add superadmins
        superadminsSnapshot.forEach((doc) => {
          const userData = doc.data();
          const resolvedName = userData.fullName;
          allExecutives.push({
            id: doc.id,
            name: String(resolvedName),
            fullName: String(resolvedName),
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
        // Filter by position and status, and now also by grade if specified
        let qualified = applications.filter(app => 
          app.position === positionName && 
          app.status === 'submitted'
        );
        
        // If a specific grade is selected, filter by that grade
        if (selectedGrade) {
          qualified = qualified.filter(app => app.userProfile?.grade === selectedGrade);
        }
        
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
        
        console.log(`Found ${qualified.length} applications for ${positionName}${selectedGrade ? ` (Grade ${selectedGrade})` : ''}:`, qualified);
        setQualifiedApplications(sortedQualified);
        
        // Load scheduled interviews
        console.log('Loading interviews for position:', positionName); // Debug log
        const interviews = await getScheduledInterviewsByPosition(positionName);
        console.log('Loaded interviews:', interviews); // Debug log
        setScheduledInterviews(interviews);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQualifiedApplications();
  }, [positionName, selectedGrade]); 

  useEffect(() => {
    // Auto-set next available slot when transitioning between interview types
    if (schedulingCandidate && schedulingInterviewType) {
      // Always set the next available slot for the current interview type
      setNextAvailableSlot(schedulingInterviewType);
    }
  }, [schedulingCandidate, schedulingInterviewType]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('Scheduled interviews state updated:', scheduledInterviews);
  }, [scheduledInterviews]);

  useEffect(() => {
    console.log('Qualified applications state updated:', qualifiedApplications);
  }, [qualifiedApplications]);

  const isTimeSlotTaken = (timeSlot: string, date: Date, interviewType: 'one' | 'two') => {
    const interviews = scheduledInterviews.filter(interview => {
      if (interviewType === 'one') {
        return interview.interviewOneDate && 
          interview.interviewOneTime === timeSlot && 
          interview.interviewOneDate.toDateString() === date.toDateString();
      } else {
        return interview.interviewTwoDate && 
          interview.interviewTwoTime === timeSlot && 
          interview.interviewTwoDate.toDateString() === date.toDateString();
      }
    });
    
    // Group Interview can have up to 10 people per slot
    if (interviewType === 'one') {
      return interviews.length >= 10;
    }
    
    // Individual Interview remains 1 person per slot
    return interviews.length >= 1;
  };

  const getCandidateInterview = (candidateId: string): ScheduledInterview | null => {
    const interview = scheduledInterviews.find(interview => interview.candidateId === candidateId) || null;
    console.log(`Looking for interview for candidate ${candidateId}:`, interview); // Debug log
    return interview;
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

    if (!selectedRoom) {
      toast({
        title: "Missing Room",
        description: "Please select a room for the interview",
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

    if (isTimeSlotTaken(selectedTimeSlot, selectedDate, interviewType)) {
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
        interviewData.interviewOneRoom = selectedRoom;
      } else {
        interviewData.interviewTwoDate = selectedDate;
        interviewData.interviewTwoTime = selectedTimeSlot;
        interviewData.interviewTwoPanelMembers = selectedPanelMembers;
        interviewData.interviewTwoRoom = selectedRoom;
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
      
      // Clear current scheduling state
      setSelectedTimeSlot('');
      setSelectedPanelMembers([]);
      setSelectedRoom('');
      
      // If we just scheduled a group interview (type 'one'), automatically prepare for individual interview
      if (interviewType === 'one') {
        // Set up for individual interview scheduling
        setTimeout(() => {
          setNextAvailableSlot('two');
        }, 100); // Small delay to ensure state updates properly
      }
      
      const panelMemberNames = selectedPanelMembers.map(id => 
        executives.find(exec => exec.id === id)?.name
      ).join(', ');
      
      const interviewLabel = interviewType === 'one' ? 'Group Interview' : 'Individual Interview';
      
      toast({
        title: `${interviewLabel} Scheduled`,
        description: `${interviewLabel} scheduled for ${candidate.userProfile?.fullName} on ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot} in Room [${selectedRoom}] with panel: ${panelMemberNames}`,
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
      const interviewLabel = interviewType === 'one' ? 'Group Interview' : 'Individual Interview';
      
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
      .map(id => executives.find(exec => exec.id === id)?.fullName)
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
            Interview Scheduler - {positionName}{selectedGrade ? ` (Grade ${selectedGrade})` : ''}
          </h1>
          <p className="text-gray-600">
            Schedule two interviews for each qualified candidate{selectedGrade ? ` in Grade ${selectedGrade}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Candidates for {positionName}{selectedGrade ? ` - Grade ${selectedGrade}` : ''}</CardTitle>
            <CardDescription>
              {qualifiedApplications.length} submitted applications{selectedGrade ? ` from Grade ${selectedGrade}` : ''} (sorted by grade) - Each candidate needs 2 interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualifiedApplications.map((application, index) => {
                const candidateInterview = getCandidateInterview(application.id);
                console.log(`Rendering candidate ${application.userProfile?.fullName} (${application.id}):`, candidateInterview); // Debug log
                
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

                    {/* Group Interview Display */}
                    {candidateInterview?.interviewOneDate && (
                      <div className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <div className="flex items-center text-sm text-blue-700 mb-1">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="font-medium">Group Interview Scheduled</span>
                        </div>
                        <p className="text-sm text-blue-600">
                          {formatDateEST(candidateInterview.interviewOneDate)} at {candidateInterview.interviewOneTime}
                        </p>
                        <p className="text-sm text-blue-600">
                          Room: [{candidateInterview.interviewOneRoom}]
                        </p>
                        <p className="text-sm text-blue-600">
                          Panel: {getPanelMemberNames(candidateInterview.interviewOnePanelMembers || [])}
                        </p>
                      </div>
                    )}

                    {/* Individual Interview Display */}
                    {candidateInterview?.interviewTwoDate && (
                      <div className="mb-3 p-3 bg-green-50 rounded border-l-4 border-green-400">
                        <div className="flex items-center text-sm text-green-700 mb-1">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="font-medium">Individual Interview Scheduled</span>
                        </div>
                        <p className="text-sm text-green-600">
                          {formatDateEST(candidateInterview.interviewTwoDate)} at {candidateInterview.interviewTwoTime}
                        </p>
                        <p className="text-sm text-green-600">
                          Room: [{candidateInterview.interviewTwoRoom}]
                        </p>
                        <p className="text-sm text-green-600">
                          Panel: {getPanelMemberNames(candidateInterview.interviewTwoPanelMembers || [])}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">

                      {/* Group Interview Actions */}
                      {!candidateInterview?.interviewOneDate ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSchedulingCandidate(application.id);
                                setSchedulingInterviewType('one');
                                setNextAvailableSlot('one');
                              }}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Schedule Group Interview
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Schedule Group Interview</DialogTitle>
                              <DialogDescription>
                                Schedule Group Interview for {application.userProfile?.fullName}
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
                                      {getTimeSlots(schedulingInterviewType).map((time) => {
                                        const isTaken = isTimeSlotTaken(time, selectedDate, schedulingInterviewType);
                                        const currentBookings = scheduledInterviews.filter(interview => {
                                          if (schedulingInterviewType === 'one') {
                                            return interview.interviewOneDate && 
                                              interview.interviewOneTime === time && 
                                              interview.interviewOneDate.toDateString() === selectedDate.toDateString();
                                          } else {
                                            return interview.interviewTwoDate && 
                                              interview.interviewTwoTime === time && 
                                              interview.interviewTwoDate.toDateString() === selectedDate.toDateString();
                                          }
                                        }).length;
                                        
                                        const maxSlots = schedulingInterviewType === 'one' ? 10 : 1;
                                        const slotsText = schedulingInterviewType === 'one' ? ` (${currentBookings}/${maxSlots})` : '';
                                        
                                        return (
                                          <SelectItem 
                                            key={time} 
                                            value={time}
                                            disabled={isTaken}
                                          >
                                            {time}{slotsText} {isTaken && '(Full)'}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {/* Room Selection */}
                              <div>
                                <Label className="text-sm font-medium">Room</Label>
                                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select room" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="216">[216]</SelectItem>
                                    <SelectItem value="217">[217]</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

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
                                Schedule Group Interview
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
                                // This will now be handled by the useEffect above
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Schedule Individual Interview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Schedule Individual Interview</DialogTitle>
                              <DialogDescription>
                                Schedule Individual Interview for {application.userProfile?.fullName}
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
                                  Available: September 15-19, 2025
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
                                      {getTimeSlots(schedulingInterviewType).map((time) => {
                                        const isTaken = isTimeSlotTaken(time, selectedDate, schedulingInterviewType);
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

                              {/* Room Selection - Auto-filled for Individual Interview */}
                              <div>
                                <Label className="text-sm font-medium">Room</Label>
                                <Select value={selectedRoom} onValueChange={setSelectedRoom} disabled>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Room automatically assigned" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="217">[217]</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                  Individual interviews are automatically assigned to Room [217]
                                </p>
                              </div>

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
                                Schedule Individual Interview
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