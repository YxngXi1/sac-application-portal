
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Clock, User, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { ApplicationData, updateInterviewStatus } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';

interface InterviewSchedulerProps {
  position: string;
  applications: ApplicationData[];
  onBack: () => void;
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({ 
  position, 
  applications, 
  onBack 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots] = useState(['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM']);
  const { toast } = useToast();

  const handleScheduleInterview = async (candidate: ApplicationData) => {
    try {
      await updateInterviewStatus(candidate.id, true);
      toast({
        title: "Interview Scheduled",
        description: `Interview scheduled for ${candidate.userProfile?.fullName}`,
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive",
      });
    }
  };

  const handleRejectCandidate = async (candidate: ApplicationData) => {
    try {
      // In a real app, you'd update the application status to 'rejected'
      toast({
        title: "Candidate Rejected",
        description: `${candidate.userProfile?.fullName} has been rejected`,
      });
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to reject candidate",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview View
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schedule Interviews: {position}
          </h1>
          <p className="text-gray-600">
            Candidates ordered by application grade (highest first)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Select Interview Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
              
              {selectedDate && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-gray-900">Available Time Slots</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <Badge key={time} variant="outline" className="justify-center py-2 border-gray-300">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Candidates List */}
          <div className="lg:col-span-2">
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Candidates for {position}</CardTitle>
                <CardDescription>
                  {applications.length} qualified candidates (sorted by grade)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((candidate, index) => (
                    <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          #{index + 1}
                        </Badge>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {candidate.userProfile?.fullName || 'N/A'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Grade {candidate.userProfile?.grade}</span>
                            <span>Student #{candidate.userProfile?.studentNumber}</span>
                            {candidate.userProfile?.studentType && candidate.userProfile.studentType !== 'None' && (
                              <Badge variant="outline" className="text-xs border-gray-300">
                                {candidate.userProfile.studentType}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-blue-600">
                              Score: {candidate.score || 0}/100
                            </span>
                            {candidate.interviewScheduled && (
                              <Badge className="bg-gray-200 text-gray-800 text-xs">
                                Interview Scheduled
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!candidate.interviewScheduled && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleScheduleInterview(candidate)}
                            size="sm"
                            className="bg-gray-800 hover:bg-gray-900 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Give Interview
                          </Button>
                          <Button
                            onClick={() => handleRejectCandidate(candidate)}
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;
