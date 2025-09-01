import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, FileText, Users } from 'lucide-react';
import { getAllApplications, getApplicationGrades, ApplicationData, ApplicationGrades } from '@/services/applicationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface SummaryViewProps {
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
  interviewType: 'one' | 'two';
  panelGrades: PanelMemberGrade[];
  averageScore: number;
}

interface ApplicationSummary extends ApplicationData {
  grades?: ApplicationGrades;
  gradedByExecutives: string[];
  averageApplicationGrade: number | null;
  interviewGrade: number | null;
  executiveFriends: string[];
}

const SummaryView: React.FC<SummaryViewProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadApplicationSummaries = async () => {
      try {
        const allApplications = await getAllApplications();
        
        // Filter for only Honourary Member applications
        const honouraryMemberApplications = allApplications.filter(app => app.position === 'Honourary Member');
        
        const summaries = await Promise.all(
          honouraryMemberApplications.map(async (app) => {
            let grades: ApplicationGrades | null = null;
            try {
              grades = await getApplicationGrades(app.id);
            } catch (error) {
              console.error(`Error loading grades for ${app.id}:`, error);
            }

            // Load interview grades from both interviews
            let combinedInterviewGrade: number | null = null;
            try {
              const [gradeDocOne, gradeDocTwo] = await Promise.all([
                getDoc(doc(db, 'interviewGrades', `${app.id}_interview_one`)),
                getDoc(doc(db, 'interviewGrades', `${app.id}_interview_two`))
              ]);

              let interviewOneScore: number | null = null;
              let interviewTwoScore: number | null = null;

              if (gradeDocOne.exists()) {
                const data = gradeDocOne.data() as InterviewGrades;
                interviewOneScore = data.averageScore || null;
              }

              if (gradeDocTwo.exists()) {
                const data = gradeDocTwo.data() as InterviewGrades;
                interviewTwoScore = data.averageScore || null;
              }

              // Calculate combined interview grade (average of both interviews)
              if (interviewOneScore !== null && interviewTwoScore !== null) {
                combinedInterviewGrade = (interviewOneScore + interviewTwoScore) / 2;
              } else if (interviewOneScore !== null) {
                combinedInterviewGrade = interviewOneScore;
              } else if (interviewTwoScore !== null) {
                combinedInterviewGrade = interviewTwoScore;
              }
            } catch (error) {
              console.error(`Error loading interview grades for ${app.id}:`, error);
            }

            // Extract executive friends from universal questions
            const executiveFriends: string[] = [];
            if (app.answers) {
              const friendsAnswer = app.answers['honorary_6'] || app.answers['executive_friends'] || '';
              if (friendsAnswer) {
                executiveFriends.push(...friendsAnswer.split(',').map((name: string) => name.trim()).filter(Boolean));
              }
            }

            return {
              ...app,
              grades,
              gradedByExecutives: grades?.executiveGrades.map(eg => eg.executiveName) || [],
              averageApplicationGrade: grades?.averageScore || null,
              interviewGrade: combinedInterviewGrade,
              executiveFriends
            } as ApplicationSummary;
          })
        );

        setApplications(summaries);
      } catch (error) {
        console.error('Error loading application summaries:', error);
        toast({
          title: "Error",
          description: "Failed to load application summaries",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadApplicationSummaries();
  }, [toast]);

  const handlePrintSummary = () => {
    const printContent = generatePrintContent(applications);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handlePrintIndividualApplication = (application: ApplicationSummary) => {
    const printContent = generateIndividualPrintContent(application);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const generatePrintContent = (apps: ApplicationSummary[]) => {
    const title = 'Honourary Member Applications Summary';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background-color: #f3f4f6; font-weight: bold; font-size: 11px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .status-submitted { color: #059669; font-weight: bold; }
            .status-draft { color: #6b7280; }
            .grade { font-weight: bold; color: #7c3aed; }
            .no-grade { color: #9ca3af; font-style: italic; }
            @media print {
              body { margin: 0; font-size: 10px; }
              th, td { padding: 4px 6px; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><strong>Total Applications:</strong> ${apps.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>Student #</th>
                <th>Program</th>
                <th>Status</th>
                <th>App Grade</th>
                <th>Interview Grade</th>
                <th>Graded By</th>
                <th>Executive Friends</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              ${apps.map(app => `
                <tr>
                  <td>${app.userProfile?.fullName || 'N/A'}</td>
                  <td>${app.userProfile?.grade || 'N/A'}</td>
                  <td>${app.userProfile?.studentNumber || 'N/A'}</td>
                  <td>${app.userProfile?.studentType && app.userProfile.studentType !== 'none' ? app.userProfile.studentType : 'N/A'}</td>
                  <td class="status-${app.status}">${app.status?.replace('_', ' ').toUpperCase() || 'N/A'}</td>
                  <td class="${app.averageApplicationGrade ? 'grade' : 'no-grade'}">
                    ${app.averageApplicationGrade ? app.averageApplicationGrade.toFixed(1) + '/10' : 'N/A'}
                  </td>
                  <td class="${app.interviewGrade ? 'grade' : 'no-grade'}">
                    ${app.interviewGrade ? app.interviewGrade.toFixed(1) + '/5' : 'N/A'}
                  </td>
                  <td>${app.gradedByExecutives.join(', ') || 'None'}</td>
                  <td>${app.executiveFriends.join(', ') || 'None'}</td>
                  <td>${app.grades?.executiveGrades.map(eg => eg.feedback).filter(Boolean).join('; ') || 'No comments'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
  };

  const generateIndividualPrintContent = (app: ApplicationSummary) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${app.userProfile?.fullName || 'Unknown'} - Honourary Member Application</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #1f2937; }
            h1 { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .question { margin: 15px 0; }
            .question-text { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .answer { background-color: #f9fafb; padding: 10px; border-radius: 4px; }
            .grade-section { background-color: #eff6ff; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Honourary Member Application - ${app.userProfile?.fullName || 'Unknown Applicant'}</h1>
          
          <div class="section">
            <h2>Applicant Information</h2>
            <p><strong>Name:</strong> ${app.userProfile?.fullName || 'N/A'}</p>
            <p><strong>Student Number:</strong> ${app.userProfile?.studentNumber || 'N/A'}</p>
            <p><strong>Grade:</strong> ${app.userProfile?.grade || 'N/A'}</p>
            <p><strong>Program:</strong> ${app.userProfile?.studentType && app.userProfile.studentType !== 'none' ? app.userProfile.studentType : 'N/A'}</p>
            <p><strong>Position Applied For:</strong> Honourary Member</p>
            <p><strong>Application Status:</strong> ${app.status?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
            <p><strong>Submitted:</strong> ${app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Not submitted'}</p>
            ${app.interviewGrade ? `<p><strong>Combined Interview Score:</strong> ${app.interviewGrade.toFixed(1)}/5</p>` : ''}
          </div>

          <div class="section">
            <h2>Application Responses</h2>
            ${Object.entries(app.answers || {}).map(([key, value]) => `
              <div class="question">
                <div class="question-text">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</div>
                <div class="answer">${value || 'No response provided'}</div>
              </div>
            `).join('')}
          </div>

          ${app.grades ? `
            <div class="section grade-section">
              <h2>Executive Grades & Feedback</h2>
              <p><strong>Average Score:</strong> ${app.averageApplicationGrade?.toFixed(1) || 'N/A'}/10</p>
              
              ${app.grades.executiveGrades.map(grade => `
                <div style="margin: 15px 0; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px;">
                  <h3>${grade.executiveName}</h3>
                  <p><strong>Score:</strong> ${grade.totalScore.toFixed(1)}/${grade.maxTotalScore}</p>
                  <p><strong>Graded on:</strong> ${new Date(grade.gradedAt).toLocaleDateString()}</p>
                  ${grade.feedback ? `<p><strong>Feedback:</strong> ${grade.feedback}</p>` : ''}
                  
                  <table>
                    <thead>
                      <tr><th>Question</th><th>Score</th><th>Feedback</th></tr>
                    </thead>
                    <tbody>
                      ${grade.grades.map(q => `
                        <tr>
                          <td>${q.questionId}</td>
                          <td>${q.score}/${q.maxScore}</td>
                          <td>${q.feedback || 'No feedback'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `).join('')}
            </div>
          ` : '<div class="section"><h2>No Grades Available</h2><p>This application has not been graded yet.</p></div>'}
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex space-x-3">
              <Button
                onClick={handlePrintSummary}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Summary
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Honourary Member Applications Summary
          </h1>
          <p className="text-gray-600">
            Comprehensive view of all Honourary Member applications with grades and feedback
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Honourary Member Applications ({applications.length})
            </CardTitle>
            <CardDescription>
              Comprehensive overview with grades, feedback, and candidate details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Student #</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>App Grade</TableHead>
                    <TableHead>Interview Grade</TableHead>
                    <TableHead>Graded By</TableHead>
                    <TableHead>Executive Friends</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.userProfile?.fullName || 'N/A'}
                      </TableCell>
                      <TableCell>{app.userProfile?.grade || 'N/A'}</TableCell>
                      <TableCell>{app.userProfile?.studentNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {app.userProfile?.studentType && app.userProfile.studentType !== 'none' ? (
                          <Badge variant="secondary">{app.userProfile.studentType}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={app.status === 'submitted' ? 'default' : 'secondary'}>
                          {app.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.averageApplicationGrade ? (
                          <span className="font-semibold text-blue-600">
                            {app.averageApplicationGrade.toFixed(1)}/10
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.interviewGrade ? (
                          <span className="font-semibold text-green-600">
                            {app.interviewGrade.toFixed(1)}/5
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {app.gradedByExecutives.length > 0 ? (
                            app.gradedByExecutives.map((exec, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {exec}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {app.executiveFriends.length > 0 ? (
                            app.executiveFriends.map((friend, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {friend}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handlePrintIndividualApplication(app)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {applications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No Honourary Member applications found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        {applications.some(app => app.grades?.executiveGrades.some(eg => eg.feedback)) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Executive Comments Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .filter(app => app.grades?.executiveGrades.some(eg => eg.feedback))
                  .map(app => (
                    <div key={app.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {app.userProfile?.fullName} - Honourary Member
                      </h4>
                      <div className="space-y-2">
                        {app.grades?.executiveGrades
                          .filter(eg => eg.feedback)
                          .map((grade, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <div className="text-sm font-medium text-gray-700 mb-1">
                                {grade.executiveName}:
                              </div>
                              <div className="text-sm text-gray-600">
                                {grade.feedback}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SummaryView;