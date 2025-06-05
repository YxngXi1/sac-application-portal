import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Eye, Star, MessageSquare, Calendar as CalendarIcon, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { getAllApplicationsByPosition, updateInterviewStatus } from '@/services/applicationService';
import { ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ApplicationGrader from './ApplicationGrader';

interface PositionApplicationsProps {
  positionId: string;
  positionName: string;
  onBack: () => void;
}

interface Executive {
  id: string;
  name: string;
  email: string;
}

interface ScheduledInterview {
  candidateId: string;
  date: Date;
  timeSlot: string;
  panelMembers: string[];
}

const PositionApplications: React.FC<PositionApplicationsProps> = ({
  positionId,
  positionName,
  onBack
}) => {
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicationData | null>(null);
  const [gradeMode, setGradeMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [schedulingCandidate, setSchedulingCandidate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedPanelMembers, setSelectedPanelMembers] = useState<string[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);

  const { toast } = useToast();

  // Time slots: 11:00 AM - 12:00 PM and 3:00 PM - 4:45 PM in 15-minute intervals
  const timeSlots = [
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM', '4:00 PM', '4:15 PM', '4:30 PM'
  ];

  // Function to check if a date is a weekday
  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday (1) to Friday (5)
  };

  // Helper function to format date in EST
  const formatDateEST = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Fetch superadmin users from Firebase
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

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const positionApplications = await getAllApplicationsByPosition(positionName);
        setApplications(positionApplications);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [positionName]);

  const isTimeSlotTaken = (timeSlot: string, date: Date) => {
    return scheduledInterviews.some(interview => 
      interview.timeSlot === timeSlot && 
      interview.date.toDateString() === date.toDateString()
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
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        panelMembers: selectedPanelMembers
      };
      
      setScheduledInterviews(prev => [...prev, newInterview]);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === candidate.id 
            ? { ...app, interviewScheduled: true }
            : app
        )
      );
      
      // Reset scheduling state
      setSchedulingCandidate(null);
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

  const handleRemoveInterview = async (applicationId: string) => {
    try {
      await updateInterviewStatus(applicationId, false);
      setScheduledInterviews(prev => prev.filter(interview => interview.candidateId !== applicationId));
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, interviewScheduled: false }
            : app
        )
      );
      
      toast({
        title: "Interview Removed",
        description: "Interview has been removed successfully",
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

  const handleViewApplication = (application: ApplicationData) => {
    setSelectedApplicant(application);
    setViewMode(true);
  };

  const gradingApplication = selectedApplicant && gradeMode;

  if (selectedApplicant && gradeMode) {
    return (
      <ApplicationGrader
        application={selectedApplicant}
        positionName={positionName}
        onBack={() => {
          setSelectedApplicant(null);
          setGradeMode(false);
        }}
        onNavigateToApplication={(newApplication) => setGradingApplication(newApplication)}
      />
    );
  }

  if (selectedApplicant && viewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4 mb-2">
              <Button variant="ghost" onClick={() => {
                setSelectedApplicant(null);
                setViewMode(false);
              }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedApplicant.userProfile?.fullName || 'Unknown Applicant'}
            </h1>
            <p className="text-gray-600">
              Position: {positionName} • Status: {selectedApplicant.status}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>
                Review the applicant's information and responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Applicant Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedApplicant.userProfile?.fullName || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Grade</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedApplicant.userProfile?.grade || 'Not provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Student Number</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedApplicant.userProfile?.studentNumber || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Application Responses */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Application Responses</h3>
                {selectedApplicant.answers && Object.keys(selectedApplicant.answers).length > 0 ? (
                  Object.entries(selectedApplicant.answers).map(([key, answer], index) => (
                    <div key={key} className="mb-6 p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Question {index + 1}</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-800">{answer as string}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No responses found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  const submittedApplications = applications.filter(app => app.status === 'submitted');
  const inProgressApplications = applications.filter(app => app.status === 'draft' && app.progress > 0);
  const interviewedCount = applications.filter(app => app.interviewScheduled).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {positionName} Applications
          </h1>
          <p className="text-gray-600">
            Review and manage applications for this position
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{submittedApplications.length}</p>
                <p className="text-sm text-gray-600">Submitted</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-600">{inProgressApplications.length}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">{interviewedCount}</p>
                <p className="text-sm text-gray-600">Interviewed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Click on an applicant to view details or enter grade mode
                </CardDescription>
              </div>
            </div>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Student Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Interview</TableHead>
                    <TableHead>Submitted (EST)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => {
                    const scheduledInfo = getCandidateScheduledInfo(application.id);
                    
                    return (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.userProfile?.fullName || 'Unknown'}
                        </TableCell>
                        <TableCell>{application.userProfile?.grade || 'N/A'}</TableCell>
                        <TableCell>{application.userProfile?.studentNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={application.status === 'submitted' ? "default" : "secondary"}>
                            {application.status === 'submitted' ? 'Submitted' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${application.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{application.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {application.score ? (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{application.score.toFixed(1)}/10</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not graded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {application.interviewScheduled && scheduledInfo ? (
                            <div className="text-xs">
                              <Badge variant="default" className="mb-1">Scheduled</Badge>
                              <div className="text-gray-600">
                                {scheduledInfo.date.toLocaleDateString()} at {scheduledInfo.timeSlot}
                              </div>
                              <div className="text-gray-500">
                                Panel: {scheduledInfo.panelMembers.map(id => 
                                  executives.find(exec => exec.id === id)?.name
                                ).join(', ')}
                              </div>
                            </div>
                          ) : application.interviewScheduled ? (
                            <Badge variant="default">Scheduled</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {application.submittedAt ? 
                            formatDateEST(application.submittedAt) : 
                            'Not submitted'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {application.status === 'submitted' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedApplicant(application);
                                  setGradeMode(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Grade
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewApplication(application)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {application.status === 'submitted' && (
                              <>
                                {!application.interviewScheduled ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => setSchedulingCandidate(application.id)}
                                        className="bg-gray-800 hover:bg-gray-900 text-white"
                                      >
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        Schedule Interview
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Schedule Interview</DialogTitle>
                                        <DialogDescription>
                                          Schedule interview for {application.userProfile?.fullName}
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
                                            disabled={(date) => date < new Date() || !isWeekday(date)}
                                          />
                                          <p className="text-xs text-gray-500 mt-1">
                                            Weekdays only
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
                                          onClick={() => handleScheduleInterview(application)}
                                          disabled={!selectedDate || !selectedTimeSlot || selectedPanelMembers.length < 2}
                                          className="w-full"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Schedule Interview
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <div className="flex space-x-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                        >
                                          <Clock className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle>Edit Interview</DialogTitle>
                                          <DialogDescription>
                                            Update interview details for {application.userProfile?.fullName}
                                          </DialogDescription>
                                        </DialogHeader>
                                        {/* Same dialog content as above */}
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      onClick={() => handleRemoveInterview(application.id)}
                                      size="sm"
                                      variant="destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionApplications;
