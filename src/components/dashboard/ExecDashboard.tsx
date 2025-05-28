
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Target, TrendingUp } from 'lucide-react';
import PositionApplications from './PositionApplications';

const ExecDashboard = () => {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Mock data for positions and applications
  const positions = [
    { id: 'president', name: 'President', applications: 8, interviewed: 3 },
    { id: 'vp-academics', name: 'VP Academics', applications: 12, interviewed: 5 },
    { id: 'vp-spirit', name: 'VP Spirit', applications: 15, interviewed: 7 },
    { id: 'treasurer', name: 'Treasurer', applications: 6, interviewed: 2 },
    { id: 'secretary', name: 'Secretary', applications: 9, interviewed: 4 },
    { id: 'grade-rep', name: 'Grade Representative', applications: 20, interviewed: 8 }
  ];

  const totalApplications = positions.reduce((sum, pos) => sum + pos.applications, 0);
  const totalInterviewed = positions.reduce((sum, pos) => sum + pos.interviewed, 0);

  if (selectedPosition) {
    return (
      <PositionApplications 
        positionId={selectedPosition}
        positionName={positions.find(p => p.id === selectedPosition)?.name || ''}
        onBack={() => setSelectedPosition(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Executive Dashboard
          </h1>
          <p className="text-gray-600">
            Manage SAC applications and review candidates
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold">{totalApplications}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Positions</p>
                  <p className="text-3xl font-bold">{positions.length}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interviewed</p>
                  <p className="text-3xl font-bold">{totalInterviewed}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold">{Math.round((totalInterviewed / totalApplications) * 100)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Positions Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Applications by Position</CardTitle>
            <CardDescription>
              Click on a position to view and manage applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => (
                <Card 
                  key={position.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPosition(position.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-lg">{position.name}</h3>
                      <Badge variant="secondary">
                        {position.applications} apps
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Applications:</span>
                        <span className="font-medium">{position.applications}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Interviewed:</span>
                        <span className="font-medium text-green-600">{position.interviewed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pending Review:</span>
                        <span className="font-medium text-orange-600">
                          {position.applications - position.interviewed}
                        </span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPosition(position.id);
                      }}
                    >
                      View Applications
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecDashboard;
