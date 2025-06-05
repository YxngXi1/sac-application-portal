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
  onNavigateToApplication?: (application: ApplicationData) => void;
}

// Position-specific questions with their corresponding answer keys - updated to match application questions
const POSITION_QUESTIONS: Record<string, Array<{question: string, key: string}>> = {
  'Secretary': [
    { question: 'Share an example of a time when you had to manage multiple commitments or deadlines. How did you organize yourself, and what tools or strategies did you use to stay on track?', key: 'secretary_1' },
    { question: 'What is one strength you have that you think will help you be a great secretary? Give a brief example of how you\'ve used that strength in the past.', key: 'secretary_2' },
    { question: 'We want students to attend all SAC meetings. However, sometimes this does not happen. How can you help to keep members on track and what do you think is an acceptable way to provide consequences for absent members?', key: 'secretary_3' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ],
  'Treasurer': [
    { question: 'Describe a time when you managed money or helped organize a budget, even if it was for something small like a club, a fundraiser, or a family project. How did you keep track of what was coming in and going out?', key: 'treasurer_1' },
    { question: 'Imagine you are managing a budget for a school event, but the cost of something important is more than you expected. In a short paragraph, explain how you would handle the situation to make sure the event still happens without overspending.', key: 'treasurer_2' },
    { question: 'Create a spreadsheet document that could be used for an event by members of the council to track finances. Share this document with 909957@pdsb.net AND drop the link into the box below and title it "your name, treasurer applicant"', key: 'treasurer_3' },
    { question: 'In April 2025, SAC released its first-ever Budget Transparency Report on the SAC website. What improvements would you make to this document, and how would you increase student engagement with it to strengthen SAC\'s financial transparency efforts?', key: 'treasurer_4' },
    { question: 'SAC is hoping to find a treasurer that can not only complete all expected tasks but also help improve our financial processes including club funding. Give us some ideas on how we could utilize technology that SAC already has, or come up with a new solution to help streamline the club funding process.', key: 'treasurer_5' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ],
  'Community Outreach': [
    { question: 'Describe any volunteer work or community service activities you have participated in. What did you enjoy about these experiences?', key: 'outreach_1' },
    { question: 'What was your favourite SAC event this year that heavily involved input from the Community Outreach executive?', key: 'outreach_2' },
    { question: 'SAC runs over 10 major events annually—choose one past event where you believe a local community partnership could have added value. What partnership would you have pursued, and how would it have enhanced the event?', key: 'outreach_3' },
    { question: 'Over the years, John Fraser SAC has worked with several organizations, both locally and nationally. With all these organizations, why is it important to measure the success of these partnerships, and how would you evaluate whether an organization is worth partnering with again in the future?', key: 'outreach_4' },
    { question: 'What is one creative idea you have for a community outreach project that could make a positive impact at John Fraser or in the surrounding community?', key: 'outreach_5' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ],
  'Athletics Liaison': [
    { question: 'Being an athletics liaison requires knowledge of the athletics programs here at Fraser. What experience do you have with athletics at Fraser? This includes taking phys-ed classes, being a part of sports teams, and/or being on the Fraser Athletics Council (FAC).', key: 'athletics_1' },
    { question: 'Being the Athletics Liaison involves liaison between both FAC and SAC. Explain a time where you led or were part of a sports-related event, either at school or outside. Clearly detail your role, and how you contributed to the success of your event.', key: 'athletics_2' },
    { question: 'As the Athletics Liaison, you\'ll need to communicate between two councils. Describe a time when you successfully helped different groups work together toward a common goal.', key: 'athletics_3' },
    { question: 'Based on your personal perspective, how would you describe the current dynamic between FAC and SAC? What do you think is working well, what could be improved, and how would you work to improve the relationship between the councils?', key: 'athletics_4' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ],
  'Promotions Officer': [
    { question: 'For the position of the Promotions Officer, there is no written application. Instead, a folder containing all the raw clips from our Charity Week Assembly opening video is attached below. Your task is to create a unique reel or hype video using these clips. You can draw inspiration from the original opening video, but you may not copy it directly. We encourage you that your video clips must be unique and have your own creative take. Try your best to use as many clips in this Google Drive folder as possible in your video. You may use other Charity Week clips that you have or you may film new clips suitable for the video.', key: 'promotions_1' },
    { question: 'Along with the Charity Week Assembly opening video, design an engaging poster that will be posted around the school for Charity Week itself. Again, you may draw inspiration from SAC\'s original post, but you may not copy it directly. Please submit the link to your Google Drive folder with the promotional video and poster below.', key: 'promotions_2' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ],
  'Photography Exec': [
    { question: 'Please create a Google Drive folder that showcases 5 images and videos that you have taken that best showcase your photography abilities. Share it with 909957@pdsb.net and share the link to the folder in the box below. Please note applicants who have submitted inaccessible folders or folders with fewer than 5 images/videos will not be considered.', key: 'photo_1' },
    { question: 'How would you contribute creatively to SAC\'s branding through photography on social media and promotions?', key: 'photo_2' },
    { question: 'Suppose you are selecting photos to post after an SAC event. What is your process for organizing, selecting, and editing photos after the event?', key: 'photo_3' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ],
  'Technology Executive': [
    { question: 'A major role of the Technology Executive for the 2025/2026 is to continue the current success of SAC\'s 21st century modern technology, such as systems like Fraser Tickets, FraserPay, FraserVotes, and our brand-new coded website. What experience do you have with platforms like Google Firebase, Vercel, other programming languages, or any web development tools that could support SAC\'s technical needs?', key: 'tech_1' },
    { question: 'Share a link to a portfolio, GitHub repo, or any digital project demonstrating your technical skills and problem-solving. Briefly explain its purpose and impact. Note: For a tech exec role, programming isn\'t required—we want to see your creativity and how you\'d tackle SAC\'s challenges.', key: 'tech_2' },
    { question: 'This year at SAC, we\'ve driven innovation and creativity with platforms like FraserPay Digital Wallet, FraserVotes, and the SAC Application portal. What tool, platform, or system would you build or improve for SAC? This can be an enhancement to an existing system or a completely new platform. How would you ensure student privacy is prioritized during deployment?', key: 'tech_3' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ],
  'Arts Liaison': [
    { question: 'As the Arts Liaison, how will you ensure that all Art clubs (ie. Visual Arts Club, Studio 119, Fraser Dance Crew, Photography club, etc) are promoted equally throughout the school-year?', key: 'arts_1' },
    { question: 'What plans do you have that will maintain effective communication between the executives and supervisors of both SAC and Arts Council? Explain.', key: 'arts_2' },
    { question: 'What specific time-management strategies do you practice that will help you balance the business of being an Arts Liaison?', key: 'arts_3' },
    { question: 'From your personal perspective, how would you describe the current dynamic between the Arts Council and SAC? What do you think is working well, what could be improved, and how would you personally work to improve the relationship between the two councils.', key: 'arts_4' },
    { question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', key: 'commitments' },
    { question: 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.', key: 'sac_connections' }
  ]
};

const ApplicationGrader: React.FC<ApplicationGraderProps> = ({
  application,
  positionName,
  onBack,
  onNavigateToApplication
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
        
        // Get position-specific questions with proper mapping
        const positionQuestions = POSITION_QUESTIONS[positionName] || [
          { question: 'Question 1', key: 'question_1' },
          { question: 'Question 2', key: 'question_2' },
          { question: 'Question 3', key: 'question_3' },
          { question: 'Question 4', key: 'question_4' }
        ];
        
        // Convert application answers to questions format with proper key mapping
        const questionsList: Question[] = [];
        
        positionQuestions.forEach((questionData, index) => {
          const answerText = application.answers?.[questionData.key] || 'No response provided';
          const existingGrade = myGrades?.grades.find(g => g.questionId === questionData.key);
          
          questionsList.push({
            id: questionData.key,
            question: questionData.question,
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
    if (nextApp && onNavigateToApplication) {
      onNavigateToApplication(nextApp);
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
    if (nextUngraded && onNavigateToApplication) {
      onNavigateToApplication(nextUngraded.app);
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

  const getQuestionText = (questionId: string): string => {
    const questionMappings: Record<string, string> = {
      // Universal questions
      'commitments': 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.',
      'sac_connections': 'As part of our efforts to make SAC applications a fair process, we\'d like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.',
      
      // Secretary questions
      'secretary_1': 'Share an example of a time when you had to manage multiple commitments or deadlines. How did you organize yourself, and what tools or strategies did you use to stay on track?',
      'secretary_2': 'What is one strength you have that you think will help you be a great secretary? Give a brief example of how you\'ve used that strength in the past.',
      'secretary_3': 'We want students to attend all SAC meetings. However, sometimes this does not happen. How can you help to keep members on track and what do you think is an acceptable way to provide consequences for absent members?',
      
      // Treasurer questions
      'treasurer_1': 'Describe a time when you managed money or helped organize a budget, even if it was for something small like a club, a fundraiser, or a family project. How did you keep track of what was coming in and going out?',
      'treasurer_2': 'Imagine you are managing a budget for a school event, but the cost of something important is more than you expected. In a short paragraph, explain how you would handle the situation to make sure the event still happens without overspending.',
      'treasurer_3': 'Create a spreadsheet document that could be used for an event by members of the council to track finances. Share this document with 909957@pdsb.net AND drop the link into the box below and title it "your name, treasurer applicant"',
      'treasurer_4': 'In April 2025, SAC released its first-ever Budget Transparency Report on the SAC website. What improvements would you make to this document, and how would you increase student engagement with it to strengthen SAC\'s financial transparency efforts?',
      'treasurer_5': 'SAC is hoping to find a treasurer that can not only complete all expected tasks but also help improve our financial processes including club funding. Give us some ideas on how we could utilize technology that SAC already has, or come up with a new solution to help streamline the club funding process.',
      
      // Community Outreach questions
      'outreach_1': 'Describe any volunteer work or community service activities you have participated in. What did you enjoy about these experiences?',
      'outreach_2': 'What was your favourite SAC event this year that heavily involved input from the Community Outreach executive?',
      'outreach_3': 'SAC runs over 10 major events annually—choose one past event where you believe a local community partnership could have added value. What partnership would you have pursued, and how would it have enhanced the event?',
      'outreach_4': 'Over the years, John Fraser SAC has worked with several organizations, both locally and nationally. With all these organizations, why is it important to measure the success of these partnerships, and how would you evaluate whether an organization is worth partnering with again in the future?',
      'outreach_5': 'What is one creative idea you have for a community outreach project that could make a positive impact at John Fraser or in the surrounding community?',
      
      // Athletics Liaison questions
      'athletics_1': 'Being an athletics liaison requires knowledge of the athletics programs here at Fraser. What experience do you have with athletics at Fraser? This includes taking phys-ed classes, being a part of sports teams, and/or being on the Fraser Athletics Council (FAC).',
      'athletics_2': 'Being the Athletics Liaison involves liaison between both FAC and SAC. Explain a time where you led or were part of a sports-related event, either at school or outside. Clearly detail your role, and how you contributed to the success of your event.',
      'athletics_3': 'As the Athletics Liaison, you\'ll need to communicate between two councils. Describe a time when you successfully helped different groups work together toward a common goal.',
      'athletics_4': 'Based on your personal perspective, how would you describe the current dynamic between FAC and SAC? What do you think is working well, what could be improved, and how would you work to improve the relationship between the councils?',
      
      // Promotions Officer questions
      'promotions_1': 'For the position of the Promotions Officer, there is no written application. Instead, a folder containing all the raw clips from our Charity Week Assembly opening video is attached below. Your task is to create a unique reel or hype video using these clips. You can draw inspiration from the original opening video, but you may not copy it directly. We encourage you that your video clips must be unique and have your own creative take. Try your best to use as many clips in this Google Drive folder as possible in your video. You may use other Charity Week clips that you have or you may film new clips suitable for the video.',
      'promotions_2': 'Along with the Charity Week Assembly opening video, design an engaging poster that will be posted around the school for Charity Week itself. Again, you may draw inspiration from SAC\'s original post, but you may not copy it directly. Please submit the link to your Google Drive folder with the promotional video and poster below.',
      
      // Photography Exec questions
      'photo_1': 'Please create a Google Drive folder that showcases 5 images and videos that you have taken that best showcase your photography abilities. Share it with 909957@pdsb.net and share the link to the folder in the box below. Please note applicants who have submitted inaccessible folders or folders with fewer than 5 images/videos will not be considered.',
      'photo_2': 'How would you contribute creatively to SAC\'s branding through photography on social media and promotions?',
      'photo_3': 'Suppose you are selecting photos to post after an SAC event. What is your process for organizing, selecting, and editing photos after the event?',
      
      // Technology Executive questions
      'tech_1': 'A major role of the Technology Executive for the 2025/2026 is to continue the current success of SAC\'s 21st century modern technology, such as systems like Fraser Tickets, FraserPay, FraserVotes, and our brand-new coded website. What experience do you have with platforms like Google Firebase, Vercel, other programming languages, or any web development tools that could support SAC\'s technical needs?',
      'tech_2': 'Share a link to a portfolio, GitHub repo, or any digital project demonstrating your technical skills and problem-solving. Briefly explain its purpose and impact. Note: For a tech exec role, programming isn\'t required—we want to see your creativity and how you\'d tackle SAC\'s challenges.',
      'tech_3': 'This year at SAC, we\'ve driven innovation and creativity with platforms like FraserPay Digital Wallet, FraserVotes, and the SAC Application portal. What tool, platform, or system would you build or improve for SAC? This can be an enhancement to an existing system or a completely new platform. How would you ensure student privacy is prioritized during deployment?',
      
      // Arts Liaison questions
      'arts_1': 'As the Arts Liaison, how will you ensure that all Art clubs (ie. Visual Arts Club, Studio 119, Fraser Dance Crew, Photography club, etc) are promoted equally throughout the school-year?',
      'arts_2': 'What plans do you have that will maintain effective communication between the executives and supervisors of both SAC and Arts Council? Explain.',
      'arts_3': 'What specific time-management strategies do you practice that will help you balance the business of being an Arts Liaison?',
      'arts_4': 'From your personal perspective, how would you describe the current dynamic between the Arts Council and SAC? What do you think is working well, what could be improved, and how would you personally work to improve the relationship between the two councils.'
    };

    return questionMappings[questionId] || questionId;
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
                      {getQuestionText(question.id)}
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
