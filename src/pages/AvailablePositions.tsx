import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APPLICATION_POSITIONS } from '@/lib/applicationConfig';

const AvailablePositions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">SAC Applications</CardTitle>
          <p className="text-gray-600 text-sm sm:text-base">Apply for an SAC role and help shape the school year.</p>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-3">
            {APPLICATION_POSITIONS.map((position) => (
              <div key={position.id} className="border rounded-md p-4 bg-blue-50">
                <h3 className="font-semibold text-lg text-blue-900">{position.title}</h3>
                <p className="text-sm text-blue-700 mt-2">{position.fullDescription}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate('/apply')} className="w-full">
            Start Application
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailablePositions;
