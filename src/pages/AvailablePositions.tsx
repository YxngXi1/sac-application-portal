import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AvailablePositions = () => {
  const navigate = useNavigate();

  const positions = [
    {
      title: 'Secretary',
      description: 'Maintains meeting minutes and handles administrative tasks'
    },
    {
      title: 'Treasurer',
      description: 'Manages SAC finances and budget planning'
    },
    {
      title: 'Community Outreach',
      description: 'Connects SAC with the broader school community'
    },
    {
      title: 'Athletics Liaison',
      description: 'Coordinates between SAC and athletic programs'
    },
    {
      title: 'Promotions Officer',
      description: 'Creates promotional content and manages SAC visibility'
    },
    {
      title: 'Photography Exec',
      description: 'Documents SAC events and activities through photography'
    },
    {
      title: 'Technology Executive',
      description: 'Runs all technology used by SAC'
    },
    {
      title: 'Arts Liaison',
      description: 'Coordinates between SAC and arts programs'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">Available Positions</CardTitle>
          <p className="text-gray-600 text-sm sm:text-base">Explore the different roles within the Student Activity Council.</p>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {positions.map((position, index) => (
            <div key={index} className="border rounded-md p-4">
              <h3 className="font-semibold text-lg">{position.title}</h3>
              <p className="text-sm text-gray-500">{position.description}</p>
            </div>
          ))}
          <Button onClick={() => navigate('/apply')} className="w-full">
            Apply Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailablePositions;
