
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { submitApplication } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';

interface ConfirmationPageProps {
  position: string;
  answers: Record<string, string>;
  onBack?: () => void;
  onSubmissionComplete: () => void;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  position,
  answers,
  onBack,
  onSubmissionComplete
}) => {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set the deadline to June 3rd, 2025 at 11:59 PM EST
  const deadline = new Date(2025, 5, 3, 23, 59, 59); // Month is 0-indexed, so 5 = June
  const isDeadlinePassed = new Date() > deadline;

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit an application.",
        variant: "destructive",
      });
      return;
    }

    if (isDeadlinePassed) {
      toast({
        title: "Deadline Passed",
        description: "The application deadline has passed. No new applications can be submitted.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit the application using the service
      await submitApplication(user.uid);
      
      // Clear saved progress
      localStorage.removeItem('applicationProgress');
      
      // Mark submission as complete
      onSubmissionComplete();
      
      // Show success message and redirect
      toast({
        title: "Success",
        description: "Application submitted successfully!",
      });
      
      // Redirect to thank you page
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Review Your Application</CardTitle>
            <p className="text-gray-600">Please confirm your details before submitting</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isDeadlinePassed && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-800">Deadline Passed</span>
                </div>
                <p className="text-sm text-red-700">
                  The application deadline was June 3rd, 2025 at 11:59 PM EST. 
                  This application cannot be submitted at this time.
                </p>
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Personal Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <span className="font-medium">Full Name: </span>
                  <span>{userProfile?.fullName || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium">Student Number: </span>
                  <span>{userProfile?.studentNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium">Student Type: </span>
                  <Badge className="ml-2">
                    {userProfile?.studentType === 'none' ? 'Regular' : userProfile?.studentType || 'Not provided'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Position Applied For */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Position Applied For</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <Badge className="bg-blue-600 text-white text-base px-3 py-1">
                  {position}
                </Badge>
              </div>
            </div>

            {/* Application Summary */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Application Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  You have completed {Object.keys(answers).length} questions for the {position} position.
                  Your responses have been saved and will be reviewed by the SAC selection committee.
                </p>
              </div>
            </div>

            {/* Deadline Warning */}
            {!isDeadlinePassed && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-semibold text-yellow-800">Deadline Reminder</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Applications must be submitted by June 3rd, 2025 at 11:59 PM EST.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              {onBack && (
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Edit
                </Button>
              )}
              
              <Button 
                onClick={handleSubmit}
                className={`${onBack ? 'flex-1' : 'w-full'} bg-green-600 hover:bg-green-700`}
                disabled={isSubmitting || isDeadlinePassed}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>

            {/* Thank You Message */}
            <div className="text-center pt-6 border-t">
              <h4 className="font-semibold text-lg mb-2">Thank You for Applying!</h4>
              <p className="text-gray-600">
                We appreciate your interest in joining the Student Activity Council. 
                You will be notified about the status of your application soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmationPage;
