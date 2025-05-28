
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User, AlertTriangle, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadApplicationProgress, saveApplicationProgress } from '@/services/applicationService';
import ProfileEditDialog from './ProfileEditDialog';
import ExecDashboard from './ExecDashboard';
import DeadlineTile from './DeadlineTile';
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
  const [applicationStatus, setApplicationStatus] = React.useState<string>('draft');
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
          setApplicationStatus(savedApplication.status || 'draft');
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
  const isApplicationSubmitted = applicationStatus === 'submitted';

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
      setApplicationStatus('draft');
      
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2">
                SAC Application Portal
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Track your progress and manage applications
              </p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              {isExecOrSuperAdmin && (
                <Button 
                  variant="outline" 
                  className="bg-white border-gray-300 text-gray-800 hover:bg-gray-50 shadow-sm flex-1 sm:flex-initial text-sm"
                  onClick={() => setShowExecView(!showExecView)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Executive Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Application Section */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {!hasStartedApplication ? (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-800 to-black text-white">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Apply?</h2>
                    <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg">
                      Start your SAC application process and join our amazing team!
                    </p>
                    <Button 
                      onClick={handleStartApplication}
                      size="lg"
                      className="bg-blue-600 text-white hover:bg-blue-700 px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto"
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ) : isApplicationSubmitted ? (
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-t-lg p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                      <div className="min-w-0">
                        <CardTitle className="text-xl sm:text-2xl">Application Completed</CardTitle>
                        <CardDescription className="text-green-100 text-sm sm:text-base">
                          Position: {selectedPosition}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-orange-50 rounded-lg">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
                          Application Pending
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Thank you for applying!</h3>
                        <p className="text-gray-600 text-sm sm:text-base">
                          Your application for <strong>{selectedPosition}</strong> has been submitted successfully. 
                          You will be notified about the status of your application soon.
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          No further action is required at this time.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-gray-700 to-black text-white rounded-t-lg p-4 sm:p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl sm:text-2xl">Your Application Progress</CardTitle>
                        <CardDescription className="text-gray-300 text-sm sm:text-base mt-1">
                          Position: {selectedPosition}
                        </CardDescription>
                        <CardDescription className="text-gray-300 text-sm sm:text-base">
                          Progress: {applicationProgress}%
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {/* Progress Bar */}
                    <div className="mb-4 sm:mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Completion</span>
                        <span className="text-sm font-medium text-gray-700">{applicationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div 
                          className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${applicationProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button
                        onClick={handleContinueApplication}
                        className="bg-blue-600 hover:bg-blue-700 flex-1 text-sm sm:text-base"
                      >
                        Continue Application
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 text-sm sm:text-base">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 sm:mx-0">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                              Reset Application
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm sm:text-base">
                              Are you sure you want to reset your application? This will permanently delete all your progress and answers. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleRestartApplication}
                              className="bg-gray-600 hover:bg-gray-700 w-full sm:w-auto"
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

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Deadline Tile */}
              <DeadlineTile />
              
              {/* Student Profile */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-t-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                      <CardTitle className="text-base sm:text-lg">Student Profile</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProfileDialog(true)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm"
                    >
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Full Name</div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                        {userProfile?.fullName || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Student Number</div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900">
                        {userProfile?.studentNumber || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Grade</div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900">
                        {userProfile?.grade || 'Not provided'}
                      </div>
                    </div>
                    {userProfile?.studentType && userProfile.studentType !== 'none' && (
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Program</div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs sm:text-sm">
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
