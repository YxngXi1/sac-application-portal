
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Users, Plus, CheckCircle, XCircle } from 'lucide-react';
import { getAllApplications, ApplicationData } from '@/services/applicationService';
import InterviewScheduler from './InterviewScheduler';
import InterviewGrader from './InterviewGrader';
import InterviewResults from './InterviewResults';
import InterviewCalendarView from './InterviewCalendarView';

interface InterviewViewProps {
  onBack: () => void;
}

const InterviewView: React.FC<InterviewViewProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showGrader, setShowGrader] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);

  const positions = [
    'Secretary', 'Treasurer', 'Community Outreach', 
    'Athletics Liaison', 'Promotions Officer', 'Photography Exec'
  ];

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const allApplications = await getAllApplications();
        // Only show submitted applications with scores
        const submittedWithScores = allApplications.filter(app => 
          app.status === 'submitted' && app.score !== undefined
        );
        setApplications(submittedWithScores);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const getPositionApplications = (position: string) => {
    return applications
      .filter(app => app.position === position)
      .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by score descending
  };

  const getUpcomingInterviews = () => {
    // Mock data for upcoming interviews
    return applications.filter(app => app.interviewScheduled);
  };

  if (showScheduler && selectedPosition) {
    return (
      <InterviewScheduler
        position={selectedPosition}
        applications={getPositionApplications(selectedPosition)}
        onBack={() => {
          setShowScheduler(false);
          setSelectedPosition(null);
        }}
      />
    );
  }

  if (showGrader && selectedCandidate) {
    return (
      <InterviewGrader
        candidate={selectedCandidate}
        onBack={() => {
          setShowGrader(false);
          setSelectedCandidate(null);
        }}
      />
    );
  }

  if (showResults) {
    return (
      <InterviewResults
        onBack={() => setShowResults(false)}
      />
    );
  }

  if (showCalendar) {
    return (
      <InterviewCalendarView
        onBack={() => setShowCalendar(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview data...</p>
        </div>
      </div>
    );
  }

  const upcomingInterviews = getUpcomingInterviews();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Executive Dashboard
            </Button>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowCalendar(true)}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
              
              <Button
                onClick={() => setShowResults(true)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                View Interview Results
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Management
          </h1>
          <p className="text-gray-600">
            Schedule and manage candidate interviews
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Upcoming Interviews */}
        <Card className="mb-8 border shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Upcoming Interviews
            </CardTitle>
            <CardDescription>
              Scheduled interviews for today and upcoming dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No upcoming interviews scheduled
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {candidate.userProfile?.fullName || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {candidate.position} • Grade {candidate.userProfile?.grade}
                      </p>
                      <p className="text-sm text-blue-600">
                        Today 2:00 PM - 2:30 PM
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setShowGrader(true);
                      }}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Start Interview
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Positions Grid */}
        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Interview Scheduling by Position</CardTitle>
            <CardDescription>
              Schedule interviews for candidates by position (ordered by application grade)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {positions.map((position) => {
                const positionApps = getPositionApplications(position);
                const scheduled = positionApps.filter(app => app.interviewScheduled).length;
                
                return (
                  <Card 
                    key={position}
                    className="border shadow-sm bg-gray-50 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg text-gray-900">{position}</h3>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-800">
                          {positionApps.length} qualified
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Scheduled:</span>
                          <span className="font-medium text-blue-600">{scheduled}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-medium text-gray-600">{positionApps.length - scheduled}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setSelectedPosition(position);
                          setShowScheduler(true);
                        }}
                        disabled={positionApps.length === 0}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Interviews
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

export default InterviewView;
