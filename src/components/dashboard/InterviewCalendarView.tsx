import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Trash2, Users, Clock } from 'lucide-react';
import { getAllApplications, updateInterviewStatus, ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

interface InterviewCalendarViewProps {
  onBack: () => void;
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
  interviewTwoDate?: Date;
  interviewTwoTime?: string;
  interviewTwoPanelMembers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarInterview {
  candidateId: string;
  candidateName: string;
  position: string;
  date: Date;
  timeSlot: string;
  panelMembers: string[];
  interviewType: 'one' | 'two';
  interviewLabel: 'Group Interview' | 'Individual Interview';
}

const InterviewCalendarView: React.FC<InterviewCalendarViewProps> = ({ onBack }) => {
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [calendarInterviews, setCalendarInterviews] = useState<CalendarInterview[]>([]);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingInterview, setEditingInterview] = useState<CalendarInterview | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState<string>('');
  const [newPanelMembers, setNewPanelMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Check if time slot is available for editing
  const isTimeSlotAvailable = (timeSlot: string, date: Date, interviewType: 'one' | 'two', excludeCandidateId?: string) => {
    const existingInterviews = calendarInterviews.filter(interview => {
      if (excludeCandidateId && interview.candidateId === excludeCandidateId) {
        return false; // Exclude the interview being edited
      }
      return interview.interviewType === interviewType &&
        interview.timeSlot === timeSlot && 
        interview.date.toDateString() === date.toDateString();
    });
    
    // Group Interview can have up to 5 people per slot
    if (interviewType === 'one') {
      return existingInterviews.length < 5;
    }
    
    // Individual Interview is 1 person per slot
    return existingInterviews.length < 1;
  };

  // Fetch executives
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

  // Load scheduled interviews
  useEffect(() => {
    const loadScheduledInterviews = async () => {
      try {
        // Get all applications
        const apps = await getAllApplications();
        setApplications(apps);
        
        // Get all scheduled interviews
        const interviewsQuery = query(collection(db, 'scheduledInterviews'));
        const querySnapshot = await getDocs(interviewsQuery);
        
        const interviews: ScheduledInterview[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          interviews.push({
            id: doc.id,
            ...data,
            interviewOneDate: data.interviewOneDate?.toDate(),
            interviewTwoDate: data.interviewTwoDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as ScheduledInterview);
        });
        
        setScheduledInterviews(interviews);
        
        // Convert to calendar format
        const calendarData: CalendarInterview[] = [];
        
        interviews.forEach(interview => {
          const candidate = apps.find(app => app.id === interview.candidateId);
          const candidateName = candidate?.userProfile?.fullName || 'Unknown Candidate';
          const position = interview.positionId;
          
          // Add Group Interview if scheduled
          if (interview.interviewOneDate && interview.interviewOneTime) {
            calendarData.push({
              candidateId: interview.candidateId,
              candidateName,
              position,
              date: interview.interviewOneDate,
              timeSlot: interview.interviewOneTime,
              panelMembers: interview.interviewOnePanelMembers || [],
              interviewType: 'one',
              interviewLabel: 'Group Interview'
            });
          }
          
          // Add Individual Interview if scheduled
          if (interview.interviewTwoDate && interview.interviewTwoTime) {
            calendarData.push({
              candidateId: interview.candidateId,
              candidateName,
              position,
              date: interview.interviewTwoDate,
              timeSlot: interview.interviewTwoTime,
              panelMembers: interview.interviewTwoPanelMembers || [],
              interviewType: 'two',
              interviewLabel: 'Individual Interview'
            });
          }
        });
        
        setCalendarInterviews(calendarData);
      } catch (error) {
        console.error('Error loading interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (executives.length > 0) {
      loadScheduledInterviews();
    }
  }, [executives]);

  const handlePanelMemberToggle = (executiveId: string) => {
    setNewPanelMembers(prev => 
      prev.includes(executiveId)
        ? prev.filter(id => id !== executiveId)
        : [...prev, executiveId]
    );
  };

  const handleEditInterview = (interview: CalendarInterview) => {
    setEditingInterview(interview);
    setSelectedDate(interview.date);
    setNewTimeSlot(interview.timeSlot);
    setNewPanelMembers(interview.panelMembers);
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

  const updateSpecificInterview = async (candidateId: string, positionId: string, interviewType: 'one' | 'two', date: Date, timeSlot: string, panelMembers: string[]): Promise<void> => {
    try {
      const interviewRef = doc(db, 'scheduledInterviews', `${candidateId}_${positionId}`);
      
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (interviewType === 'one') {
        updateData.interviewOneDate = date;
        updateData.interviewOneTime = timeSlot;
        updateData.interviewOnePanelMembers = panelMembers;
      } else {
        updateData.interviewTwoDate = date;
        updateData.interviewTwoTime = timeSlot;
        updateData.interviewTwoPanelMembers = panelMembers;
      }
      
      await updateDoc(interviewRef, updateData);
    } catch (error) {
      console.error('Error updating specific interview:', error);
      throw error;
    }
  };

  const handleSaveEditedInterview = async () => {
    if (!editingInterview || !selectedDate || !newTimeSlot) return;

    // Check if the new time slot is available
    if (!isTimeSlotAvailable(newTimeSlot, selectedDate, editingInterview.interviewType, editingInterview.candidateId)) {
      const maxCandidates = editingInterview.interviewType === 'one' ? 5 : 1;
      toast({
        title: "Time Slot Unavailable",
        description: `This time slot is full (${maxCandidates} candidate${maxCandidates > 1 ? 's' : ''} max). Please select another time.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Update in Firebase
      await updateSpecificInterview(
        editingInterview.candidateId,
        editingInterview.position,
        editingInterview.interviewType,
        selectedDate,
        newTimeSlot,
        newPanelMembers
      );

      // Update local state
      const updatedInterview: CalendarInterview = {
        ...editingInterview,
        date: selectedDate,
        timeSlot: newTimeSlot,
        panelMembers: newPanelMembers
      };

      setCalendarInterviews(prev => 
        prev.map(interview => 
          interview.candidateId === editingInterview.candidateId && 
          interview.interviewType === editingInterview.interviewType
            ? updatedInterview 
            : interview
        )
      );

      const panelMemberNames = newPanelMembers.map(id => 
        executives.find(exec => exec.id === id)?.fullName
      ).join(', ');

      toast({
        title: "Interview Updated",
        description: `${editingInterview.interviewLabel} for ${editingInterview.candidateName} updated to ${selectedDate.toLocaleDateString()} at ${newTimeSlot} with panel: ${panelMemberNames}`,
      });

      setEditingInterview(null);
    } catch (error) {
      console.error('Error updating interview:', error);
      toast({
        title: "Error",
        description: "Failed to update interview",
        variant: "destructive",
      });
    }
  };

  const handleRemoveInterview = async (interview: CalendarInterview) => {
    try {
      // Clear the specific interview from Firebase
      await clearSpecificInterview(interview.candidateId, interview.position, interview.interviewType);
      
      // Remove from local state
      setCalendarInterviews(prev => 
        prev.filter(int => 
          !(int.candidateId === interview.candidateId && int.interviewType === interview.interviewType)
        )
      );
      
      // Check if candidate still has any interviews
      const remainingInterviews = calendarInterviews.filter(int => 
        int.candidateId === interview.candidateId && 
        !(int.candidateId === interview.candidateId && int.interviewType === interview.interviewType)
      );
      
      // Update interview status if no interviews remain
      if (remainingInterviews.length === 0) {
        await updateInterviewStatus(interview.candidateId, false);
      }

      toast({
        title: "Interview Removed",
        description: `${interview.interviewLabel} for ${interview.candidateName} has been removed`,
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

  const getInterviewsForDate = (date: Date) => {
    return calendarInterviews.filter(interview => 
      interview.date.toDateString() === date.toDateString()
    ).sort((a, b) => {
      // Sort by time slot
      const timeA = timeSlots.indexOf(a.timeSlot);
      const timeB = timeSlots.indexOf(b.timeSlot);
      return timeA - timeB;
    });
  };

  const getPanelMemberNames = (panelMemberIds: string[]) => {
    return panelMemberIds
      .map(id => executives.find(exec => exec.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getTimeSlotStats = (timeSlot: string, date: Date, interviewType: 'one' | 'two') => {
    const interviews = calendarInterviews.filter(interview => 
      interview.interviewType === interviewType &&
      interview.timeSlot === timeSlot && 
      interview.date.toDateString() === date.toDateString()
    );
    
    const maxSlots = interviewType === 'one' ? 5 : 1;
    return { current: interviews.length, max: maxSlots };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Calendar
          </h1>
          <p className="text-gray-600">
            View and manage all scheduled interviews (Group: up to 5 per slot, Individual: 1 per slot)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Select a date to view scheduled interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasInterview: (date) => getInterviewsForDate(date).length > 0
                }}
                modifiersStyles={{
                  hasInterview: { backgroundColor: '#dbeafe', fontWeight: 'bold' }
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Date Interviews */}
          <Card>
            <CardHeader>
              <CardTitle>
                Interviews for {selectedDate?.toLocaleDateString() || 'Select a date'}
              </CardTitle>
              <CardDescription>
                Scheduled interviews for the selected date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-4">
                  {getInterviewsForDate(selectedDate).map((interview, index) => (
                    <div key={`${interview.candidateId}-${interview.interviewType}`} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{interview.candidateName}</h4>
                          <p className="text-sm text-gray-600">{interview.position}</p>
                          <Badge 
                            variant={interview.interviewType === 'one' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {interview.interviewLabel}
                          </Badge>
                        </div>
                        <Badge variant="outline">{interview.timeSlot}</Badge>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Panel: {getPanelMemberNames(interview.panelMembers)}</span>
                      </div>

                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInterview(interview)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit {interview.interviewLabel}</DialogTitle>
                              <DialogDescription>
                                Update interview details for {interview.candidateName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label>Date</Label>
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  className="rounded-md border"
                                  disabled={(date) => !isValidInterviewDate(date, interview.interviewType)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Available: {interview.interviewType === 'one' 
                                    ? 'September 11-12, 2025' 
                                    : 'September 16-18, 2025 (weekdays only)'}
                                </p>
                              </div>

                              {selectedDate && (
                                <div>
                                  <Label>Time Slot</Label>
                                  <Select value={newTimeSlot} onValueChange={setNewTimeSlot}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {timeSlots.map((time) => {
                                        const stats = getTimeSlotStats(time, selectedDate, interview.interviewType);
                                        const isAvailable = isTimeSlotAvailable(time, selectedDate, interview.interviewType, interview.candidateId);
                                        const slotsText = interview.interviewType === 'one' ? ` (${stats.current}/${stats.max})` : '';
                                        
                                        return (
                                          <SelectItem 
                                            key={time} 
                                            value={time}
                                            disabled={!isAvailable}
                                          >
                                            {time}{slotsText} {!isAvailable && '(Full)'}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              <div>
                                <Label>Panel Members</Label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {executives.map((exec) => (
                                    <div key={exec.id} className="flex items-center space-x-2">
                                      <Button
                                        variant={newPanelMembers.includes(exec.id) ? "default" : "outline"}
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
                                onClick={handleSaveEditedInterview}
                                disabled={!selectedDate || !newTimeSlot}
                                className="w-full"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveInterview(interview)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {getInterviewsForDate(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No interviews scheduled for this date
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Select a date to view interviews
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewCalendarView;