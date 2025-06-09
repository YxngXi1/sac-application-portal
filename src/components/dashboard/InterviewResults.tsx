
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Award, TrendingUp, MessageSquare, CheckSquare, User } from 'lucide-react';
import { getAllApplications, ApplicationData } from '@/services/applicationService';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InterviewResultsProps {
  onBack: () => void;
}

interface InterviewCheckboxes {
  pastExperience: boolean;
  roleKnowledge: boolean;
  leadershipSkills: boolean;
  creativeOutlook: boolean;
  timeManagement: boolean;
}

interface PanelMemberGrade {
  panelMemberId: string;
  panelMemberName: string;
  grades: Record<string, number>;
  checkboxes: InterviewCheckboxes;
  feedback: string;
  submittedAt: Date;
}

interface InterviewGrades {
  candidateId: string;
  panelGrades: PanelMemberGrade[];
  averageScore: number;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [interviewGrades, setInterviewGrades] = useState<Record<string, InterviewGrades>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allApplications = await getAllApplications();
        // Filter for interviewed candidates
        const interviewed = allApplications.filter(app => app.interviewScheduled);
        setApplications(interviewed);

        // Load interview grades for each candidate
        const gradesData: Record<string, InterviewGrades> = {};
        for (const app of interviewed) {
          try {
            const gradeDoc = await getDoc(doc(db, 'interviewGrades', app.id));
            if (gradeDoc.exists()) {
              gradesData[app.id] = gradeDoc.data() as InterviewGrades;
            }
          } catch (error) {
            console.error(`Error loading grades for ${app.id}:`, error);
          }
        }
        setInterviewGrades(gradesData);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getInterviewScore = (candidateId: string): number => {
    const grades = interviewGrades[candidateId];
    if (!grades || !grades.panelGrades.length) return 0;
    
    // Calculate average score across all panel members
    const allScores = grades.panelGrades.map(panelGrade => {
      const scores = Object.values(panelGrade.grades).filter(s => typeof s === 'number' && s >= 0);
      return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    });
    
    return allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0;
  };

  const getCheckboxSummary = (candidateId: string) => {
    const grades = interviewGrades[candidateId];
    if (!grades || !grades.panelGrades.length) return { total: 0, breakdown: {} };
    
    const checkboxKeys: (keyof InterviewCheckboxes)[] = [
      'pastExperience', 'roleKnowledge', 'leadershipSkills', 'creativeOutlook', 'timeManagement'
    ];
    
    const breakdown: Record<string, number> = {};
    let totalChecked = 0;
    
    checkboxKeys.forEach(key => {
      const checkedCount = grades.panelGrades.filter(pg => pg.checkboxes && pg.checkboxes[key]).length;
      breakdown[key] = checkedCount;
      if (checkedCount > 0) totalChecked++;
    });
    
    return { total: totalChecked, breakdown };
  };

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
                        <TableHead className="text-gray-700">Application Score</TableHead>
                        <TableHead className="text-gray-700">Interview Score</TableHead>
                        <TableHead className="text-gray-700">Total Score</TableHead>
                        <TableHead className="text-gray-700">Assessment</TableHead>
                        <TableHead className="text-gray-700">Criteria Met</TableHead>
                        <TableHead className="text-gray-700">Feedback</TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates
                        .sort((a, b) => {
                          const aInterview = getInterviewScore(a.id);
                          const bInterview = getInterviewScore(b.id);
                          const aAppScore = ((a.score || 0) / 100) * 10; // Convert to /10
                          const bAppScore = ((b.score || 0) / 100) * 10; // Convert to /10
                          const aTotal = aAppScore + aInterview; // Total out of 15
                          const bTotal = bAppScore + bInterview; // Total out of 15
                          return bTotal - aTotal;
                        })
                        .map((candidate, index) => {
                          const interviewScore = getInterviewScore(candidate.id);
                          const applicationScore = ((candidate.score || 0) / 100) * 10; // Convert to /10
                          const totalScore = applicationScore + interviewScore; // Total out of 15
                          const checkboxSummary = getCheckboxSummary(candidate.id);
                          
                          return (
                            <TableRow key={candidate.id} className="border-gray-200">
                              <TableCell className="font-medium text-gray-900">
                                {candidate.userProfile?.fullName || 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {candidate.userProfile?.grade || 'N/A'}
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                {applicationScore.toFixed(1)}/10
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                {interviewScore.toFixed(1)}/5
                              </TableCell>
                              <TableCell className="font-bold text-gray-900">
                                {totalScore.toFixed(1)}/15
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <CheckSquare className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Assessment Summary - {candidate.userProfile?.fullName}</DialogTitle>
                                      <DialogDescription>Panel assessment criteria results</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="text-sm">Past Experience or attendance at SAC events</span>
                                          <Badge variant={checkboxSummary.breakdown.pastExperience > 0 ? "default" : "secondary"}>
                                            {checkboxSummary.breakdown.pastExperience || 0} panel member(s)
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="text-sm">Good knowledge of tasks involved for the role</span>
                                          <Badge variant={checkboxSummary.breakdown.roleKnowledge > 0 ? "default" : "secondary"}>
                                            {checkboxSummary.breakdown.roleKnowledge || 0} panel member(s)
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="text-sm">Good leadership skills and leadership experience</span>
                                          <Badge variant={checkboxSummary.breakdown.leadershipSkills > 0 ? "default" : "secondary"}>
                                            {checkboxSummary.breakdown.leadershipSkills || 0} panel member(s)
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="text-sm">Creative and energetic outlook for the tasks required for this role</span>
                                          <Badge variant={checkboxSummary.breakdown.creativeOutlook > 0 ? "default" : "secondary"}>
                                            {checkboxSummary.breakdown.creativeOutlook || 0} panel member(s)
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="text-sm">Seems organized and manages time well</span>
                                          <Badge variant={checkboxSummary.breakdown.timeManagement > 0 ? "default" : "secondary"}>
                                            {checkboxSummary.breakdown.timeManagement || 0} panel member(s)
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={checkboxSummary.total > 2 ? "default" : "secondary"}
                                  className={checkboxSummary.total > 2 ? "bg-green-100 text-green-800" : ""}
                                >
                                  {checkboxSummary.total}/5
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Panel Feedback - {candidate.userProfile?.fullName}</DialogTitle>
                                      <DialogDescription>Feedback from all panel members</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                      {interviewGrades[candidate.id]?.panelGrades?.filter(pg => pg.feedback).length > 0 ? (
                                        interviewGrades[candidate.id].panelGrades
                                          .filter(pg => pg.feedback)
                                          .map((grade) => (
                                            <div key={grade.panelMemberId} className="p-4 border rounded-lg">
                                              <div className="flex items-center gap-2 mb-2">
                                                <User className="h-4 w-4 text-gray-600" />
                                                <span className="font-medium">{grade.panelMemberName}</span>
                                                <span className="text-xs text-gray-500">
                                                  {new Date(grade.submittedAt).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <p className="text-sm text-gray-800">{grade.feedback}</p>
                                            </div>
                                          ))
                                      ) : (
                                        <p className="text-gray-500 text-center py-4">No feedback available</p>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
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
