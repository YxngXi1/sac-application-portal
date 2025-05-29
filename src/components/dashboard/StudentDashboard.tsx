
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadApplicationProgress } from '@/services/applicationService';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Executive {
  id: string;
  name: string;
  email: string;
}

const StudentDashboard = () => {
  const { userProfile } = useAuth();
  const [applicationData, setApplicationData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [executives, setExecutives] = React.useState<Executive[]>([]);
  const [userInterviewData, setUserInterviewData] = React.useState<any>(null);

  // Fetch superadmin users for panel member names
  React.useEffect(() => {
    const fetchSuperAdminUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'superadmin'));
        const querySnapshot = await getDocs(q);
        
        const superAdminUsers: Executive[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          superAdminUsers.push({
            id: doc.id,
            name: userData.name || userData.fullName || 'Unnamed User',
            email: userData.email || ''
          });
        });
        
        setExecutives(superAdminUsers);
      } catch (error) {
        console.error('Error fetching superadmin users:', error);
      }
    };

    fetchSuperAdminUsers();
  }, []);

  // Load user's interview data
  React.useEffect(() => {
    const loadUserInterviewData = async () => {
      if (!userProfile?.uid) return;
      
      try {
        const interviewDoc = await getDoc(doc(db, 'interviews', userProfile.uid));
        if (interviewDoc.exists()) {
          const data = interviewDoc.data();
          console.log('Interview data loaded:', data);
          
          // Check if interview exists and is not removed
          if (!data.removed && data.date && data.timeSlot) {
            setUserInterviewData({
              date: data.date.toDate(),
              timeSlot: data.timeSlot,
              panelMembers: data.panelMembers || []
            });
          } else {
            console.log('Interview data exists but is removed or incomplete');
            setUserInterviewData(null);
          }
        } else {
          console.log('No interview document found');
          setUserInterviewData(null);
        }
      } catch (error) {
        console.error('Error loading user interview data:', error);
        setUserInterviewData(null);
      }
    };

    loadUserInterviewData();
  }, [userProfile]);

  React.useEffect(() => {
    const loadStudentApplication = async () => {
      if (!userProfile?.uid) return;
      
      try {
        const savedApplication = await loadApplicationProgress(userProfile.uid);
        console.log('Application data loaded:', savedApplication);
        setApplicationData(savedApplication);
      } catch (error) {
        console.error('Error loading application:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentApplication();
  }, [userProfile]);

  const getPanelMemberNames = (panelMemberIds: string[]) => {
    if (!panelMemberIds || panelMemberIds.length === 0) return 'Panel members TBD';
    
    return panelMemberIds
      .map(id => executives.find(exec => exec.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Panel members TBD';
  };

  const getStatusDisplay = (app: any) => {
    console.log('Getting status display for app:', app);
    console.log('User interview data:', userInterviewData);
    
    // Check if interview is scheduled
    if (userInterviewData && userInterviewData.date && userInterviewData.timeSlot) {
      const panelNames = getPanelMemberNames(userInterviewData.panelMembers);
      return {
        text: 'Interview Scheduled!',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        details: `${userInterviewData.date.toLocaleDateString()} at ${userInterviewData.timeSlot}`,
        panelMembers: panelNames
      };
    }
    
    // Handle other statuses based on application status
    switch (app?.status) {
      case 'submitted': 
        return {
          text: 'Application Pending',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          details: 'Awaiting review'
        };
      case 'draft': 
        return {
          text: 'Draft',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          details: 'Application not submitted'
        };
      case 'under_review': 
        return {
          text: 'Under Review',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
          details: 'Being reviewed by executives'
        };
      case 'accepted': 
        return {
          text: 'Accepted',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          details: 'Congratulations!'
        };
      case 'rejected': 
        return {
          text: 'Not Selected',
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          details: 'Better luck next time'
        };
      default: 
        return {
          text: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          details: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  // Create application object with real data
  const applications = applicationData ? [{
    id: userProfile?.uid || '1',
    position: applicationData.position || 'Unknown Position',
    status: applicationData.status || 'draft',
    submittedAt: applicationData.submittedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    interviewScheduled: !!userInterviewData,
  }] : [];

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Applications</h1>
            <p className="text-gray-600 mt-2">Track your SAC position applications and interviews</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Applications Found</CardTitle>
            <CardDescription>You haven't submitted any applications yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Start Your First Application
            </Button>
          </CardContent>
        </Card>

        {/* Available Positions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Available Positions
            </CardTitle>
            <CardDescription>
              Click on a position to start your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {['President', 'Vice President', 'Secretary', 'Treasurer', 'Social Coordinator', 'Spirit Coordinator', 'Grade 9 Rep', 'Grade 10 Rep'].map((position) => (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Applications</h1>
          <p className="text-gray-600 mt-2">Track your SAC position applications and interviews</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => {
          const statusInfo = getStatusDisplay(app);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{app.position}</CardTitle>
                  <Badge className={statusInfo.color}>
                    {statusInfo.text}
                  </Badge>
                </div>
                <CardDescription>
                  Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <StatusIcon className={`h-4 w-4 mr-2 ${
                    statusInfo.text === 'Interview Scheduled!' ? 'text-green-600' : 
                    statusInfo.text === 'Application Pending' ? 'text-yellow-600' : 'text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{statusInfo.details}</div>
                    {statusInfo.panelMembers && (
                      <div className="text-xs text-gray-600 mt-1">
                        Panel: {statusInfo.panelMembers}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {app.status === 'draft' && (
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Continue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Available Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
            Available Positions
          </CardTitle>
          <CardDescription>
            Click on a position to start your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {['President', 'Vice President', 'Secretary', 'Treasurer', 'Social Coordinator', 'Spirit Coordinator', 'Grade 9 Rep', 'Grade 10 Rep'].map((position) => (
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
  );
};

export default StudentDashboard;
