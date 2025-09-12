import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Award, MessageSquare, CheckSquare, User, Eye, Printer, Shield } from 'lucide-react';
import { getAllApplications, ApplicationData } from '@/services/applicationService';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import CandidateInterviewDetails from './CandidateInterviewDetails';

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
  interviewType: string;
}

interface CombinedInterviewGrades {
  candidateId: string;
  interviewOne?: InterviewGrades;
  interviewTwo?: InterviewGrades;
  combinedAverageScore: number;
  allPanelGrades: PanelMemberGrade[];
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [interviewGrades, setInterviewGrades] = useState<Record<string, CombinedInterviewGrades>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationData | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isSuperadmin = userData.role === 'superadmin';
          setIsAuthorized(isSuperadmin);
          
          if (isSuperadmin) {
            // Only load data if user is authorized
            await loadData();
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, []);

  const loadData = async () => {
    try {
      const allApplications = await getAllApplications();
      // Filter for interviewed candidates
      const interviewed = allApplications.filter(app => app.interviewScheduled);
      setApplications(interviewed);

      // Load interview grades for each candidate
      const gradesData: Record<string, CombinedInterviewGrades> = {};
      
      for (const app of interviewed) {
        try {
          // Query for both interview types for this candidate
          const interviewGradesQuery = query(
            collection(db, 'interviewGrades'),
            where('candidateId', '==', app.id)
          );
          
          const querySnapshot = await getDocs(interviewGradesQuery);
          const candidateInterviews: InterviewGrades[] = [];
          
          querySnapshot.forEach((doc) => {
            candidateInterviews.push({ candidateId: doc.id, ...doc.data() } as InterviewGrades);
          });

          if (candidateInterviews.length > 0) {
            const interviewOne = candidateInterviews.find(interview => interview.interviewType === 'one');
            const interviewTwo = candidateInterviews.find(interview => interview.interviewType === 'two');
            
            // Calculate combined average score
            let combinedAverageScore = 0;
            let scoreCount = 0;
            
            if (interviewOne && interviewOne.averageScore) {
              combinedAverageScore += parseFloat(interviewOne.averageScore.toString());
              scoreCount++;
            }
            
            if (interviewTwo && interviewTwo.averageScore) {
              combinedAverageScore += parseFloat(interviewTwo.averageScore.toString());
              scoreCount++;
            }
            
            if (scoreCount > 0) {
              combinedAverageScore = combinedAverageScore / scoreCount;
            }

            // Combine all panel grades from both interviews
            const allPanelGrades: PanelMemberGrade[] = [];
            if (interviewOne?.panelGrades) {
              allPanelGrades.push(...interviewOne.panelGrades);
            }
            if (interviewTwo?.panelGrades) {
              allPanelGrades.push(...interviewTwo.panelGrades);
            }

            gradesData[app.id] = {
              candidateId: app.id,
              interviewOne,
              interviewTwo,
              combinedAverageScore,
              allPanelGrades
            };
          }
        } catch (error) {
          console.error(`Error loading grades for ${app.id}:`, error);
        }
      }
      setInterviewGrades(gradesData);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const getInterviewScore = (candidateId: string): number => {
    const grades = interviewGrades[candidateId];
    if (!grades) return 0;
    
    return grades.combinedAverageScore || 0;
  };

  const getInterviewOneScore = (candidateId: string): number => {
    const grades = interviewGrades[candidateId];
    if (!grades || !grades.interviewOne) return 0;
    return grades.interviewOne.averageScore || 0;
  };

  const getInterviewTwoScore = (candidateId: string): number => {
    const grades = interviewGrades[candidateId];
    if (!grades || !grades.interviewTwo) return 0;
    return grades.interviewTwo.averageScore || 0;
  };

  const getCheckboxSummary = (candidateId: string) => {
    const grades = interviewGrades[candidateId];
    if (!grades || !grades.allPanelGrades.length) return { total: 0, breakdown: {} };
    
    const checkboxKeys: (keyof InterviewCheckboxes)[] = [
      'pastExperience', 'roleKnowledge', 'leadershipSkills', 'creativeOutlook', 'timeManagement'
    ];
    
    const breakdown: Record<string, number> = {};
    let totalChecked = 0;
    
    checkboxKeys.forEach(key => {
      const checkedCount = grades.allPanelGrades.filter(pg => pg.checkboxes && pg.checkboxes[key]).length;
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = generatePrintContent();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Interview Results Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000;
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .position-section { 
              margin-bottom: 40px; 
              page-break-inside: avoid;
            }
            .position-title { 
              background: #f3f4f6; 
              padding: 15px; 
              margin-bottom: 20px;
              border-left: 4px solid #2563eb;
              font-size: 18px;
              font-weight: bold;
            }
            .overview-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            .overview-table th, .overview-table td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: left;
              font-size: 12px;
            }
            .overview-table th { 
              background: #f3f4f6; 
              font-weight: bold;
            }
            .candidate { 
              margin-bottom: 30px; 
              border: 1px solid #e5e7eb;
              padding: 20px;
              page-break-inside: avoid;
            }
            .candidate-header { 
              background: #f9fafb; 
              padding: 15px; 
              margin: -20px -20px 20px -20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .grades-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
            }
            .grades-table th, .grades-table td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: left;
              font-size: 11px;
            }
            .grades-table th { 
              background: #f3f4f6; 
              font-weight: bold;
            }
            .feedback-section { 
              margin-top: 20px;
            }
            .feedback-item { 
              background: #f8fafc; 
              padding: 15px; 
              margin: 10px 0;
              border-left: 3px solid #3b82f6;
            }
            .criteria-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 10px; 
              margin: 15px 0;
            }
            .criteria-item { 
              padding: 8px; 
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .score-summary { 
              background: #eff6ff; 
              padding: 15px; 
              border: 1px solid #bfdbfe;
              margin: 15px 0;
            }
            .print-buttons { 
              margin: 20px 0; 
              text-align: center;
            }
            .print-buttons button { 
              margin: 0 10px; 
              padding: 10px 20px; 
              background: #2563eb; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer;
            }
            @media print {
              body { margin: 0; }
              .print-buttons { display: none; }
              .position-section { page-break-before: always; }
              .candidate { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handlePrintPosition = (position: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = generatePositionPrintContent(position);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Interview Results Report - ${position}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000;
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .overview-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            .overview-table th, .overview-table td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: left;
              font-size: 12px;
            }
            .overview-table th { 
              background: #f3f4f6; 
              font-weight: bold;
            }
            .candidate { 
              margin-bottom: 30px; 
              border: 1px solid #e5e7eb;
              padding: 20px;
              page-break-inside: avoid;
            }
            .candidate-header { 
              background: #f9fafb; 
              padding: 15px; 
              margin: -20px -20px 20px -20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .grades-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
            }
            .grades-table th, .grades-table td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: left;
              font-size: 11px;
            }
            .grades-table th { 
              background: #f3f4f6; 
              font-weight: bold;
            }
            .feedback-section { 
              margin-top: 20px;
            }
            .feedback-item { 
              background: #f8fafc; 
              padding: 15px; 
              margin: 10px 0;
              border-left: 3px solid #3b82f6;
            }
            .criteria-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 10px; 
              margin: 15px 0;
            }
            .criteria-item { 
              padding: 8px; 
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .score-summary { 
              background: #eff6ff; 
              padding: 15px; 
              border: 1px solid #bfdbfe;
              margin: 15px 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generatePrintContent = () => {
    const now = new Date();
    let content = `
      <div class="header">
        <h1>Interview Results Report</h1>
        <p>Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
      </div>
    `;

    Object.entries(groupedByPosition).forEach(([position, candidates]) => {
      content += generatePositionContent(position, candidates);
    });

    return content;
  };

  const generatePositionPrintContent = (position: string) => {
    const now = new Date();
    const candidates = groupedByPosition[position] || [];
    
    let content = `
      <div class="header">
        <h1>Interview Results Report</h1>
        <h2>${position}</h2>
        <p>Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
      </div>
    `;

    content += generatePositionContent(position, candidates);
    return content;
  };

  const generatePositionContent = (position: string, candidates: ApplicationData[]) => {
    const sortedCandidates = candidates.sort((a, b) => {
      const aInterview = getInterviewScore(a.id);
      const bInterview = getInterviewScore(b.id);
      const aAppScore = ((a.score || 0) / 100) * 10;
      const bAppScore = ((b.score || 0) / 100) * 10;
      const aTotal = aAppScore + aInterview;
      const bTotal = bAppScore + bInterview;
      return bTotal - aTotal;
    });

    let content = `
      <div class="position-section">
        <div class="position-title">${position}</div>
        
        <h3>Overview - All Candidates</h3>
        <table class="overview-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate Name</th>
              <th>Grade</th>
              <th>Student Number</th>
              <th>Application Score</th>
              <th>Interview One Score</th>
              <th>Interview Two Score</th>
              <th>Combined Interview Score</th>
              <th>Total Score</th>
              <th>Criteria Met</th>
            </tr>
          </thead>
          <tbody>
    `;

    sortedCandidates.forEach((candidate, index) => {
      const interviewOneScore = getInterviewOneScore(candidate.id);
      const interviewTwoScore = getInterviewTwoScore(candidate.id);
      const combinedInterviewScore = getInterviewScore(candidate.id);
      const applicationScore = ((candidate.score || 0) / 100) * 10;
      const totalScore = applicationScore + combinedInterviewScore;
      const checkboxSummary = getCheckboxSummary(candidate.id);

      content += `
        <tr>
          <td>${index + 1}</td>
          <td>${candidate.userProfile?.fullName || 'N/A'}</td>
          <td>${candidate.userProfile?.grade || 'N/A'}</td>
          <td>${candidate.userProfile?.studentNumber || 'N/A'}</td>
          <td>${applicationScore.toFixed(1)}/10</td>
          <td>${interviewOneScore.toFixed(1)}/5</td>
          <td>${interviewTwoScore.toFixed(1)}/5</td>
          <td>${combinedInterviewScore.toFixed(1)}/5</td>
          <td>${totalScore.toFixed(1)}/15</td>
          <td>${checkboxSummary.total}/5</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>

        <h3>Detailed Results</h3>
    `;

    sortedCandidates.forEach((candidate, index) => {
      const interviewScore = getInterviewScore(candidate.id);
      const applicationScore = ((candidate.score || 0) / 100) * 10;
      const totalScore = applicationScore + interviewScore;
      const checkboxSummary = getCheckboxSummary(candidate.id);
      const grades = interviewGrades[candidate.id];

      content += `
        <div class="candidate">
          <div class="candidate-header">
            <h4>${candidate.userProfile?.fullName || 'N/A'}</h4>
            <p><strong>Grade:</strong> ${candidate.userProfile?.grade || 'N/A'} | 
               <strong>Student Number:</strong> ${candidate.userProfile?.studentNumber || 'N/A'} | 
               <strong>Ranking:</strong> ${index === 0 ? 'Recommended' : `#${index + 1}`}</p>
          </div>

          <div class="score-summary">
            <h5>Score Summary</h5>
            <p><strong>Application Score:</strong> ${applicationScore.toFixed(1)}/10</p>
            <p><strong>Interview Score:</strong> ${interviewScore.toFixed(1)}/5 (Combined from both interviews)</p>
            <p><strong>Total Score:</strong> ${totalScore.toFixed(1)}/15</p>
            <p><strong>Criteria Met:</strong> ${checkboxSummary.total}/5</p>
          </div>

          <div class="criteria-grid">
            <div class="criteria-item">
              <strong>Past Experience:</strong> ${checkboxSummary.breakdown.pastExperience || 0} panel member(s)
            </div>
            <div class="criteria-item">
              <strong>Role Knowledge:</strong> ${checkboxSummary.breakdown.roleKnowledge || 0} panel member(s)
            </div>
            <div class="criteria-item">
              <strong>Leadership Skills:</strong> ${checkboxSummary.breakdown.leadershipSkills || 0} panel member(s)
            </div>
            <div class="criteria-item">
              <strong>Creative Outlook:</strong> ${checkboxSummary.breakdown.creativeOutlook || 0} panel member(s)
            </div>
            <div class="criteria-item">
              <strong>Time Management:</strong> ${checkboxSummary.breakdown.timeManagement || 0} panel member(s)
            </div>
          </div>
      `;

      if (grades && grades.allPanelGrades && grades.allPanelGrades.length > 0) {
        content += `
          <h5>Individual Panel Member Grades (Both Interviews)</h5>
          <table class="grades-table">
            <thead>
              <tr>
                <th>Panel Member</th>
                <th>Interview Type</th>
                <th>Average</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
        `;

        grades.allPanelGrades.forEach(panelGrade => {
          const gradeValues = Object.values(panelGrade.grades).filter(g => typeof g === 'number' && g >= 0);
          const avgGrade = gradeValues.length > 0 ? (gradeValues.reduce((sum, g) => sum + g, 0) / gradeValues.length).toFixed(1) : 'N/A';
          
          // Determine which interview this grade is from
          let interviewType = 'Unknown';
          if (grades.interviewOne?.panelGrades?.includes(panelGrade)) {
            interviewType = 'Group Interview';
          } else if (grades.interviewTwo?.panelGrades?.includes(panelGrade)) {
            interviewType = 'Individual Interview';
          }
          
          content += `
            <tr>
              <td>${panelGrade.panelMemberName}</td>
              <td>${interviewType}</td>
              <td>${avgGrade}</td>
              <td>${new Date(panelGrade.submittedAt).toLocaleDateString()}</td>
            </tr>
          `;
        });

        content += `
            </tbody>
          </table>
        `;

        const feedbackEntries = grades.allPanelGrades.filter(pg => pg.feedback);
        if (feedbackEntries.length > 0) {
          content += `
            <div class="feedback-section">
              <h5>Panel Member Feedback (Both Interviews)</h5>
          `;

          feedbackEntries.forEach(grade => {
            // Determine which interview this feedback is from
            let interviewType = 'Unknown';
            if (grades.interviewOne?.panelGrades?.includes(grade)) {
              interviewType = 'Group Interview';
            } else if (grades.interviewTwo?.panelGrades?.includes(grade)) {
              interviewType = 'Individual Interview';
            }

            content += `
              <div class="feedback-item">
                <strong>${grade.panelMemberName}</strong> (${interviewType}) - ${new Date(grade.submittedAt).toLocaleDateString()}
                <p>${grade.feedback}</p>
              </div>
            `;
          });

          content += `</div>`;
        }
      } else {
        content += `<p><em>No interview grades available for this candidate.</em></p>`;
      }

      content += `</div>`;
    });

    content += `</div>`;
    return content;
  };

  if (selectedCandidate) {
    return (
      <CandidateInterviewDetails
        candidate={selectedCandidate}
        onBack={() => setSelectedCandidate(null)}
      />
    );
  }

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

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="border shadow-sm bg-white max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to view interview results. Only superadmin users can access this page.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Interview View
            </Button>
            
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All Results
            </Button>
          </div>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        {position}
                      </CardTitle>
                      <CardDescription>
                        {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} interviewed
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handlePrintPosition(position)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print {position} Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700">Candidate</TableHead>
                        <TableHead className="text-gray-700">Grade</TableHead>
                        <TableHead className="text-gray-700">Interview One</TableHead>
                        <TableHead className="text-gray-700">Interview Two</TableHead>
                        <TableHead className="text-gray-700">Combined Interview</TableHead>
                        <TableHead className="text-gray-700">Assessment</TableHead>
                        <TableHead className="text-gray-700">Criteria Met</TableHead>
                        <TableHead className="text-gray-700">Feedback</TableHead>
                        <TableHead className="text-gray-700">Details</TableHead>
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
                          const interviewOneScore = getInterviewOneScore(candidate.id);
                          const interviewTwoScore = getInterviewTwoScore(candidate.id);
                          const combinedInterviewScore = getInterviewScore(candidate.id);
                          const checkboxSummary = getCheckboxSummary(candidate.id);
                          
                          return (
                            <TableRow key={candidate.id} className="border-gray-200">
                              <TableCell className="font-medium text-gray-900">
                                <button
                                  onClick={() => setSelectedCandidate(candidate)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                >
                                  {candidate.userProfile?.fullName || 'N/A'}
                                </button>
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {candidate.userProfile?.grade || 'N/A'}
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                {interviewOneScore > 0 ? `${interviewOneScore.toFixed(1)}/5` : 'N/A'}
                              </TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {interviewTwoScore > 0 ? `${interviewTwoScore.toFixed(1)}/5` : 'N/A'}
                              </TableCell>
                              <TableCell className="text-purple-600 font-medium">
                                {combinedInterviewScore.toFixed(1)}/5
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
                                      <DialogDescription>Panel assessment criteria results (Combined from both interviews)</DialogDescription>
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
                                      <DialogDescription>Feedback from all panel members (Both interviews)</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                      {interviewGrades[candidate.id]?.allPanelGrades?.filter(pg => pg.feedback).length > 0 ? (
                                        interviewGrades[candidate.id].allPanelGrades
                                          .filter(pg => pg.feedback)
                                          .map((grade, index) => {
                                            // Determine which interview this feedback is from
                                            const grades = interviewGrades[candidate.id];
                                            let interviewType = 'Unknown';
                                            if (grades.interviewOne?.panelGrades?.includes(grade)) {
                                              interviewType = 'Group Interview';
                                            } else if (grades.interviewTwo?.panelGrades?.includes(grade)) {
                                              interviewType = 'Individual Interview';
                                            }

                                            return (
                                              <div key={`${grade.panelMemberId}-${index}`} className="p-4 border rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <User className="h-4 w-4 text-gray-600" />
                                                  <span className="font-medium">{grade.panelMemberName}</span>
                                                  <Badge variant="outline" className="text-xs">
                                                    {interviewType}
                                                  </Badge>
                                                  <span className="text-xs text-gray-500">
                                                    {new Date(grade.submittedAt).toLocaleDateString()}
                                                  </span>
                                                </div>
                                                <p className="text-sm text-gray-800">{grade.feedback}</p>
                                              </div>
                                            );
                                          })
                                      ) : (
                                        <p className="text-gray-500 text-center py-4">No feedback available</p>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCandidate(candidate)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
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