
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, FileText, Plus, User, Settings, TrendingUp, Users, Target, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileEditDialog from './ProfileEditDialog';
import { useToast } from '@/hooks/use-toast';

const ApplicationDashboard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // Application state management
  const [hasStartedApplication, setHasStartedApplication] = React.useState(false);
  const [applicationProgress, setApplicationProgress] = React.useState(0);
  const [selectedPosition, setSelectedPosition] = React.useState<string>('');
  const [showProfileDialog, setShowProfileDialog] = React.useState(false);
  
  React.useEffect(() => {
    const saved = localStorage.getItem('applicationProgress');
    const savedPosition = localStorage.getItem('selectedPosition');
    const savedProgress = localStorage.getItem('progressPercentage');
    
    if (saved) {
      setHasStartedApplication(true);
      setSelectedPosition(savedPosition || '');
      setApplicationProgress(parseInt(savedProgress || '0'));
    }
  }, []);
  
  // Application deadline
  const applicationDeadline = new Date('2025-06-03');
  const currentDate = new Date();
  const daysLeft = Math.ceil((applicationDeadline.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));

  const isExecOrSuperAdmin = userProfile?.role === 'exec' || userProfile?.role === 'superadmin';

  const handleStartApplication = () => {
    window.location.href = '/apply';
  };

  const handleContinueApplication = () => {
    window.location.href = '/apply';
  };

  const handleRestartApplication = () => {
    localStorage.removeItem('applicationProgress');
    localStorage.removeItem('selectedPosition');
    localStorage.removeItem('progressPercentage');
    localStorage.removeItem('applicationData');
    
    setHasStartedApplication(false);
    setApplicationProgress(0);
    setSelectedPosition('');
    
    toast({
      title: "Application Reset",
      description: "Your application has been cleared. You can start fresh now.",
    });
  };

  const getProgressStatus = () => {
    if (applicationProgress === 0) return 'Not Started';
    if (applicationProgress < 100) return 'In Progress';
    return 'Completed';
  };

  const getProgressColor = () => {
    if (applicationProgress === 0) return 'text-gray-600';
    if (applicationProgress < 100) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-16 bg-gray-900 flex flex-col items-center py-4 space-y-6">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <User className="h-4 w-4 text-gray-900" />
        </div>
        <div className="space-y-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <Target className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="mt-auto">
          <div className="w-8 h-8 flex items-center justify-center">
            <Settings className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                SAC Application Portal
              </h1>
              <p className="text-gray-600">
                Track your progress and manage applications
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Week</span>
              </div>
              {isExecOrSuperAdmin && (
                <Button variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Show Exec View
                </Button>
              )}
            </div>
          </div>

          {/* Application Status Section */}
          {!hasStartedApplication ? (
            <div className="mb-8">
              <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Ready to Apply?</h2>
                  <p className="text-gray-600 mb-6">Start your SAC application process and join our amazing team!</p>
                  <Button 
                    onClick={handleStartApplication}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mb-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">Your Application Progress</CardTitle>
                      <CardDescription>
                        Position: {selectedPosition} • Status: <span className={getProgressColor()}>{getProgressStatus()}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleContinueApplication}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Continue Application
                      </Button>
                      <Button
                        onClick={handleRestartApplication}
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restart
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{applicationProgress}%</span>
                    </div>
                    <Progress value={applicationProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm opacity-90">Applications</span>
                    <FileText className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{hasStartedApplication ? '1' : '0'}</div>
                  <div className="text-sm opacity-75">
                    {hasStartedApplication ? 'In progress' : 'Not started'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm opacity-90">Progress</span>
                    <TrendingUp className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{applicationProgress}%</div>
                  <div className="text-sm opacity-75">Overall completion</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${daysLeft > 7 ? 'from-green-400 to-green-600' : daysLeft > 0 ? 'from-orange-400 to-orange-600' : 'from-red-400 to-red-600'} text-white p-6 rounded-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm opacity-90">Days Left</span>
                    <Clock className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{Math.max(0, daysLeft)}</div>
                  <div className="text-sm opacity-75">
                    {daysLeft > 0 ? 'Until deadline' : 'Applications closed'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deadline Alert */}
          {daysLeft <= 7 && daysLeft > 0 && (
            <div className="mb-8">
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-orange-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Application deadline is approaching! Due: Tuesday, June 3rd, 2025
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student Profile */}
          <div className="max-w-md">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Student Profile</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfileDialog(true)}
                  className="h-8"
                >
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Full Name</div>
                    <div className="font-medium">{userProfile?.fullName || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Student Number</div>
                    <div className="font-medium">{userProfile?.studentNumber || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Grade</div>
                    <div className="font-medium">{userProfile?.grade || 'Not provided'}</div>
                  </div>
                  {userProfile?.studentType && userProfile.studentType !== 'none' && (
                    <div>
                      <div className="text-sm text-gray-600">Program</div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {userProfile.studentType}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProfileEditDialog 
        open={showProfileDialog} 
        onOpenChange={setShowProfileDialog}
      />
    </div>
  );
};

export default ApplicationDashboard;
