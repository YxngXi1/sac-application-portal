
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadApplicationProgress, saveApplicationProgress } from '@/services/applicationService';
import ProfileEditDialog from './ProfileEditDialog';
import ExecDashboard from './ExecDashboard';
import { useToast } from '@/hooks/use-toast';

const ApplicationDashboard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // Application state management
  const [hasStartedApplication, setHasStartedApplication] = React.useState(false);
  const [applicationProgress, setApplicationProgress] = React.useState(0);
  const [selectedPosition, setSelectedPosition] = React.useState<string>('');
  const [showProfileDialog, setShowProfileDialog] = React.useState(false);
  const [showExecView, setShowExecView] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadProgress = async () => {
      if (!userProfile?.uid) return;
      
      try {
        const savedApplication = await loadApplicationProgress(userProfile.uid);
        if (savedApplication) {
          setHasStartedApplication(true);
          setSelectedPosition(savedApplication.position);
          setApplicationProgress(savedApplication.progress || 0);
        }
      } catch (error) {
        console.error('Error loading application progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userProfile]);

  const isExecOrSuperAdmin = userProfile?.role === 'exec' || userProfile?.role === 'superadmin';

  const handleStartApplication = () => {
    window.location.href = '/apply';
  };

  const handleContinueApplication = () => {
    window.location.href = '/apply';
  };

  const handleRestartApplication = async () => {
    if (!userProfile?.uid) return;
    
    try {
      // Clear Firebase data by saving empty application
      await saveApplicationProgress(userProfile.uid, {
        position: '',
        answers: {},
        progress: 0,
        status: 'draft',
      });
      
      setHasStartedApplication(false);
      setApplicationProgress(0);
      setSelectedPosition('');
      
      toast({
        title: "Application Reset",
        description: "Your application has been cleared from all devices.",
      });
    } catch (error) {
      console.error('Error resetting application:', error);
      toast({
        title: "Error",
        description: "Failed to reset application. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show exec dashboard if toggled
  if (showExecView && isExecOrSuperAdmin) {
    return <ExecDashboard />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-8">
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
              {isExecOrSuperAdmin && (
                <Button 
                  variant="outline" 
                  className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowExecView(!showExecView)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showExecView ? 'Show Student View' : 'Show Exec View'}
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
                        Position: {selectedPosition} • Progress: {applicationProgress}%
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleContinueApplication}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Continue Application
                      </Button>
                    </div>
                  </div>
                </CardHeader>
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
