
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, User, Edit, Trash2 } from 'lucide-react';
import { getAllApplicationsByPosition, updateInterviewStatus, type ApplicationData } from '@/services/applicationService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface InterviewCalendarViewProps {
  position: string;
  onBack: () => void;
}

interface Executive {
  id: string;
  name: string;
  email: string;
}

interface ScheduledInterview extends ApplicationData {
  interviewDate: string;
  interviewTimeSlot: string;
  interviewPanelMembers: string[];
}

const InterviewCalendarView: React.FC<InterviewCalendarViewProps> = ({ position, onBack }) => {
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<ScheduledInterview | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedPanelMembers, setSelectedPanelMembers] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchScheduledInterviews = async () => {
      setLoading(true);
      try {
        const applicationsData = await getAllApplicationsByPosition(position);
        const scheduled = applicationsData.filter(
          app => app.interviewScheduled && app.interviewDate && app.interviewTimeSlot
        ) as ScheduledInterview[];
        
        // Sort by date and time
        scheduled.sort((a, b) => {
          const dateA = new Date(`${a.interviewDate} ${a.interviewTimeSlot}`);
          const dateB = new Date(`${b.interviewDate} ${b.interviewTimeSlot}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        setScheduledInterviews(scheduled);
      } catch (error) {
        console.error('Error fetching scheduled interviews:', error);
        toast({
          title: "Error",
          description: "Failed to load scheduled interviews.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledInterviews();
  }, [position, toast]);

  useEffect(() => {
    const fetchSuperAdminUsers = async () => {
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
        console.error('Error fetching superadmin users:', error);
      }
    };

    fetchSuperAdminUsers();
  }, []);

  const getPanelMemberNames = (panelMemberIds: string[] = []) => {
    return panelMemberIds
      .map(id => executives.find(exec => exec.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleEditInterview = (interview: ScheduledInterview) => {
    setSelectedInterview(interview);
    setSelectedDate(interview.interviewDate);
    setSelectedTimeSlot(interview.interviewTimeSlot);
    setSelectedPanelMembers(interview.interviewPanelMembers || []);
    setIsEditDialogOpen(true);
  };

  const handleUpdateInterview = async () => {
    if (!selectedInterview || !selectedDate || !selectedTimeSlot) {
      toast({
        title: "Error",
        description: "Please fill in all interview details.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateInterviewStatus(
        selectedInterview.id,
        true,
        selectedDate,
        selectedTimeSlot,
        selectedPanelMembers
      );

      // Update local state
      setScheduledInterviews(interviews =>
        interviews.map(interview =>
          interview.id === selectedInterview.id
            ? { ...interview, interviewDate: selectedDate, interviewTimeSlot: selectedTimeSlot, interviewPanelMembers: selectedPanelMembers }
            : interview
        )
      );

      toast({
        title: "Success",
        description: "Interview updated successfully!",
      });
    } catch (error) {
      console.error('Error updating interview:', error);
      toast({
        title: "Error",
        description: "Failed to update interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setIsEditDialogOpen(false);
    }
  };

  const handleRemoveInterview = async (interview: ScheduledInterview) => {
    if (!window.confirm(`Are you sure you want to remove the interview for ${interview.userProfile?.fullName}?`)) {
      return;
    }

    try {
      await updateInterviewStatus(interview.id, false);
      setScheduledInterviews(interviews => interviews.filter(i => i.id !== interview.id));
      
      toast({
        title: "Success",
        description: "Interview removed successfully!",
      });
    } catch (error) {
      console.error('Error removing interview:', error);
      toast({
        title: "Error",
        description: "Failed to remove interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePanelMemberToggle = (executiveId: string) => {
    setSelectedPanelMembers(prev => 
      prev.includes(executiveId)
        ? prev.filter(id => id !== executiveId)
        : [...prev, executiveId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Interview View
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Interview Calendar</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center">Loading scheduled interviews...</div>
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
            Back to Interview View
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Calendar: {position}
          </h1>
          <p className="text-gray-600">
            {scheduledInterviews.length} scheduled interviews
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {scheduledInterviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interviews Scheduled</h3>
              <p className="text-gray-600">No interviews have been scheduled for this position yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scheduledInterviews.map((interview) => (
              <Card key={interview.id} className="border shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {interview.userProfile?.fullName || 'Unknown'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>Grade {interview.userProfile?.grade}</span>
                          <span>Student #{interview.userProfile?.studentNumber}</span>
                          {interview.userProfile?.studentType && interview.userProfile.studentType !== 'none' && (
                            <Badge variant="outline" className="text-xs">
                              {interview.userProfile.studentType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span>{formatDate(interview.interviewDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{interview.interviewTimeSlot}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Panel: {getPanelMemberNames(interview.interviewPanelMembers)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInterview(interview)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveInterview(interview)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Interview Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Interview</DialogTitle>
              <DialogDescription>
                Update interview details for {selectedInterview?.userProfile?.fullName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date" className="text-right">
                  Date
                </Label>
                <Input
                  type="date"
                  id="edit-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-time" className="text-right">
                  Time Slot
                </Label>
                <Input
                  type="time"
                  id="edit-time"
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-panel" className="text-right">
                  Panel Members
                </Label>
                <div className="col-span-3 space-y-2">
                  {executives.map((executive) => (
                    <div key={executive.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-panel-${executive.id}`}
                        checked={selectedPanelMembers.includes(executive.id)}
                        onChange={() => handlePanelMemberToggle(executive.id)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`edit-panel-${executive.id}`} className="text-sm">
                        {executive.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleUpdateInterview} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Interview"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InterviewCalendarView;
