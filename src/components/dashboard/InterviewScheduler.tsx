
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

interface ScheduledInterview {
  candidateId: string;
  date: Date;
  timeSlot: string;
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({ 
  position, 
  applications, 
  onBack 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const timeSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'];
  const { toast } = useToast();

  const isTimeSlotTaken = (timeSlot: string, date: Date) => {
    return scheduledInterviews.some(interview => 
      interview.timeSlot === timeSlot && 
      interview.date.toDateString() === date.toDateString()
    );
  };

  const getCandidateScheduledInfo = (candidateId: string) => {
    return scheduledInterviews.find(interview => interview.candidateId === candidateId);
  };

  const handleScheduleInterview = async (candidate: ApplicationData) => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time slot",
        variant: "destructive",
      });
      return;
    }

    if (isTimeSlotTaken(selectedTimeSlot, selectedDate)) {
      toast({
        title: "Time Slot Unavailable",
        description: "This time slot is already booked. Please select another time.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateInterviewStatus(candidate.id, true);
      
      const newInterview: ScheduledInterview = {
        candidateId: candidate.id,
        date: selectedDate,
        timeSlot: selectedTimeSlot
      };
      
      setScheduledInterviews(prev => [...prev, newInterview]);
      setSelectedTimeSlot('');
      setSelectedCandidate('');
      
      toast({
        title: "Interview Scheduled",
        description: `Interview scheduled for ${candidate.userProfile?.fullName} on ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot}`,
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

  const handleRemoveInterview = async (candidate: ApplicationData) => {
    try {
      await updateInterviewStatus(candidate.id, false);
      setScheduledInterviews(prev => prev.filter(interview => interview.candidateId !== candidate.id));
      
      toast({
        title: "Interview Removed",
        description: `Interview removed for ${candidate.userProfile?.fullName}`,
      });
    } catch (error) {
      console.error('Error removing interview:', error);
      toast({
        title: "Error",
        description: "Failed to remove interview",
        variant: "destructive",
      });
    }
  };

  const handleRejectCandidate = async (candidate: ApplicationData) => {
    try {
      // Remove any scheduled interview first
      if (getCandidateScheduledInfo(candidate.id)) {
        setScheduledInterviews(prev => prev.filter(interview => interview.candidateId !== candidate.id));
      }
      
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
          {/* Calendar and Time Selection */}
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Select Interview Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border mb-4"
                disabled={(date) => date < new Date()}
              />
              
              {selectedDate && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900">
                      Available Times - {selectedDate.toLocaleDateString()}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((time) => {
                        const isTaken = isTimeSlotTaken(time, selectedDate);
                        const isSelected = selectedTimeSlot === time;
                        
                        return (
                          <Button
                            key={time}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            disabled={isTaken}
                            onClick={() => setSelectedTimeSlot(isSelected ? '' : time)}
                            className={`
                              ${isTaken ? 'opacity-50 cursor-not-allowed' : ''}
                              ${isSelected ? 'bg-blue-600 text-white' : ''}
                            `}
                          >
                            {time}
                            {isTaken && <span className="ml-1 text-xs">(Taken)</span>}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {selectedTimeSlot && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Selected: {selectedDate.toLocaleDateString()} at {selectedTimeSlot}
                      </p>
                    </div>
                  )}
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
                  {applications.map((candidate, index) => {
                    const scheduledInfo = getCandidateScheduledInfo(candidate.id);
                    const isScheduled = !!scheduledInfo || candidate.interviewScheduled;
                    
                    return (
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
                              {candidate.userProfile?.studentType && candidate.userProfile.studentType !== 'none' && (
                                <Badge variant="outline" className="text-xs border-gray-300">
                                  {candidate.userProfile.studentType}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium text-blue-600">
                                Score: {candidate.score || 0}/100
                              </span>
                              {isScheduled && (
                                <div className="text-xs text-gray-600">
                                  {scheduledInfo ? (
                                    <span className="bg-gray-200 px-2 py-1 rounded">
                                      {scheduledInfo.date.toLocaleDateString()} at {scheduledInfo.timeSlot}
                                    </span>
                                  ) : (
                                    <Badge className="bg-gray-200 text-gray-800 text-xs">
                                      Interview Scheduled
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!isScheduled ? (
                            <>
                              <Button
                                onClick={() => handleScheduleInterview(candidate)}
                                size="sm"
                                className="bg-gray-800 hover:bg-gray-900 text-white"
                                disabled={!selectedDate || !selectedTimeSlot}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Schedule Interview
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
                            </>
                          ) : (
                            <Button
                              onClick={() => handleRemoveInterview(candidate)}
                              size="sm"
                              variant="destructive"
                            >
                              Remove Interview
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
