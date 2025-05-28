
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, FileText, Plus, User, Settings, TrendingUp, Users, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ApplicationDashboard = () => {
  const { userProfile } = useAuth();
  
  // Check if user has started an application
  const [hasStartedApplication, setHasStartedApplication] = React.useState(false);
  
  React.useEffect(() => {
    const saved = localStorage.getItem('applicationProgress');
    setHasStartedApplication(!!saved);
  }, []);
  
  // Mock data - will be replaced with real Firebase data
  const applicationDeadline = new Date('2024-02-15');
  const currentDate = new Date();
  const daysLeft = Math.ceil((applicationDeadline.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));

  const isExecOrSuperAdmin = userProfile?.role === 'exec' || userProfile?.role === 'superadmin';

  const metricCards = [
    {
      title: 'Applications',
      value: '1',
      change: '+1 this week',
      icon: FileText,
      color: 'bg-gradient-to-br from-purple-400 to-purple-600',
      textColor: 'text-white'
    },
    {
      title: 'Progress',
      value: '65%',
      change: '+15% this week',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
      textColor: 'text-white'
    },
    {
      title: 'Days Left',
      value: daysLeft.toString(),
      change: 'Until deadline',
      icon: Clock,
      color: 'bg-gradient-to-br from-orange-400 to-orange-600',
      textColor: 'text-white'
    }
  ];

  const handleStartApplication = () => {
    window.location.href = '/apply';
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

          {/* Show Get Started section if no application started */}
          {!hasStartedApplication && (
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
          )}

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {metricCards.map((metric, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className={`${metric.color} ${metric.textColor} p-6 rounded-lg`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm opacity-90">{metric.title}</span>
                      <metric.icon className="h-5 w-5 opacity-80" />
                    </div>
                    <div className="text-3xl font-bold mb-1">{metric.value}</div>
                    <div className="text-sm opacity-75">{metric.change}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Student Info */}
          <div className="max-w-md">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Student Profile</CardTitle>
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
    </div>
  );
};

export default ApplicationDashboard;
