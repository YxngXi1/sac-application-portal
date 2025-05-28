
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Eye, Star, MessageSquare } from 'lucide-react';
import ApplicationGrader from './ApplicationGrader';

interface PositionApplicationsProps {
  positionId: string;
  positionName: string;
  onBack: () => void;
}

interface Applicant {
  id: string;
  name: string;
  grade: string;
  studentNumber: string;
  score: number;
  interviewed: boolean;
  submittedAt: string;
}

const PositionApplications: React.FC<PositionApplicationsProps> = ({
  positionId,
  positionName,
  onBack
}) => {
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null);
  const [gradeMode, setGradeMode] = useState(false);

  // Mock data for applicants
  const applicants: Applicant[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      grade: '11',
      studentNumber: '123456',
      score: 8.5,
      interviewed: true,
      submittedAt: '2025-05-20'
    },
    {
      id: '2',
      name: 'Michael Chen',
      grade: '12',
      studentNumber: '234567',
      score: 7.2,
      interviewed: false,
      submittedAt: '2025-05-22'
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      grade: '11',
      studentNumber: '345678',
      score: 9.1,
      interviewed: true,
      submittedAt: '2025-05-18'
    },
    {
      id: '4',
      name: 'Alex Thompson',
      grade: '10',
      studentNumber: '456789',
      score: 6.8,
      interviewed: false,
      submittedAt: '2025-05-25'
    }
  ];

  const handleInterviewToggle = (applicantId: string) => {
    // This would update the interview status in the database
    console.log('Toggle interview status for:', applicantId);
  };

  if (selectedApplicant && gradeMode) {
    return (
      <ApplicationGrader
        applicantId={selectedApplicant}
        applicantName={applicants.find(a => a.id === selectedApplicant)?.name || ''}
        positionName={positionName}
        onBack={() => {
          setSelectedApplicant(null);
          setGradeMode(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {positionName} Applications
          </h1>
          <p className="text-gray-600">
            Review and manage applications for this position
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{applicants.length}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {applicants.filter(a => a.interviewed).length}
                </p>
                <p className="text-sm text-gray-600">Interviewed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {(applicants.reduce((sum, a) => sum + a.score, 0) / applicants.length).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Click on an applicant to view details or enter grade mode
                </CardDescription>
              </div>
              <div className="space-x-2">
                <Button variant="outline">
                  Export Data
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Student Number</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-medium">{applicant.name}</TableCell>
                    <TableCell>{applicant.grade}</TableCell>
                    <TableCell>{applicant.studentNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{applicant.score}/10</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={applicant.interviewed ? "default" : "secondary"}>
                        {applicant.interviewed ? "Interviewed" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>{applicant.submittedAt}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplicant(applicant.id);
                            setGradeMode(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Grade
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplicant(applicant.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant={applicant.interviewed ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleInterviewToggle(applicant.id)}
                        >
                          {applicant.interviewed ? "Remove Interview" : "Mark Interviewed"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionApplications;
