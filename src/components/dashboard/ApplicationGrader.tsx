import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Star, User, GraduationCap, Hash, BookOpen, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ApplicationData, saveApplicationGrades, getApplicationGrades, getAllApplicationsByPosition } from '@/services/applicationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ExecutiveGrades from './ExecutiveGrades';

interface ApplicationGraderProps {
  application: ApplicationData;
  positionName: string;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  answer: string;
  score: number;
  maxScore: number;
}

// Position-specific questions mapping
const POSITION_QUESTIONS: Record<string, string[]> = {
  'Secretary': [
    'Why are you interested in the Secretary position?',
    'How would you handle organizing and managing SAC communications?',
    'Describe your experience with administrative tasks and organization.',
    'How would you ensure meeting notes are accurate and comprehensive?'
  ],
  'Treasurer': [
    'Why are you interested in the Treasurer position?',
    'How would you handle SAC finances and budget management?',
    'Describe your experience with money management or financial responsibility.',
    'How would you track and report financial activities?'
  ],
  'Community Outreach': [
    'Why are you interested in the Community Outreach position?',
    'How would you coordinate with nonprofits and community organizations?',
    'Describe a time you organized or participated in community service.',
    'How would you promote community involvement among students?'
  ],
  'Athletics Liaison': [
    'Why are you interested in the Athletics Liaison position?',
    'How would you coordinate sports events and activities?',
    'Describe your experience with athletics or sports coordination.',
    'How would you bridge the gap between SAC and the Athletics Council?'
  ],
  'Promotions Officer': [
    'Why are you interested in the Promotions Officer position?',
    'How would you manage SAC social media and promotional content?',
    'Describe your experience with design, marketing, or social media.',
    'How would you increase student engagement through promotions?'
  ],
  'Photography Exec': [
    'Why are you interested in the Photography Exec position?',
    'How would you coordinate sports events and activities?',
    'Describe your experience with photography or videography.',
    'How would you manage and organize the SAC media library?'
  ]
};

