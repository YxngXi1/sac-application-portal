
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Eye, Star, MessageSquare } from 'lucide-react';
import { getAllApplicationsByPosition, updateInterviewStatus } from '@/services/applicationService';
import { ApplicationData } from '@/services/applicationService';
import ApplicationGrader from './ApplicationGrader';

interface PositionApplicationsProps {
  positionId: string;
  positionName: string;
  onBack: () => void;
}

const PositionApplications: React.FC<PositionApplicationsProps> = ({
  positionId,
  positionName,
  onBack
}) => {
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicationData | null>(null);
  const [gradeMode, setGradeMode] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleInterviewToggle = async (applicationId: string) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      const newStatus = !application.interviewScheduled;
      await updateInterviewStatus(applicationId, newStatus);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, interviewScheduled: newStatus }
            : app
        )
      );
    } catch (error) {
      console.error('Error updating interview status:', error);
    }
  };

  if (selectedApplicant && gradeMode) {
    return (
      <ApplicationGrader
        application={selectedApplicant}
        positionName={positionName}
        onBack={() => {
          setSelectedApplicant(null);
          setGradeMode(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{applications.length}</p>
                <p className="text-sm text-blue-100">Total Applications</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{submittedApplications.length}</p>
                <p className="text-sm text-green-100">Submitted</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{inProgressApplications.length}</p>
                <p className="text-sm text-orange-100">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{interviewedCount}</p>
                <p className="text-sm text-purple-100">Interviewed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="border-0 shadow-lg bg-white">
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
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
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
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{application.score.toFixed(1)}/10</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not graded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={application.interviewScheduled ? "default" : "secondary"}>
                          {application.interviewScheduled ? "Scheduled" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {application.submittedAt ? 
                          new Date(application.submittedAt).toLocaleDateString() : 
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
                            onClick={() => setSelectedApplicant(application)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {application.status === 'submitted' && (
                            <Button
                              variant={application.interviewScheduled ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleInterviewToggle(application.id)}
                            >
                              {application.interviewScheduled ? "Remove Interview" : "Mark Interviewed"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
