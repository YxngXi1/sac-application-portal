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

  const availablePositions = [
    { name: 'Vice President', applicants: 12, color: 'bg-gray-900', image: '/lovable-uploads/3b08217b-eba6-48bb-af4f-dec9a264ad9b.png' },
    { name: 'Secretary', applicants: 8, color: 'bg-purple-200', image: '/lovable-uploads/de8d1298-b594-4344-ac1c-fa79f04361a1.png' },
    { name: 'Treasurer', applicants: 6, color: 'bg-cyan-200', image: '/lovable-uploads/2ce0abb2-e135-4f67-b392-badd375b0733.png' }
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart Area */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Application Progress</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                        <span className="text-sm text-gray-600">Pending</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900 mb-2">{currentApplication.progress}%</div>
                      <div className="text-sm text-gray-600">Overall completion</div>
                    </div>
                    
                    {/* Progress Chart Visualization */}
                    <div className="h-48 flex items-end justify-center space-x-2 mb-6">
                      {Object.entries(currentApplication.sections).map(([key, section], index) => (
                        <div key={key} className="flex flex-col items-center">
                          <div 
                            className={`w-8 rounded-t-lg ${section.completed ? 'bg-cyan-400' : 'bg-gray-200'}`}
                            style={{ height: `${section.completed ? 120 : 60}px` }}
                          ></div>
                          <div className="text-xs text-gray-600 mt-2 text-center w-16">
                            {section.title.split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {Object.entries(currentApplication.sections).map(([key, section]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              section.completed ? 'bg-cyan-400' : 'bg-gray-300'
                            }`} />
                            <span className="text-sm font-medium">{section.title}</span>
                          </div>
                          {section.completed ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
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

                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      Continue Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Available Positions */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Positions</CardTitle>
                    <Button variant="ghost" size="sm">⋯</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availablePositions.map((position, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg text-white">
                      <div 
                        className={`w-10 h-10 ${position.color} rounded-lg bg-cover bg-center`}
                        style={{ backgroundImage: `url(${position.image})` }}
                      ></div>
                      <div className="flex-1">
                        <div className="font-medium">{position.name}</div>
                        <div className="text-sm text-gray-300">↗ {position.applicants} applicants</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center space-x-3 p-3 bg-purple-100 rounded-lg">
                      <div className="w-10 h-10 bg-purple-200 rounded-lg bg-cover bg-center" 
                           style={{ backgroundImage: 'url(/lovable-uploads/3b8b1927-b0d2-4865-b79d-8bc77a49c10d.png)' }}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Social Coordinator</div>
                        <div className="text-sm text-gray-600">↗ 15%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-cyan-100 rounded-lg">
                      <div className="w-10 h-10 bg-cyan-200 rounded-lg bg-cover bg-center"
                           style={{ backgroundImage: 'url(/lovable-uploads/e24ebc93-2ba8-4bff-9c7e-bd77971d1c8a.png)' }}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Spirit Coordinator</div>
                        <div className="text-sm text-gray-600">↗ 8%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Info */}
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
    </div>
  );
};

export default ApplicationDashboard;
