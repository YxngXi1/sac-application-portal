
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, FileText, Plus, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ApplicationDashboard = () => {
  const { userProfile } = useAuth();
  
  // Mock data - will be replaced with real Firebase data
  const applicationDeadline = new Date('2024-02-15');
  const currentDate = new Date();
  const daysLeft = Math.ceil((applicationDeadline.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
  
  const currentApplication = {
    position: 'President',
    progress: 65,
    status: 'in_progress',
    lastUpdated: '2024-01-20',
    sections: {
      personal: { completed: true, title: 'Personal Information' },
      essay: { completed: true, title: 'Leadership Essay' },
      experience: { completed: false, title: 'Experience & Activities' },
      references: { completed: false, title: 'References' },
      review: { completed: false, title: 'Review & Submit' }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isExecOrSuperAdmin = userProfile?.role === 'exec' || userProfile?.role === 'superadmin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Exec View Button */}
        {isExecOrSuperAdmin && (
          <div className="flex justify-end">
            <Button variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
              <Settings className="h-4 w-4 mr-2" />
              Show Exec View
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.fullName || userProfile?.name || 'Student'}!
            </h1>
            <p className="text-gray-600 mt-2">
              Track your SAC application progress and submit before the deadline
            </p>
            {userProfile?.studentNumber && (
              <p className="text-sm text-gray-500 mt-1">
                Student Number: {userProfile.studentNumber}
                {userProfile.studentType && userProfile.studentType !== 'none' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {userProfile.studentType}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{daysLeft} days left to submit</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Deadline: {applicationDeadline.toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current Application */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Current Application</CardTitle>
                    <CardDescription>
                      {currentApplication.position} Position
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(currentApplication.status)}>
                    {formatStatus(currentApplication.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Application Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {currentApplication.progress}%
                    </span>
                  </div>
                  <Progress value={currentApplication.progress} className="h-2" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Application Sections</h4>
                  {Object.entries(currentApplication.sections).map(([key, section]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          section.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium">{section.title}</span>
                      </div>
                      {section.completed ? (
                        <Badge variant="outline" className="text-green-700 border-green-200">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Pending
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Continue Application
                  </Button>
                  <Button variant="outline">
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Available Positions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Available Positions
                </CardTitle>
                <CardDescription>
                  Start a new application for additional positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {['Vice President', 'Secretary', 'Treasurer', 'Social Coordinator', 'Spirit Coordinator', 'Grade 9 Rep'].map((position) => (
                    <Button 
                      key={position}
                      variant="outline" 
                      className="h-auto p-4 text-left justify-start hover:bg-blue-50 hover:border-blue-300"
                    >
                      <div>
                        <div className="font-medium">{position}</div>
                        <div className="text-sm text-gray-500">Click to apply</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Applications</span>
                  </div>
                  <span className="font-semibold">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Days Remaining</span>
                  </div>
                  <span className="font-semibold text-orange-600">{daysLeft}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Profile Complete</span>
                  </div>
                  <span className="font-semibold text-green-600">100%</span>
                </div>
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-800">Application Deadline</div>
                  <div className="text-sm text-red-600">{applicationDeadline.toLocaleDateString()}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">Interview Period</div>
                  <div className="text-sm text-blue-600">Feb 20 - Mar 1, 2024</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800">Results Announced</div>
                  <div className="text-sm text-green-600">March 8, 2024</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDashboard;
