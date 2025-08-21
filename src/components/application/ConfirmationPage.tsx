
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { submitApplication, saveApplicationProgress } from '@/services/applicationService';

interface ConfirmationPageProps {
  position: string;
  answers: Record<string, string>;
  uploadedFiles: Record<string, File[]>;
  onBack?: () => void;
  onSubmissionComplete: () => void;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  position,
  answers,
  uploadedFiles,
  onBack,
  onSubmissionComplete
}) => {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Application deadline - June 5th, 2025 at 11:59 PM EST
  const deadline = new Date('2025-09-05T23:59:59-04:00'); // EDT time in September
  const now = new Date();
  const isDeadlinePassed = now > deadline;

  const getQuestionCount = (position: string) => {
    switch (position) {
      case 'Honourary Member': return 5;
      default: return 1;
    }
  };

  const calculateProgress = () => {
    if (!position) return 0;
    // Position selected = 20%
    if (Object.keys(answers).length === 0) return 20;
    const totalQuestions = getQuestionCount(position);
    const answeredQuestions = Object.keys(answers).length;
    return Math.min(20 + (answeredQuestions / totalQuestions) * 70, 90);
  };

  const handleSubmit = async () => {
    if (isDeadlinePassed) {
      toast({
        title: "Deadline Passed",
        description: "The application deadline has passed. You can no longer submit applications.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit an application.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First: save latest progress to the DB (same call used by Save Progress)
      const progress = calculateProgress();

      try {
        await saveApplicationProgress(user.uid, {
          position,
          answers,
          progress,
          userProfile: {
            fullName: userProfile?.fullName || '',
            studentNumber: userProfile?.studentNumber || '',
            grade: userProfile?.grade || '',
          }
        });
        console.log('Progress saved before final submit');
      } catch (saveError) {
        console.error('Error saving progress before submit:', saveError);
        toast({
          title: "Error",
          description: "Failed to save your application before submission. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return; // abort submission if we can't save
      }

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
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isDeadlinePassed ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {isDeadlinePassed ? (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isDeadlinePassed ? 'Application Deadline Passed' : 'Review Your Application'}
            </CardTitle>
            <p className="text-gray-600">
              {isDeadlinePassed 
                ? 'The application deadline was Thursday, September 5th, 2025 at 11:59 PM EDT'
                : 'Please confirm your details before submitting'
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Deadline Warning */}
            {isDeadlinePassed && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">Submission No Longer Available</h4>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Applications are no longer being accepted as the deadline has passed.
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
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">
                  You have completed {Object.keys(answers).length} questions for the {position} position.
                  Your responses have been saved and will be reviewed by the SAC selection committee.
                </p>
                
                {/* File Upload Summary */}
                {Object.keys(uploadedFiles).length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-2">Uploaded Files:</h4>
                    {Object.entries(uploadedFiles).map(([questionId, files]) => (
                      <div key={questionId} className="text-xs text-gray-600">
                        • {files.length} file{files.length > 1 ? 's' : ''} for {questionId}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                className={`${onBack ? 'flex-1' : 'w-full'} ${
                  isDeadlinePassed 
                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={isSubmitting || isDeadlinePassed}
              >
                {isDeadlinePassed 
                  ? 'Deadline Passed' 
                  : isSubmitting 
                    ? 'Submitting...' 
                    : 'Submit Application'
                }
              </Button>
            </div>

            {/* Thank You Message */}
            {!isDeadlinePassed && (
              <div className="text-center pt-6 border-t">
                <h4 className="font-semibold text-lg mb-2">Thank You for Applying!</h4>
                <p className="text-gray-600">
                  We appreciate your interest in joining the Student Activity Council. 
                  You will be notified about the status of your application soon.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmationPage;
