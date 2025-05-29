
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Users, Star, CalendarDays } from 'lucide-react';
import { getAllApplicationsByPosition, type ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import InterviewScheduler from './InterviewScheduler';
import ApplicationGrader from './ApplicationGrader';
import InterviewCalendarView from './InterviewCalendarView';

interface InterviewViewProps {
  position: string;
  onBack: () => void;
}

type ViewMode = 'overview' | 'scheduler' | 'grader' | 'calendar';

const InterviewView: React.FC<InterviewViewProps> = ({ position, onBack }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const applicationsData = await getAllApplicationsByPosition(position);
        const submittedApps = applicationsData.filter(app => app.status === 'submitted');
        
        // Sort by score (highest first)
        submittedApps.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        setApplications(submittedApps);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to load applications",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [position, toast]);

  const handleGradeApplication = (application: ApplicationData) => {
    setSelectedApplication(application);
    setViewMode('grader');
  };

  const scheduledCount = applications.filter(app => app.interviewScheduled).length;
  const totalApplications = applications.length;

  if (viewMode === 'scheduler') {
    return (
      <InterviewScheduler
        position={position}
        applications={applications}
        onBack={() => setViewMode('overview')}
      />
    );
  }

  if (viewMode === 'grader' && selectedApplication) {
    return (
      <ApplicationGrader
        application={selectedApplication}
        positionName={position}
        onBack={() => setViewMode('overview')}
      />
    );
  }

  if (viewMode === 'calendar') {
    return (
      <InterviewCalendarView
        position={position}
        onBack={() => setViewMode('overview')}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center">Loading applications...</div>
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
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Management: {position}
          </h1>
          <p className="text-gray-600">
            {scheduledCount} of {totalApplications} candidates have scheduled interviews
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => setViewMode('scheduler')}
            className="h-20 text-left flex flex-col items-start justify-center bg-blue-600 hover:bg-blue-700"
          >
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">Schedule Interviews</span>
            </div>
            <span className="text-sm opacity-90">Manage interview scheduling</span>
          </Button>

          <Button
            onClick={() => setViewMode('calendar')}
            variant="outline"
            className="h-20 text-left flex flex-col items-start justify-center border-2 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2 mb-1">
              <CalendarDays className="h-5 w-5" />
              <span className="font-semibold">Calendar View</span>
            </div>
            <span className="text-sm text-gray-600">View all scheduled interviews</span>
          </Button>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Interview Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scheduledCount}/{totalApplications}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Qualified Candidates</CardTitle>
            <CardDescription>
              Applications sorted by grade (highest first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No submitted applications found for this position.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application, index) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        #{index + 1}
                      </Badge>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {application.userProfile?.fullName || 'N/A'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Grade {application.userProfile?.grade}</span>
                          <span>Student #{application.userProfile?.studentNumber}</span>
                          {application.userProfile?.studentType && application.userProfile.studentType !== 'none' && (
                            <Badge variant="outline" className="text-xs border-gray-300">
                              {application.userProfile.studentType}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            Score: {application.score || 0}/100
                          </span>
                          {application.interviewScheduled && (
                            <Badge className="bg-green-100 text-green-800 ml-2">
                              Interview Scheduled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleGradeApplication(application)}
                      variant="outline"
                      size="sm"
                    >
                      Grade Application
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewView;
