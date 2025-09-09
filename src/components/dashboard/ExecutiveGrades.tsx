import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Star, User, Users } from 'lucide-react';
import { ApplicationGrades, ExecutiveGrade } from '@/services/applicationService';

interface ExecutiveGradesProps {
  applicationGrades: ApplicationGrades | null;
  currentExecutiveId: string;
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  onSaveFeedback: () => void;
}

const ExecutiveGrades: React.FC<ExecutiveGradesProps> = ({
  applicationGrades,
  currentExecutiveId,
  feedback,
  onFeedbackChange,
  onSaveFeedback
}) => {
  if (!applicationGrades || !applicationGrades.executiveGrades.length) {
    return (
      <Card className="border shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Executive Grades</CardTitle>
          <CardDescription>No grades from other executives yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const otherExecutives = applicationGrades.executiveGrades.filter(
    eg => eg.executiveId !== currentExecutiveId
  );
  const myGrades = applicationGrades.executiveGrades.find(
    eg => eg.executiveId === currentExecutiveId
  );

  return (
    <Card className="border shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Executive Grades & Feedback
        </CardTitle>
        <CardDescription>
          Grades and feedback from all executives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Other Executives' Grades */}
        {applicationGrades?.executiveGrades?.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Other Executive Grades</h4>
            {otherExecutives.map((executive) => (
              <div key={executive.executiveId} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm">{executive.executiveName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{executive.totalScore.toFixed(1)}/10</span>
                  </div>
                </div>
                {executive.feedback && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Feedback:</p>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                      {executive.feedback}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Graded on {new Date(executive.gradedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* My Feedback Section - Always show this */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Your Feedback</h4>
          <div className="space-y-3">
            <Textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="Add your feedback about this application..."
              className="w-full"
              rows={3}
            />
            <Button
              onClick={onSaveFeedback}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Feedback
            </Button>
          </div>
          
          {applicationGrades?.executiveGrades?.find(eg => eg.executiveId === currentExecutiveId)?.feedback && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Your saved feedback:</p>
              <p className="text-sm text-blue-800">
                {applicationGrades.executiveGrades.find(eg => eg.executiveId === currentExecutiveId)?.feedback}
              </p>
            </div>
          )}
        </div>

        {/* Average Score */}
        {applicationGrades?.executiveGrades?.length > 1 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
              <span className="font-medium text-gray-900">Team Average</span>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold text-blue-600">
                  {applicationGrades.averageScore.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExecutiveGrades;
