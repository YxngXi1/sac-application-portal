
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

const DeadlineTile = () => {
  const [timeLeft, setTimeLeft] = useState('');
  
  // Set the deadline to June 3rd, 2025 at 11:59 PM
  const deadline = new Date(2025, 5, 3, 23, 59, 59); // Month is 0-indexed, so 5 = June

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`);
        } else if (hours > 0) {
          setTimeLeft(`${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`);
        } else {
          setTimeLeft(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }
      } else {
        setTimeLeft('Deadline passed');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [deadline]);

  const isDeadlinePassed = new Date() > deadline;

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className={`${isDeadlinePassed ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-blue-600 to-blue-800'} text-white rounded-t-lg`}>
        <CardTitle className="flex items-center gap-3 text-lg">
          <Calendar className="h-5 w-5" />
          Application Deadline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">Due on June 3rd</p>
            <p className="text-sm text-gray-600">11:59 PM</p>
          </div>
          
          <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${isDeadlinePassed ? 'bg-red-50' : 'bg-blue-50'}`}>
            <Clock className={`h-5 w-5 ${isDeadlinePassed ? 'text-red-600' : 'text-blue-600'}`} />
            <span className={`font-semibold ${isDeadlinePassed ? 'text-red-800' : 'text-blue-800'}`}>
              {isDeadlinePassed ? 'Deadline Passed' : `${timeLeft} remaining`}
            </span>
          </div>
          
          {!isDeadlinePassed && (
            <p className="text-xs text-gray-500">
              Make sure to submit your application before the deadline!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeadlineTile;
