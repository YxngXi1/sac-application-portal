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
import { collection, getDocs, query, where, doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ApplicationGrader from './ApplicationGrader';

interface PositionApplicationsProps {
  positionId: string;
  positionName: string;
  onBack: () => void;
  filteredApplications?: ApplicationData[];
  gradeFilter?: string;
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

const PositionApplications: React.FC<PositionApplicationsProps> = ({
  positionId,
  positionName,
  onBack,
  filteredApplications,
  gradeFilter
}) => {
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicationData | null>(null);
  const [gradeMode, setGradeMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [schedulingCandidate, setSchedulingCandidate] = useState<string | null>(null);
  const [schedulingInterviewType, setSchedulingInterviewType] = useState<'one' | 'two'>('one');
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

  // Function to check if a date is valid for interview scheduling
  const isValidInterviewDate = (date: Date, interviewType: 'one' | 'two') => {
    const year = 2025; // Assuming interviews are in 2024
    
    if (interviewType === 'one') {
      // September 11-12, 2024
      const sept11 = new Date(year, 8, 11); // Month is 0-indexed
      const sept12 = new Date(year, 8, 12);
      return (date.toDateString() === sept11.toDateString() || 
              date.toDateString() === sept12.toDateString());
    } else {
      // September 15-18, 2024 (weekdays only: 16, 17, 18 since 15 is Sunday)
      const sept16 = new Date(year, 8, 16); // Monday
      const sept17 = new Date(year, 8, 17); // Tuesday
      const sept18 = new Date(year, 8, 18); // Wednesday
      return (date.toDateString() === sept16.toDateString() || 
              date.toDateString() === sept17.toDateString() || 
              date.toDateString() === sept18.toDateString());
    }
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

  const getScheduledInterviewByCandidate = async (candidateId: string, positionId: string): Promise<ScheduledInterview | null> => {
    try {
      const interviewRef = doc(db, 'scheduledInterviews', `${candidateId}_${positionId}`);
      const docSnap = await getDoc(interviewRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          interviewOneDate: data.interviewOneDate?.toDate(),
          interviewTwoDate: data.interviewTwoDate?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as ScheduledInterview;
      }
      return null;
    } catch (error) {
      console.error('Error getting scheduled interview:', error);
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

  // Load executives from Firebase
  useEffect(() => {
    const loadExecutives = async () => {
      try {
        // Fetch both executives and superadmins like in the old version
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
        console.error('Error loading executives:', error);
      }
    };

    loadExecutives();
  }, []);

  // Load applications and scheduled interviews
  useEffect(() => {
    const loadData = async () => {
      try {
        if (filteredApplications) {
          setApplications(filteredApplications);
        } else {
          const positionApplications = await getAllApplicationsByPosition(positionId);
          const submittedApps = positionApplications.filter(app => app.status === 'submitted');
          setApplications(submittedApps);
        }

        // Load scheduled interviews
        const interviews = await getScheduledInterviewsByPosition(positionId);
        setScheduledInterviews(interviews);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [positionId, filteredApplications]);

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
  
  // Group Interview can have up to 5 people per slot
  if (interviewType === 'one') {
    return interviews.length >= 5;
  }
  
  // Individual Interview remains 1 person per slot
  return interviews.length >= 1;
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

    // if (selectedPanelMembers.length < 2) {
    //   toast({
    //     title: "Panel Members Required",
    //     description: "Please select at least 2 panel members for the interview",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (isTimeSlotTaken(selectedTimeSlot, selectedDate, interviewType)) {
      const maxCandidates = interviewType === 'one' ? 5 : 1;
      toast({
        title: "Time Slot Unavailable",
        description: `This time slot is full (${maxCandidates} candidate${maxCandidates > 1 ? 's' : ''} max). Please select another time.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare the interview data - only include the specific interview being scheduled
      const interviewData: Partial<ScheduledInterview> & { candidateId: string; positionId: string } = {
        candidateId: candidate.id,
        positionId: positionId,
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
      const updatedInterviews = await getScheduledInterviewsByPosition(positionId);
      setScheduledInterviews(updatedInterviews);
      
      // Check if both interviews are now scheduled
      const updatedCandidateInterview = updatedInterviews.find(int => int.candidateId === candidate.id);
      const hasBothInterviews = updatedCandidateInterview?.interviewOneDate && updatedCandidateInterview?.interviewTwoDate;
      
      // Update interview status in applications
      if (hasBothInterviews) {
        await updateInterviewStatus(candidate.id, true);
        setApplications(prev => 
          prev.map(app => 
            app.id === candidate.id 
              ? { ...app, interviewScheduled: true }
              : app
          )
        );
      }
      
      // Reset scheduling state
      setSchedulingCandidate(null);
      setSchedulingInterviewType('one');
      setSelectedTimeSlot('');
      setSelectedPanelMembers([]);
      
      const panelMemberNames = selectedPanelMembers.map(id => 
        executives.find(exec => exec.id === id)?.name
      ).join(', ');
      
      const interviewLabel = interviewType === 'one' ? 'Group Interview' : 'Individual Interview';
      
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

  const handleRemoveInterview = async (applicationId: string, interviewType: 'one' | 'two') => {
    try {
      // Clear the specific interview
      await clearSpecificInterview(applicationId, positionId, interviewType);
      
      // Reload interviews
      const updatedInterviews = await getScheduledInterviewsByPosition(positionId);
      setScheduledInterviews(updatedInterviews);
      
      // Check if candidate still has any interviews
      const candidateInterview = updatedInterviews.find(int => int.candidateId === applicationId);
      const hasAnyInterview = candidateInterview?.interviewOneDate || candidateInterview?.interviewTwoDate;
      
      // Update interview status if no interviews remain
      if (!hasAnyInterview) {
        await updateInterviewStatus(applicationId, false);
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, interviewScheduled: false }
              : app
          )
        );
      }
      
      const interviewLabel = interviewType === 'one' ? 'Group Interview' : 'Individual Interview';
      
      toast({
        title: `${interviewLabel} Removed`,
        description: `${interviewLabel} has been removed successfully`,
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

  // ...existing code for remaining component logic...
  if (selectedApplicant && gradeMode) {
    return (
      <ApplicationGrader
        application={selectedApplicant}
        positionName={positionName}
        onBack={() => {
          setSelectedApplicant(null);
          setGradeMode(false);
        }}
        onNavigateToApplication={(newApplication) => setSelectedApplicant(newApplication)}
        filteredApplications={applications}
        gradeFilter={gradeFilter}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{positionName}</h1>
          <p className="text-gray-600">
            {gradeFilter ? `Applications with grade: ${gradeFilter}` : 'All applications for this position'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submittedApplications.length}</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewedCount}</div>
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
                    <TableHead>Interviews</TableHead>
                    <TableHead>Submitted (EST)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => {
                    const candidateInterview = getCandidateInterview(application.id);
                    
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
                          <div className="space-y-1">
                            {candidateInterview?.interviewOneDate ? (
                              <div className="text-xs">
                                <Badge variant="default" className="mb-1">Group Interview</Badge>
                                <div className="text-gray-600">
                                  {candidateInterview.interviewOneDate.toLocaleDateString()} at {candidateInterview.interviewOneTime}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Group Interview: Pending</Badge>
                            )}
                            
                            {candidateInterview?.interviewTwoDate ? (
                              <div className="text-xs">
                                <Badge variant="default" className="mb-1">Individual Interview</Badge>
                                <div className="text-gray-600">
                                  {candidateInterview.interviewTwoDate.toLocaleDateString()} at {candidateInterview.interviewTwoTime}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Individual Interview: Pending</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {application.submittedAt ? 
                            formatDateEST(application.submittedAt) : 
                            'Not submitted'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-2">
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
                            </div>
                            
                            {application.status === 'submitted' && (
                              <div className="space-y-1">
                                {/* Group Interview Actions */}
                                {!candidateInterview?.interviewOneDate ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          setSchedulingCandidate(application.id);
                                          setSchedulingInterviewType('one');
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <CalendarIcon className="h-4 w-4 mr-1" />
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
                                            Available: September 11-12, 2024
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
                                                  
                                                  const maxSlots = schedulingInterviewType === 'one' ? 5 : 1;
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
                                ) : (
                                  <div className="flex space-x-1">
                                    <Button
                                      onClick={() => handleRemoveInterview(application.id, 'one')}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Remove Int. 1
                                    </Button>
                                  </div>
                                )}

                                {/* Individual Interview Actions */}
                                {!candidateInterview?.interviewTwoDate ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          setSchedulingCandidate(application.id);
                                          setSchedulingInterviewType('two');
                                        }}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CalendarIcon className="h-4 w-4 mr-1" />
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
                                            Available: September 16-18, 2024 (weekdays only)
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
                                  <div className="flex space-x-1">
                                    <Button
                                      onClick={() => handleRemoveInterview(application.id, 'two')}
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Remove Int. 2
                                    </Button>
                                  </div>
                                )}
                              </div>
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