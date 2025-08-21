import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AvailablePositions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">SAC Honourary Member Application</CardTitle>
          <p className="text-gray-600 text-sm sm:text-base">Join the Student Activity Council as an honourary member and contribute to our school community.</p>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="border rounded-md p-4 bg-blue-50">
            <h3 className="font-semibold text-lg text-blue-900">Honourary Member</h3>
            <p className="text-sm text-blue-700 mt-2">
              As an honourary member of SAC, you'll have the opportunity to contribute to school events, 
              participate in council meetings, and help make John Fraser a better place for all students. 
              This role is perfect for students who want to be involved in student government without 
              the full commitment of an executive position.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-800">What You'll Do:</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Assist with SAC events and initiatives</li>
              <li>• Attend monthly council meetings</li>
              <li>• Provide input on student concerns and ideas</li>
              <li>• Support executive members with various projects</li>
              <li>• Help bridge communication between SAC and students</li>
            </ul>
          </div>
          <Button onClick={() => navigate('/apply')} className="w-full">
            Apply for Honourary Member
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailablePositions;