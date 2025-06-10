
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Trash2, Users, Clock } from 'lucide-react';
import { getAllApplications, updateInterviewStatus, ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InterviewCalendarViewProps {
  onBack: () => void;
}

interface Executive {
  id: string;
  name: string;
  email: string;
}

interface ScheduledInterview {
  candidateId: string;
  candidateName: string;
  position: string;
  date: Date;
  timeSlot: string;
  panelMembers: string[];
}

const InterviewCalendarView: React.FC<InterviewCalendarViewProps> = ({ onBack }) => {
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingInterview, setEditingInterview] = useState<ScheduledInterview | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState<string>('');
  const [newPanelMembers, setNewPanelMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  // 8-minute interviews with 2-minute buffer (10-minute intervals): 11:05 AM - 12:05 PM and 3:00 PM - 5:00 PM
  const timeSlots = [
    // Morning slots: 11:05 - 12:05 (6 slots)
    '11:05 AM', '11:15 AM', '11:25 AM', '11:35 AM', '11:45 AM', '11:55 AM',
    // Afternoon slots: 3:00 - 5:00 (12 slots)
    '3:00 PM', '3:10 PM', '3:20 PM', '3:30 PM', '3:40 PM', '3:50 PM', '4:00 PM', '4:10 PM', '4:20 PM', '4:30 PM', '4:40 PM', '4:50 PM'
  ];

  // Fetch executives
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

  // Load scheduled interviews
  useEffect(() => {
    const loadScheduledInterviews = async () => {
      try {
        const applications = await getAllApplications();
        const scheduledApps = applications.filter(app => app.interviewScheduled);
        
        // Mock interview data - in real implementation, this would come from Firebase
        const mockInterviews: ScheduledInterview[] = scheduledApps.map((app, index) => ({
          candidateId: app.id,
          candidateName: app.userProfile?.fullName || 'Unknown',
          position: app.position,
          date: new Date(2025, 1, 5 + index, 14, 0), // Mock dates
          timeSlot: timeSlots[index % timeSlots.length],
          panelMembers: executives.slice(0, 2).map(e => e.id)
        }));
        
        setScheduledInterviews(mockInterviews);
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

  const handleEditInterview = (interview: ScheduledInterview) => {
    setEditingInterview(interview);
    setSelectedDate(interview.date);
    setNewTimeSlot(interview.timeSlot);
    setNewPanelMembers(interview.panelMembers);
  };

  const handleSaveEditedInterview = () => {
    if (!editingInterview || !selectedDate || !newTimeSlot) return;

    const updatedInterview: ScheduledInterview = {
      ...editingInterview,
      date: selectedDate,
      timeSlot: newTimeSlot,
      panelMembers: newPanelMembers
    };

    setScheduledInterviews(prev => 
      prev.map(interview => 
        interview.candidateId === editingInterview.candidateId 
          ? updatedInterview 
          : interview
      )
    );

    const panelMemberNames = newPanelMembers.map(id => 
      executives.find(exec => exec.id === id)?.name
    ).join(', ');

    toast({
      title: "Interview Updated",
      description: `Interview for ${editingInterview.candidateName} updated to ${selectedDate.toLocaleDateString()} at ${newTimeSlot} with panel: ${panelMemberNames}`,
    });

    setEditingInterview(null);
  };

  const handleRemoveInterview = async (interview: ScheduledInterview) => {
    try {
      await updateInterviewStatus(interview.candidateId, false);
      
      setScheduledInterviews(prev => 
        prev.filter(int => int.candidateId !== interview.candidateId)
      );

      toast({
        title: "Interview Removed",
        description: `Interview for ${interview.candidateName} has been removed`,
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
    return scheduledInterviews.filter(interview => 
      interview.date.toDateString() === date.toDateString()
    );
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
            View and manage all scheduled interviews (8-minute slots with 2-minute buffer)
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
                Scheduled interviews for the selected date (8 minutes each with 2-minute buffer)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-4">
                  {getInterviewsForDate(selectedDate).map((interview) => (
                    <div key={interview.candidateId} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{interview.candidateName}</h4>
                          <p className="text-sm text-gray-600">{interview.position}</p>
                        </div>
                        <Badge variant="secondary">{interview.timeSlot}</Badge>
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
                              <DialogTitle>Edit Interview</DialogTitle>
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
                                  disabled={(date) => date < new Date()}
                                />
                              </div>

                              <div>
                                <Label>Time Slot (8 minutes with 2-minute buffer)</Label>
                                <Select value={newTimeSlot} onValueChange={setNewTimeSlot}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

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
                                disabled={!selectedDate || !newTimeSlot || newPanelMembers.length < 2}
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
