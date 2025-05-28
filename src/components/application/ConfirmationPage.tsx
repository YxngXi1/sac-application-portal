
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ConfirmationPageProps {
  position: string;
  answers: Record<string, string>;
  onBack: () => void;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  position,
  answers,
  onBack
}) => {
  const { userProfile } = useAuth();

  const handleSubmit = () => {
    // Here you would submit the application to your backend
    console.log('Submitting application:', {
      position,
      answers,
      userProfile
    });
    
    // Clear saved progress
    localStorage.removeItem('applicationProgress');
    
    // Show success message or redirect
    alert('Application submitted successfully!');
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
              
              <Button 
                onClick={handleSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Submit Application
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
