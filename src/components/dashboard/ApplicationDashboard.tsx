
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadApplicationProgress, saveApplicationProgress } from '@/services/applicationService';
import ProfileEditDialog from './ProfileEditDialog';
import ExecDashboard from './ExecDashboard';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    return <ExecDashboard onBack={() => setShowExecView(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                SAC Application Portal
              </h1>
              <p className="text-gray-600 text-lg">
                Track your progress and manage applications
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {isExecOrSuperAdmin && (
                <Button 
                  variant="outline" 
                  className="bg-white border-gray-300 text-gray-800 hover:bg-gray-50 shadow-sm"
                  onClick={() => setShowExecView(!showExecView)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Executive Dashboard
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Application Section */}
            <div className="lg:col-span-2 space-y-6">
              {!hasStartedApplication ? (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-800 to-black text-white">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Apply?</h2>
                    <p className="text-gray-300 mb-8 text-lg">
                      Start your SAC application process and join our amazing team!
                    </p>
                    <Button 
                      onClick={handleStartApplication}
                      size="lg"
                      className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg font-semibold shadow-lg"
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-gray-700 to-black text-white rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl">Your Application Progress</CardTitle>
                        <CardDescription className="text-gray-300">
                          Position: {selectedPosition} • Progress: {applicationProgress}%
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Completion</span>
                        <span className="text-sm font-medium text-gray-700">{applicationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${applicationProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <Button
                        onClick={handleContinueApplication}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        Continue Application
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-gray-600" />
                              Reset Application
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to reset your application? This will permanently delete all your progress and answers. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleRestartApplication}
                              className="bg-gray-600 hover:bg-gray-700"
                            >
                              Reset Application
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Student Profile Sidebar */}
            <div>
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-6 w-6" />
                      <CardTitle className="text-lg">Student Profile</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProfileDialog(true)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Full Name</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {userProfile?.fullName || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Student Number</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {userProfile?.studentNumber || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Grade</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {userProfile?.grade || 'Not provided'}
                      </div>
                    </div>
                    {userProfile?.studentType && userProfile.studentType !== 'none' && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Program</div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
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
      </div>

      <ProfileEditDialog 
        open={showProfileDialog} 
        onOpenChange={setShowProfileDialog}
      />
    </div>
  );
};

export default ApplicationDashboard;
