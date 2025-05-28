
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ThankYouPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Thank You!</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Application Submitted Successfully</h3>
              <p className="text-gray-600">
                Your SAC application has been submitted and is now under review. 
                We appreciate your interest in joining the Student Activity Council.
              </p>
              <p className="text-sm text-gray-500">
                You will be notified about the status of your application and any 
                next steps via email. Please check your inbox regularly.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleGoHome}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThankYouPage;
