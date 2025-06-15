import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Target, TrendingUp, Clock, ArrowLeft, Calendar, BarChart3, Settings } from 'lucide-react';
import { getAllApplications } from '@/services/applicationService';
import { ApplicationData } from '@/services/applicationService';
import PositionApplications from './PositionApplications';
import InterviewView from './InterviewView';
import SummaryView from './SummaryView';

interface ExecDashboardProps {
  onBack: () => void;
}

const ExecDashboard: React.FC<ExecDashboardProps> = ({ onBack }) => {
  const { userProfile } = useAuth();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showInterviewView, setShowInterviewView] = useState(false);
  const [showSummaryView, setShowSummaryView] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  const positions = [
    { id: 'Secretary', name: 'Secretary' },
    { id: 'Treasurer', name: 'Treasurer' },
    { id: 'Community Outreach', name: 'Community Outreach' },
    { id: 'Athletics Liaison', name: 'Athletics Liaison' },
    { id: 'Promotions Officer', name: 'Promotions Officer' },
    { id: 'Photography Exec', name: 'Photography Exec' },
    { id: 'Technology Executive', name: 'Technology Executive' },
    { id: 'Arts Liaison', name: 'Arts Liaison' }
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

  const handlePrintApplications = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SAC Applications Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .status-submitted { color: #059669; font-weight: bold; }
            .status-draft { color: #6b7280; }
            .status-under-review { color: #3b82f6; font-weight: bold; }
            .grade { font-weight: bold; color: #7c3aed; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>SAC Applications Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><strong>Total Applications:</strong> ${applications.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Position</th>
                <th>Grade</th>
                <th>Student Number</th>
                <th>Status</th>
                <th>Application Score</th>
                <th>Interview Scheduled</th>
                <th>Submitted Date</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(app => `
                <tr>
                  <td>${app.userProfile?.fullName || 'N/A'}</td>
                  <td>${app.position || 'N/A'}</td>
                  <td>${app.userProfile?.grade || 'N/A'}</td>
                  <td>${app.userProfile?.studentNumber || 'N/A'}</td>
                  <td class="status-${app.status}">${app.status.replace('_', ' ').toUpperCase()}</td>
                  <td class="grade">${app.score !== undefined ? app.score.toFixed(1) + '/100' : 'Not graded'}</td>
                  <td>${app.interviewScheduled ? 'Yes' : 'No'}</td>
                  <td>${app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

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

  const isAdmin = (userProfile && (userProfile.role === "teacher" || userProfile.role === "pres" || userProfile.role === "vp"));

  if (selectedPosition) {
    return (
      <PositionApplications 
        positionId={selectedPosition}
        positionName={positions.find(p => p.id === selectedPosition)?.name || ''}
        onBack={() => setSelectedPosition(null)}
      />
    );
  }

  if (showInterviewView) {
    return <InterviewView onBack={() => setShowInterviewView(false)} />;
  }

  if (showSummaryView) {
    return <SummaryView onBack={() => setShowSummaryView(false)} />;
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
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex space-x-3">
              {isAdmin && (
                <Button
                  asChild
                  variant="outline"
                  className="border-blue-600 text-blue-700 hover:bg-blue-50"
                >
                  <a href="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Settings
                  </a>
                </Button>
              )}
              
              <Button
                onClick={() => setShowSummaryView(true)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Summary View
              </Button>
              
              <Button
                onClick={() => setShowInterviewView(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Interview View
              </Button>
            </div>
          </div>
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
          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{totalApplications}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-3xl font-bold text-blue-600">{totalSubmitted}</p>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-gray-600">{totalInProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interviewed</p>
                  <p className="text-3xl font-bold text-gray-800">{totalInterviewed}</p>
                </div>
                <Users className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Positions Grid */}
        <Card className="border shadow-sm bg-white">
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
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border shadow-sm hover:scale-105"
                    onClick={() => setSelectedPosition(position.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg text-gray-900">{position.name}</h3>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          {stats.total} total
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Submitted:</span>
                          <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {stats.submitted}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">In Progress:</span>
                          <span className="font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {stats.inProgress}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Interviewed:</span>
                          <span className="font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                            {stats.interviewed}
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" 
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
