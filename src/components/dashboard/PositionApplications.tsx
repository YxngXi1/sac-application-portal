
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, CheckCircle, XCircle, User, Edit } from 'lucide-react';
import { getAllApplicationsByPosition, updateInterviewStatus, type ApplicationData } from '@/services/applicationService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import SubmissionTimeDisplay from './SubmissionTimeDisplay';

interface PositionApplicationsProps {
  position: string;
}

interface Executive {
  id: string;
  name: string;
  email: string;
}

const PositionApplications: React.FC<PositionApplicationsProps> = ({ position }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedPanelMembers, setSelectedPanelMembers] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const applicationsData = await getAllApplicationsByPosition(position);
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to load applications. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
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
        toast({
          title: "Error",
          description: "Failed to load executives. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchSuperAdminUsers();
  }, [toast]);

  const getPanelMemberNames = (panelMemberIds: string[] = []) => {
    return panelMemberIds
      .map(id => executives.find(exec => exec.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleViewApplication = (app: ApplicationData) => {
    // Implement view application logic here
    console.log('View application:', app);
    alert(`View application for ${app.userProfile?.fullName}`);
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !selectedDate || !selectedTimeSlot) {
      toast({
        title: "Error",
        description: "Please fill in all interview details.",
        variant: "destructive",
      });
      return;
    }

    setIsScheduling(true);
    try {
      await updateInterviewStatus(
        selectedApplication.id,
        true,
        selectedDate,
        selectedTimeSlot,
        selectedPanelMembers
      );

      // Optimistically update the UI
      setApplications(apps =>
        apps.map(app =>
          app.id === selectedApplication.id
            ? { ...app, interviewScheduled: true, interviewDate: selectedDate, interviewTimeSlot: selectedTimeSlot, interviewPanelMembers: selectedPanelMembers }
            : app
        )
      );

      toast({
        title: "Success",
        description: "Interview scheduled successfully!",
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
      setIsSchedulingDialogOpen(false);
    }
  };

  const handleUpdateInterview = async () => {
    if (!selectedApplication || !selectedDate || !selectedTimeSlot) {
      toast({
        title: "Error",
        description: "Please fill in all interview details.",
        variant: "destructive",
      });
      return;
    }

    setIsScheduling(true);
    try {
      await updateInterviewStatus(
        selectedApplication.id,
        true,
        selectedDate,
        selectedTimeSlot,
        selectedPanelMembers
      );

      // Optimistically update the UI
      setApplications(apps =>
        apps.map(app =>
          app.id === selectedApplication.id
            ? { ...app, interviewScheduled: true, interviewDate: selectedDate, interviewTimeSlot: selectedTimeSlot, interviewPanelMembers: selectedPanelMembers }
            : app
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
      setIsScheduling(false);
      setIsEditDialogOpen(false);
    }
  };

  const handleRemoveInterview = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to remove the interview?')) {
      return;
    }

    setIsScheduling(true);
    try {
      await updateInterviewStatus(applicationId, false);

      // Optimistically update the UI
      setApplications(apps =>
        apps.map(app =>
          app.id === applicationId
            ? { ...app, interviewScheduled: false, interviewDate: null, interviewTimeSlot: null, interviewPanelMembers: null }
            : app
        )
      );

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
    } finally {
      setIsScheduling(false);
    }
  };

  const handleEditInterview = (app: ApplicationData) => {
    setSelectedApplication(app);
    setSelectedDate(app.interviewDate || '');
    setSelectedTimeSlot(app.interviewTimeSlot || '');
    setSelectedPanelMembers(app.interviewPanelMembers || []);
    setIsEditDialogOpen(true);
  };

  const handlePanelMemberToggle = (executiveId: string) => {
    setSelectedPanelMembers(prev => 
      prev.includes(executiveId)
        ? prev.filter(id => id !== executiveId)
        : [...prev, executiveId]
    );
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading applications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {position} Applications ({applications.length})
        </CardTitle>
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
                <TableHead>Applicant</TableHead>
                <TableHead>Student Info</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.userProfile?.fullName || 'Unknown'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>#{app.userProfile?.studentNumber || 'N/A'}</div>
                      <div className="text-gray-500">{app.userProfile?.grade || 'Unknown'} Grade</div>
                      {app.userProfile?.studentType && app.userProfile.studentType !== 'none' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {app.userProfile.studentType}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {app.submittedAt ? (
                      <SubmissionTimeDisplay submittedAt={app.submittedAt} />
                    ) : (
                      <span className="text-gray-500 text-sm">Not submitted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(app.status)}>
                      {formatStatus(app.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {app.interviewScheduled && app.interviewDate && app.interviewTimeSlot ? (
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(app.interviewDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">{app.interviewTimeSlot}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Panel: {getPanelMemberNames(app.interviewPanelMembers)}
                        </div>
                      </div>
                    ) : app.interviewScheduled ? (
                      <Badge className="bg-orange-100 text-orange-800">
                        Pending Schedule
                      </Badge>
                    ) : (
                      <span className="text-gray-500 text-sm">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {app.score !== undefined ? (
                      <div className="text-sm font-medium">
                        {app.score.toFixed(1)}%
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not graded</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewApplication(app)}
                      >
                        <User className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {app.status === 'submitted' && !app.interviewScheduled && (
                        <Dialog open={isSchedulingDialogOpen} onOpenChange={setIsSchedulingDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(app);
                                setSelectedDate('');
                                setSelectedTimeSlot('');
                                setSelectedPanelMembers([]);
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule Interview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Schedule Interview</DialogTitle>
                              <DialogDescription>
                                Schedule an interview for {selectedApplication?.userProfile?.fullName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">
                                  Date
                                </Label>
                                <Input
                                  type="date"
                                  id="date"
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="time" className="text-right">
                                  Time Slot
                                </Label>
                                <Input
                                  type="time"
                                  id="time"
                                  value={selectedTimeSlot}
                                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="panel" className="text-right">
                                  Panel Members
                                </Label>
                                <div className="col-span-3 space-y-2">
                                  {executives.map((executive) => (
                                    <div key={executive.id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`panel-${executive.id}`}
                                        checked={selectedPanelMembers.includes(executive.id)}
                                        onChange={() => handlePanelMemberToggle(executive.id)}
                                        className="rounded border-gray-300"
                                      />
                                      <label htmlFor={`panel-${executive.id}`} className="text-sm">
                                        {executive.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" onClick={handleScheduleInterview} disabled={isScheduling}>
                                {isScheduling ? (
                                  <>
                                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                                    Scheduling...
                                  </>
                                ) : (
                                  "Schedule"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      {app.interviewScheduled && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditInterview(app)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveInterview(app.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Interview Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Interview</DialogTitle>
              <DialogDescription>
                Update interview details for {selectedApplication?.userProfile?.fullName}
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
              <Button type="button" onClick={handleUpdateInterview} disabled={isScheduling}>
                {isScheduling ? (
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
      </CardContent>
    </Card>
  );
};

export default PositionApplications;
