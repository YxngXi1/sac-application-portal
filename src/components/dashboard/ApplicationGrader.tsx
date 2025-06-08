import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Star, Check, X, FileDown, CheckCircle, XCircle } from 'lucide-react';
import { ApplicationData, getAllApplicationsByPosition, saveApplicationGrades, getApplicationGrades, ExecutiveGradeSubmission, updateApplicationReviewStatus } from '@/services/applicationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApplicationGraderProps {
  application: ApplicationData;
  positionName: string;
  onBack: () => void;
  onNavigateToApplication?: (application: ApplicationData) => void;
}

interface Question {
  id: string;
  text: string;
  maxScore: number;
}

const ApplicationGrader: React.FC<ApplicationGraderProps> = ({
  application,
  positionName,
  onBack,
  onNavigateToApplication
}) => {
  const [questionGrades, setQuestionGrades] = useState<{ questionId: string; score: number; feedback?: string; }[]>([]);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [existingGrades, setExistingGrades] = useState<any>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [maxTotalScore, setMaxTotalScore] = useState(0);
  const [reviewStatus, setReviewStatus] = useState<'for_interview' | 'unsuccessful' | 'pending'>(
    application.reviewStatus || 'pending'
  );

  const { user } = useAuth();
  const { toast } = useToast();

  const questions: Question[] = [
    { id: '1', text: 'Communication Skills', maxScore: 2 },
    { id: '2', text: 'Teamwork & Collaboration', maxScore: 2 },
    { id: '3', text: 'Problem Solving', maxScore: 2 },
    { id: '4', text: 'Initiative & Leadership', maxScore: 2 },
    { id: '5', text: 'Adaptability', maxScore: 2 },
  ];

  useEffect(() => {
    const loadExistingGrades = async () => {
      try {
        const grades = await getApplicationGrades(application.id);
        if (grades) {
          setExistingGrades(grades);
          
          // Initialize questionGrades state with existing grades
          const initialQuestionGrades = grades.executiveGrades.find(
            (eg: any) => eg.executiveId === user?.uid
          )?.grades || [];
          setQuestionGrades(initialQuestionGrades);
          
          // Set overall feedback if it exists
          const existingFeedback = grades.executiveGrades.find(
            (eg: any) => eg.executiveId === user?.uid
          )?.feedback || '';
          setOverallFeedback(existingFeedback);
        }
      } catch (error) {
        console.error('Error loading existing grades:', error);
        toast({
          title: "Error",
          description: "Failed to load existing grades. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadExistingGrades();
  }, [application.id, user?.uid, toast]);

  useEffect(() => {
    // Calculate total score and max total score whenever questionGrades change
    let newTotalScore = 0;
    let newMaxTotalScore = 0;

    questionGrades.forEach(grade => {
      newTotalScore += grade.score;
      const question = questions.find(q => q.id === grade.questionId);
      newMaxTotalScore += question ? question.maxScore : 0;
    });

    setTotalScore(newTotalScore);
    setMaxTotalScore(newMaxTotalScore);
  }, [questionGrades, questions]);

  const handleSaveGrades = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      const gradeSubmission: ExecutiveGradeSubmission = {
        applicationId: application.id,
        executiveId: user.uid,
        executiveName: user.displayName || user.email || 'Unknown Executive',
        grades: questionGrades,
        totalScore: totalScore,
        maxTotalScore: maxTotalScore,
        gradedAt: new Date(),
        feedback: overallFeedback
      };

      await saveApplicationGrades(gradeSubmission);
      
      // Update review status if changed
      if (reviewStatus !== application.reviewStatus) {
        await updateApplicationReviewStatus(application.id, reviewStatus);
      }

      toast({
        title: "Grades Saved",
        description: "Your grades and feedback have been saved successfully.",
      });

      // Refresh the current application data
      const updatedApplications = await getAllApplicationsByPosition(positionName);
      const updatedApplication = updatedApplications.find(app => app.id === application.id);
      if (updatedApplication && onNavigateToApplication) {
        onNavigateToApplication({
          ...updatedApplication,
          reviewStatus
        });
      }

    } catch (error) {
      console.error('Error saving grades:', error);
      toast({
        title: "Error",
        description: "Failed to save grades. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateApplicationPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application - ${application.userProfile?.fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .question { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .grade-section { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
            .status-badge { padding: 5px 10px; border-radius: 15px; font-weight: bold; }
            .for-interview { background: #dcfce7; color: #166534; }
            .unsuccessful { background: #fef2f2; color: #dc2626; }
            .pending { background: #fef3c7; color: #92400e; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Executive Application</h1>
            <h2>${application.userProfile?.fullName || 'Unknown Applicant'}</h2>
            <p><strong>Position:</strong> ${positionName}</p>
            <p><strong>Student Number:</strong> ${application.userProfile?.studentNumber || 'N/A'}</p>
            <p><strong>Grade:</strong> ${application.userProfile?.grade || 'N/A'}</p>
            <p><strong>Status:</strong> 
              <span class="status-badge ${reviewStatus}">
                ${reviewStatus === 'for_interview' ? 'For Interview' : 
                  reviewStatus === 'unsuccessful' ? 'Unsuccessful' : 'Pending Review'}
              </span>
            </p>
            ${application.score ? `<p><strong>Overall Score:</strong> ${application.score.toFixed(1)}/10</p>` : ''}
          </div>

          <div class="section">
            <h3>Application Responses</h3>
            ${Object.entries(application.answers || {}).map(([questionKey, answer], index) => `
              <div class="question">
                <h4>Question ${index + 1}</h4>
                <p>${answer}</p>
              </div>
            `).join('')}
          </div>

          ${existingGrades && existingGrades.executiveGrades.length > 0 ? `
            <div class="section">
              <h3>Executive Grades & Feedback</h3>
              ${existingGrades.executiveGrades.map(eg => `
                <div class="grade-section">
                  <h4>Graded by: ${eg.executiveName}</h4>
                  <p><strong>Score:</strong> ${eg.totalScore}/${eg.maxTotalScore}</p>
                  <p><strong>Date:</strong> ${eg.gradedAt.toLocaleDateString()}</p>
                  ${eg.feedback ? `<p><strong>Overall Feedback:</strong> ${eg.feedback}</p>` : ''}
                  <h5>Question Grades:</h5>
                  ${eg.grades.map((grade, idx) => `
                    <div style="margin-left: 20px; margin-bottom: 10px;">
                      <p><strong>Question ${idx + 1}:</strong> ${grade.score}/${grade.maxScore}</p>
                      ${grade.feedback ? `<p><em>Feedback:</em> ${grade.feedback}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {application.userProfile?.fullName || 'Unknown Applicant'}
          </h1>
          <p className="text-gray-600">
            Position: {positionName}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Details */}
          <div className="lg:col-span-2">
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Review the applicant's information and responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Applicant Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.userProfile?.fullName || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Grade</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.userProfile?.grade || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Student Number</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.userProfile?.studentNumber || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Application Responses */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Application Responses</h3>
                  {application.answers && Object.keys(application.answers).length > 0 ? (
                    Object.entries(application.answers).map(([key, answer], index) => (
                      <div key={key} className="mb-6 p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Question {index + 1}</h4>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-800">{answer as string}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No responses found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grading Panel */}
          <div className="space-y-6">
            {/* Review Status */}
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Review Status</Label>
                    <Select value={reviewStatus} onValueChange={(value: 'for_interview' | 'unsuccessful' | 'pending') => setReviewStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="for_interview">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            For Interview
                          </div>
                        </SelectItem>
                        <SelectItem value="unsuccessful">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Unsuccessful
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={generateApplicationPDF}
                    variant="outline"
                    className="w-full"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Application PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Grading Section */}
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Grading</CardTitle>
                <CardDescription>
                  Assign scores and provide feedback for each category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={`question-${question.id}`}>{question.text} (Max: {question.maxScore})</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        id={`question-${question.id}`}
                        className="w-20 px-3 py-2 border rounded-md"
                        min="0"
                        max={question.maxScore}
                        value={questionGrades.find(grade => grade.questionId === question.id)?.score || ''}
                        onChange={(e) => {
                          const score = Math.max(0, Math.min(question.maxScore, Number(e.target.value)));
                          setQuestionGrades(prev => {
                            const existingGradeIndex = prev.findIndex(grade => grade.questionId === question.id);
                            if (existingGradeIndex > -1) {
                              const updatedGrades = [...prev];
                              updatedGrades[existingGradeIndex] = { ...updatedGrades[existingGradeIndex], score: score };
                              return updatedGrades;
                            } else {
                              return [...prev, { questionId: question.id, score: score }];
                            }
                          });
                        }}
                      />
                      <Star className="h-5 w-5 text-gray-500" />
                    </div>
                    <Textarea
                      placeholder="Feedback (optional)"
                      value={questionGrades.find(grade => grade.questionId === question.id)?.feedback || ''}
                      onChange={(e) => {
                        const feedback = e.target.value;
                        setQuestionGrades(prev => {
                          const existingGradeIndex = prev.findIndex(grade => grade.questionId === question.id);
                          if (existingGradeIndex > -1) {
                            const updatedGrades = [...prev];
                            updatedGrades[existingGradeIndex] = { ...updatedGrades[existingGradeIndex], feedback: feedback };
                            return updatedGrades;
                          } else {
                            return [...prev, { questionId: question.id, score: 0, feedback: feedback }];
                          }
                        });
                      }}
                    />
                  </div>
                ))}

                <Separator />

                <div>
                  <Label htmlFor="overall-feedback">Overall Feedback</Label>
                  <Textarea
                    id="overall-feedback"
                    placeholder="Enter overall feedback for the applicant"
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Grades & Status'}
              </Button>
              
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationGrader;
