
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
  // Mock data - will be replaced with real Firebase data
  const applications = [
    {
      id: '1',
      position: 'President',
      status: 'submitted',
      submittedAt: '2024-01-15',
      interviewDate: null,
    },
    {
      id: '2',
      position: 'Vice President',
      status: 'interview_scheduled',
      submittedAt: '2024-01-10',
      interviewDate: '2024-01-25',
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

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
        {applications.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{app.position}</CardTitle>
                <Badge className={getStatusColor(app.status)}>
                  {formatStatus(app.status)}
                </Badge>
              </div>
              <CardDescription>
                Submitted: {new Date(app.submittedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {app.interviewDate && (
                <div className="flex items-center text-sm text-green-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Interview: {new Date(app.interviewDate).toLocaleDateString()}
                </div>
              )}
              
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
        ))}
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