const ApplicationGrader: React.FC<ApplicationGraderProps> = ({
  application,
  positionName,
  onBack
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [overallImpression, setOverallImpression] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [allApplications, setAllApplications] = useState<ApplicationData[]>([]);
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [applicationGrades, setApplicationGrades] = useState<any>(null);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    const loadApplicationsAndGrades = async () => {
      try {
        // Load all applications for this position
        const positionApplications = await getAllApplicationsByPosition(positionName);
        const submittedApps = positionApplications.filter(app => app.status === 'submitted');
        setAllApplications(submittedApps);
        
        // Find current application index
        const currentIndex = submittedApps.findIndex(app => app.id === application.id);
        setCurrentApplicationIndex(currentIndex);

        // Load existing grades for current executive
        const existingGrades = await getApplicationGrades(application.id);
        setApplicationGrades(existingGrades);
        const myGrades = existingGrades?.executiveGrades?.find(eg => eg.executiveId === userProfile?.uid);
        
        // Get position-specific questions
        const positionQuestions = POSITION_QUESTIONS[positionName] || [
          'Question 1', 'Question 2', 'Question 3', 'Question 4'
        ];
        
        // Convert application answers to questions format
        const questionsList: Question[] = [];
        const answersArray = Object.entries(application.answers || {});
        
        positionQuestions.forEach((questionText, index) => {
          const answerEntry = answersArray[index];
          const questionKey = answerEntry ? answerEntry[0] : `question_${index + 1}`;
          const answerText = answerEntry ? answerEntry[1] : 'No response provided';
          
          const existingGrade = myGrades?.grades.find(g => g.questionId === questionKey);
          
          questionsList.push({
            id: questionKey,
            question: questionText,
            answer: answerText,
            score: existingGrade?.score || 0,
            maxScore: 10
          });
        });

        setQuestions(questionsList);
        
        // Load overall impression score and feedback
        const overallImpressionGrade = myGrades?.grades.find(g => g.questionId === 'overall_impression');
        setOverallImpression(overallImpressionGrade?.score || 0);
        setFeedback(myGrades?.feedback || '');
        
        // Calculate average score from all executives
        if (existingGrades?.executiveGrades && existingGrades.executiveGrades.length > 0) {
          setAverageScore(existingGrades.averageScore);
        } else {
          setAverageScore(0);
        }
      } catch (error) {
        console.error('Error loading grades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplicationsAndGrades();
  }, [application.id, application.answers, positionName, userProfile?.uid]);

  const updateScore = (questionId: string, newScore: number) => {
    // Allow half points (e.g., 5.5)
    const roundedScore = Math.round(newScore * 2) / 2;
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, score: Math.max(0, Math.min(q.maxScore, roundedScore)) }
          : q
      )
    );
  };

  const updateOverallImpression = (newScore: number) => {
    // Allow half points (e.g., 5.5)
    const roundedScore = Math.round(newScore * 2) / 2;
    setOverallImpression(Math.max(0, Math.min(10, roundedScore)));
  };

  const myScore = questions.length > 0 ? 
    (questions.reduce((sum, q) => sum + q.score, 0) + overallImpression) / (questions.length + 1) : 0;

  const handleSave = async () => {
    if (!userProfile?.uid) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const gradesData = {
        applicationId: application.id,
        executiveId: userProfile.uid,
        executiveName: userProfile.fullName || 'Unknown Executive',
        grades: [
          ...questions.map(q => ({
            questionId: q.id,
            score: q.score,
            maxScore: q.maxScore,
            feedback: ''
          })),
          {
            questionId: 'overall_impression',
            score: overallImpression,
            maxScore: 10,
            feedback: ''
          }
        ],
        totalScore: myScore,
        maxTotalScore: 10,
        gradedAt: new Date(),
        feedback: feedback
      };

      await saveApplicationGrades(gradesData);
      
      // Reload grades to get updated data
      const updatedGrades = await getApplicationGrades(application.id);
      setApplicationGrades(updatedGrades);
      if (updatedGrades) {
        setAverageScore(updatedGrades.averageScore);
      }
      
      toast({
        title: "Grades Saved",
        description: "Your grades and feedback have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving grades:', error);
      toast({
        title: "Error",
        description: "Failed to save grades. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveFeedback = async () => {
    await handleSave(); // Save feedback along with grades
  };

  const navigateToApplication = (direction: 'next' | 'prev') => {
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentApplicationIndex + 1) % allApplications.length;
    } else {
      newIndex = currentApplicationIndex === 0 ? allApplications.length - 1 : currentApplicationIndex - 1;
    }
    
    const nextApp = allApplications[newIndex];
    if (nextApp) {
      // Navigate to the new application - this would trigger a re-render with new application data
      window.location.hash = `#grade-${nextApp.id}`;
      window.location.reload(); // Simple approach - you might want to implement this more elegantly
    }
  };

  const getNextUngradedApplication = async () => {
    if (!userProfile?.uid) return null;
    
    for (let i = 1; i < allApplications.length; i++) {
      const nextIndex = (currentApplicationIndex + i) % allApplications.length;
      const nextApp = allApplications[nextIndex];
      
      try {
        const grades = await getApplicationGrades(nextApp.id);
        const hasMyGrades = grades?.executiveGrades?.some(eg => eg.executiveId === userProfile.uid);
        
        if (!hasMyGrades) {
          return { app: nextApp, index: nextIndex };
        }
      } catch (error) {
        console.error('Error checking grades for application:', nextApp.id);
      }
    }
    
    return null;
  };

  const navigateToNextUngraded = async () => {
    const nextUngraded = await getNextUngradedApplication();
    if (nextUngraded) {
      window.location.hash = `#grade-${nextUngraded.app.id}`;
      window.location.reload();
    } else {
      toast({
        title: "All Done!",
        description: "You have graded all submitted applications for this position.",
      });
    }
  };

  const getStudentTypeDisplay = (studentType: string) => {
    switch (studentType) {
      case 'AP':
        return 'Advanced Placement (AP)';
      case 'SHSM':
        return 'Specialist High Skills Major (SHSM)';
      case 'none':
        return 'None';
      default:
        return 'Not specified';
    }
  };

  const renderPhotographyPortfolio = (answer: string) => {
    // Check if the answer contains Firebase Storage URLs
    const urls = answer.split(', ').filter(url => url.includes('firebasestorage.googleapis.com'));
    
    if (urls.length === 0) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {answer}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
            Portfolio submitted with {urls.length} file(s)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urls.map((url, index) => (
              <div key={index} className="border rounded-lg overflow-hidden bg-white">
                <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
                  <img
                    src={url}
                    alt={`Portfolio item ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // If image fails to load, show a file icon
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center h-full text-gray-500">
                            <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="text-xs">File ${index + 1}</span>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
                <div className="p-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    <ImageIcon className="h-3 w-3" />
                    View full size
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
                
                {/* Navigation Controls */}
                <div className="flex items-center space-x-2 ml-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateToApplication('prev')}
                    disabled={allApplications.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600 px-3">
                    {currentApplicationIndex + 1} of {allApplications.length}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateToApplication('next')}
                    disabled={allApplications.length <= 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={navigateToNextUngraded}
                    className="ml-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Next Ungraded →
                  </Button>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Grading Application
              </h1>
              
              {/* Applicant Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Applicant</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.userProfile?.fullName || 'Unknown'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Grade</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.userProfile?.grade || 'Not provided'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Hash className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Student Number</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.userProfile?.studentNumber || 'Not provided'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Program</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getStudentTypeDisplay(application.userProfile?.studentType || 'none')}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600">
                Position: {positionName}
              </p>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{myScore.toFixed(1)}/10</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 mb-2">
                Your Score
              </Badge>
              
              {averageScore > 0 && (
                <div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-gray-600" />
                    <span className="text-lg font-semibold">{averageScore.toFixed(1)}/10</span>
                  </div>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700">
                    Team Average
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions and Answers */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Application Responses</CardTitle>
                <CardDescription>
                  Review the applicant's answers below
                </CardDescription>
              </CardHeader>
            </Card>

            {questions.length === 0 ? (
              <Card className="border shadow-sm bg-white">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No responses found for this application.</p>
                </CardContent>
              </Card>
            ) : (
              questions.map((question, index) => (
                <Card key={question.id} className="border shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Question {index + 1}
                    </CardTitle>
                    <CardDescription>
                      {question.question}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {positionName === 'Photography Exec' && question.id === 'photo_1' ? 
                      renderPhotographyPortfolio(question.answer) :
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {question.answer}
                        </p>
                      </div>
                    }
                  </CardContent>
                </Card>
              ))
            )}
            
            {/* Executive Grades Section */}
            <ExecutiveGrades
              applicationGrades={applicationGrades}
              currentExecutiveId={userProfile?.uid || ''}
              feedback={feedback}
              onFeedbackChange={setFeedback}
              onSaveFeedback={handleSaveFeedback}
            />
          </div>

          {/* Scoring Panel */}
          <div className="space-y-6">
            <Card className="sticky top-8 border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Score Questions</CardTitle>
                <CardDescription>
                  Rate each response out of 10 points (whole or half numbers)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={`score-${question.id}`}>
                      Question {index + 1} Score
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`score-${question.id}`}
                        type="number"
                        min="0"
                        max={question.maxScore}
                        step="0.5"
                        value={question.score}
                        onChange={(e) => updateScore(question.id, parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">
                        / {question.maxScore}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Overall Impression */}
                <div className="border-t pt-4 space-y-2">
                  <Label htmlFor="overall-impression">
                    Overall Impression
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="overall-impression"
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={overallImpression}
                      onChange={(e) => updateOverallImpression(parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">
                      / 10
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Your Score</Label>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-blue-600" />
                      <span className="text-xl font-bold">{myScore.toFixed(1)}/10</span>
                    </div>
                  </div>
                  
                  {averageScore > 0 && (
                    <div className="flex justify-between items-center mb-4 p-2 bg-gray-50 rounded">
                      <Label className="text-sm font-medium text-gray-600">Team Average</Label>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-gray-600" />
                        <span className="text-lg font-semibold">{averageScore.toFixed(1)}/10</span>
                      </div>
                    </div>
                  )}
                  
                  <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 mb-3">
                    <Save className="h-4 w-4 mr-2" />
                    Save My Scores
                  </Button>
                  
                  <Button 
                    onClick={navigateToNextUngraded} 
                    variant="outline" 
                    className="w-full"
                  >
                    Next Ungraded →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationGrader;
