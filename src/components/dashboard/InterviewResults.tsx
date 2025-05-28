
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Award, TrendingUp } from 'lucide-react';
import { getAllApplications, ApplicationData } from '@/services/applicationService';

interface InterviewResultsProps {
  onBack: () => void;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const allApplications = await getAllApplications();
        // Filter for interviewed candidates
        const interviewed = allApplications.filter(app => app.interviewScheduled);
        setApplications(interviewed);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const groupedByPosition = applications.reduce((acc, app) => {
    if (!acc[app.position]) {
      acc[app.position] = [];
    }
    acc[app.position].push(app);
    return acc;
  }, {} as Record<string, ApplicationData[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview results...</p>
        </div>
      </div>
    );
  }

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
            Interview Results
          </h1>
          <p className="text-gray-600">
            Review completed interview results by position
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {Object.keys(groupedByPosition).length === 0 ? (
          <Card className="border shadow-sm bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No interview results available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByPosition).map(([position, candidates]) => (
              <Card key={position} className="border shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    {position}
                  </CardTitle>
                  <CardDescription>
                    {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} interviewed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700">Candidate</TableHead>
                        <TableHead className="text-gray-700">Grade</TableHead>
                        <TableHead className="text-gray-700">Student #</TableHead>
                        <TableHead className="text-gray-700">Program</TableHead>
                        <TableHead className="text-gray-700">Application Score</TableHead>
                        <TableHead className="text-gray-700">Interview Score</TableHead>
                        <TableHead className="text-gray-700">Total Score</TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates
                        .sort((a, b) => {
                          const aTotal = (a.score || 0) + 85; // Mock interview score
                          const bTotal = (b.score || 0) + 85;
                          return bTotal - aTotal;
                        })
                        .map((candidate, index) => {
                          const interviewScore = 85; // Mock interview score
                          const totalScore = (candidate.score || 0) + interviewScore;
                          
                          return (
                            <TableRow key={candidate.id} className="border-gray-200">
                              <TableCell className="font-medium text-gray-900">
                                {candidate.userProfile?.fullName || 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {candidate.userProfile?.grade || 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {candidate.userProfile?.studentNumber || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {candidate.userProfile?.studentType && candidate.userProfile.studentType !== 'none' ? (
                                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                                    {candidate.userProfile.studentType}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">None</span>
                                )}
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                {candidate.score || 0}/100
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                {interviewScore}/100
                              </TableCell>
                              <TableCell className="font-bold text-gray-900">
                                {totalScore}/200
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={
                                    index === 0 
                                      ? "bg-gray-800 text-white" 
                                      : "bg-gray-200 text-gray-700"
                                  }
                                >
                                  {index === 0 ? 'Recommended' : 'Interviewed'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewResults;
