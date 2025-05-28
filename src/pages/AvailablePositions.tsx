
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, FileText, ArrowRight } from 'lucide-react';

const AvailablePositions = () => {
  const positions = [
    {
      id: 1,
      title: 'Promotions Officer',
      description: 'Lead marketing campaigns and promotional activities for school events',
      applicants: 12,
      deadline: '2024-02-15',
      status: 'open'
    },
    {
      id: 2,
      title: 'Photography Exec',
      description: 'Capture and document school events, create visual content for social media',
      applicants: 8,
      deadline: '2024-02-15',
      status: 'open'
    },
    {
      id: 3,
      title: 'Secretary',
      description: 'Manage meeting minutes, correspondence, and administrative tasks',
      applicants: 15,
      deadline: '2024-02-15',
      status: 'open'
    },
    {
      id: 4,
      title: 'Treasurer',
      description: 'Oversee budget management and financial planning for student activities',
      applicants: 6,
      deadline: '2024-02-15',
      status: 'open'
    },
    {
      id: 5,
      title: 'Community Outreach',
      description: 'Build partnerships with local organizations and coordinate volunteer activities',
      applicants: 10,
      deadline: '2024-02-15',
      status: 'open'
    },
    {
      id: 6,
      title: 'Athletics Liaison',
      description: 'Coordinate with sports teams and organize athletic events and competitions',
      applicants: 9,
      deadline: '2024-02-15',
      status: 'open'
    },
    {
      id: 7,
      title: 'Tech Exec',
      description: 'Manage digital platforms, website maintenance, and tech support for events',
      applicants: 7,
      deadline: '2024-02-15',
      status: 'open'
    },
    {
      id: 8,
      title: 'Arts Liaison',
      description: 'Coordinate with arts departments and organize creative events and showcases',
      applicants: 11,
      deadline: '2024-02-15',
      status: 'open'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closing_soon': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Available Positions</h1>
        <p className="text-gray-600">Choose a position to start your application for Student Council</p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">Application Deadline: February 15, 2024</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {positions.map((position) => (
          <Card key={position.id} className="hover:shadow-lg transition-shadow border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg text-black">{position.title}</CardTitle>
                <Badge className={getStatusColor(position.status)}>
                  {position.status.charAt(0).toUpperCase() + position.status.slice(1).replace('_', ' ')}
                </Badge>
              </div>
              <CardDescription className="text-gray-600">
                {position.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {position.applicants} applicants
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due: {new Date(position.deadline).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-black text-black hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Apply Now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Need Help?</CardTitle>
            <CardDescription className="text-gray-600">
              Contact our Student Council advisors if you have questions about any position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="border-black text-black hover:bg-gray-100">
              Contact Advisors
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvailablePositions;
