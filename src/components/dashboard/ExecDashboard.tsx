
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Target, TrendingUp, Clock } from 'lucide-react';
import { getAllApplications } from '@/services/applicationService';
import { ApplicationData } from '@/services/applicationService';
import PositionApplications from './PositionApplications';

const ExecDashboard = () => {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  const positions = [
    { id: 'secretary', name: 'Secretary' },
    { id: 'treasurer', name: 'Treasurer' },
    { id: 'community-outreach', name: 'Community Outreach' },
    { id: 'athletics-liaison', name: 'Athletics Liaison' },
    { id: 'promotions-officer', name: 'Promotions Officer' },
    { id: 'photography-exec', name: 'Photography Exec' }
  ];

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const allApplications = await getAllApplications();
        setApplications(allApplications);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const getPositionStats = (positionName: string) => {
    const positionApps = applications.filter(app => 
      app.position === positionName
    );
    
    const total = positionApps.length;
    const submitted = positionApps.filter(app => app.status === 'submitted').length;
    const inProgress = positionApps.filter(app => 
      app.status === 'draft' && app.progress > 0
    ).length;
    const interviewed = positionApps.filter(app => app.interviewScheduled).length;

    return { total, submitted, inProgress, interviewed };
  };

  const totalApplications = applications.length;
  const totalSubmitted = applications.filter(app => app.status === 'submitted').length;
  const totalInProgress = applications.filter(app => 
    app.status === 'draft' && app.progress > 0
  ).length;
  const totalInterviewed = applications.filter(app => app.interviewScheduled).length;

  if (selectedPosition) {
    return (
      <PositionApplications 
        positionId={selectedPosition}
        positionName={positions.find(p => p.id === selectedPosition)?.name || ''}
        onBack={() => setSelectedPosition(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
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
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-3xl font-bold">{totalSubmitted}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold">{totalInProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
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
        </div>

        {/* Positions Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Applications by Position</CardTitle>
            <CardDescription>
              Click on a position to view and manage applications. Includes incomplete applications in progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => {
                const stats = getPositionStats(position.name);
                return (
                  <Card 
                    key={position.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPosition(position.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg">{position.name}</h3>
                        <Badge variant="secondary">
                          {stats.total} total
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Submitted:</span>
                          <span className="font-medium text-green-600">{stats.submitted}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">In Progress:</span>
                          <span className="font-medium text-orange-600">{stats.inProgress}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Interviewed:</span>
                          <span className="font-medium text-purple-600">{stats.interviewed}</span>
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
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecDashboard;
