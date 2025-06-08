
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, CheckCircle, XCircle, Users } from 'lucide-react';
import { getAllApplications, ApplicationData, getApplicationGrades } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';

const ApplicationReports: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const allApplications = await getAllApplications();
        const submittedApps = allApplications.filter(app => app.status === 'submitted');
        setApplications(submittedApps);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const generateReport = async (status: 'for_interview' | 'unsuccessful' | 'all', position?: string) => {
    try {
      let filteredApps = applications;
      
      if (position) {
        filteredApps = applications.filter(app => app.position === position);
      }
      
      if (status !== 'all') {
        filteredApps = filteredApps.filter(app => app.reviewStatus === status);
      }

      // Get grades for all applications
      const appsWithGrades = await Promise.all(
        filteredApps.map(async (app) => {
          const grades = await getApplicationGrades(app.id);
          return { ...app, grades };
        })
      );

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const statusTitle = status === 'all' ? 'All Applications' : 
                         status === 'for_interview' ? 'Successful Applicants (For Interview)' : 
                         'Unsuccessful Applicants';
      
      const positionTitle = position ? ` - ${position}` : '';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${statusTitle}${positionTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; font-size: 12px; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .summary { background: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
              .applicant { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; page-break-inside: avoid; }
              .applicant-header { background: #f5f5f5; padding: 10px; margin: -15px -15px 10px -15px; }
              .status-badge { padding: 3px 8px; border-radius: 10px; font-weight: bold; font-size: 10px; }
              .for-interview { background: #dcfce7; color: #166534; }
              .unsuccessful { background: #fef2f2; color: #dc2626; }
              .pending { background: #fef3c7; color: #92400e; }
              .grade-info { background: #f8f9fa; padding: 8px; margin: 5px 0; border-left: 3px solid #007bff; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f5f5f5; }
              @media print { body { margin: 0; font-size: 10px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Executive Application Report</h1>
              <h2>${statusTitle}${positionTitle}</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="summary">
              <h3>Summary</h3>
              <p><strong>Total Applications:</strong> ${appsWithGrades.length}</p>
              <p><strong>For Interview:</strong> ${appsWithGrades.filter(app => app.reviewStatus === 'for_interview').length}</p>
              <p><strong>Unsuccessful:</strong> ${appsWithGrades.filter(app => app.reviewStatus === 'unsuccessful').length}</p>
              <p><strong>Pending Review:</strong> ${appsWithGrades.filter(app => !app.reviewStatus || app.reviewStatus === 'pending').length}</p>
            </div>

            ${appsWithGrades.map(app => `
              <div class="applicant">
                <div class="applicant-header">
                  <h3>${app.userProfile?.fullName || 'Unknown Applicant'}</h3>
                  <span class="status-badge ${app.reviewStatus || 'pending'}">
                    ${app.reviewStatus === 'for_interview' ? 'For Interview' : 
                      app.reviewStatus === 'unsuccessful' ? 'Unsuccessful' : 'Pending Review'}
                  </span>
                </div>
                
                <table>
                  <tr><td><strong>Position</strong></td><td>${app.position}</td></tr>
                  <tr><td><strong>Student Number</strong></td><td>${app.userProfile?.studentNumber || 'N/A'}</td></tr>
                  <tr><td><strong>Grade</strong></td><td>${app.userProfile?.grade || 'N/A'}</td></tr>
                  <tr><td><strong>Program</strong></td><td>${app.userProfile?.studentType || 'N/A'}</td></tr>
                  <tr><td><strong>Overall Score</strong></td><td>${app.score ? app.score.toFixed(1) + '/10' : 'Not graded'}</td></tr>
                  <tr><td><strong>Submitted</strong></td><td>${app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</td></tr>
                </table>

                ${app.grades && app.grades.executiveGrades.length > 0 ? `
                  <div class="grade-info">
                    <h4>Executive Grades</h4>
                    ${app.grades.executiveGrades.map(eg => `
                      <p><strong>${eg.executiveName}:</strong> ${eg.totalScore}/${eg.maxTotalScore} 
                      (${(eg.totalScore/eg.maxTotalScore*10).toFixed(1)}/10) - ${eg.gradedAt.toLocaleDateString()}</p>
                      ${eg.feedback ? `<p><em>Feedback:</em> ${eg.feedback}</p>` : ''}
                    `).join('')}
                  </div>
                ` : '<p><em>No grades available</em></p>'}

                <h4>Application Responses</h4>
                ${Object.entries(app.answers || {}).map(([key, answer], index) => `
                  <div style="margin: 10px 0; padding: 8px; background: #f9f9f9;">
                    <p><strong>Question ${index + 1}:</strong></p>
                    <p>${answer}</p>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();

      toast({
        title: "Report Generated",
        description: `${statusTitle} report has been opened for printing.`,
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const positions = ['Secretary', 'Treasurer', 'Community Outreach', 'Athletics Liaison', 'Promotions Officer', 'Photography Exec'];

  const getStatusCount = (status: 'for_interview' | 'unsuccessful') => {
    return applications.filter(app => app.reviewStatus === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Application Reports
          </CardTitle>
          <CardDescription>
            Generate and print comprehensive reports of application statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">For Interview</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{getStatusCount('for_interview')}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Unsuccessful</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{getStatusCount('unsuccessful')}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Total Applications</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
            </div>
          </div>

          {/* Overall Reports */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Overall Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => generateReport('for_interview')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Successful Applicants
              </Button>
              
              <Button 
                onClick={() => generateReport('unsuccessful')}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Unsuccessful Applicants
              </Button>
              
              <Button 
                onClick={() => generateReport('all')}
                variant="outline"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Complete Report
              </Button>
            </div>
          </div>

          {/* Position-specific Reports */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Reports by Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map(position => {
                const positionApps = applications.filter(app => app.position === position);
                const forInterview = positionApps.filter(app => app.reviewStatus === 'for_interview').length;
                const unsuccessful = positionApps.filter(app => app.reviewStatus === 'unsuccessful').length;
                
                return (
                  <Card key={position} className="p-4">
                    <h4 className="font-semibold mb-2">{position}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {positionApps.length} total • {forInterview} for interview • {unsuccessful} unsuccessful
                    </p>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => generateReport('all', position)}
                        variant="outline"
                      >
                        All {position} Applications
                      </Button>
                      <Button 
                        size="sm" 
                        className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => generateReport('for_interview', position)}
                        disabled={forInterview === 0}
                      >
                        Successful ({forInterview})
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationReports;
