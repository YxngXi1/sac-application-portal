import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Save, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveApplicationProgress } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';

interface PositionQuestionsProps {
  position: string;
  answers: Record<string, string>;
  uploadedFiles: Record<string, File[]>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onFileChange: (questionId: string, files: File[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSave: () => Promise<void>;
}

interface Question {
  id: string;
  question: string;
  type: 'text' | 'file';
  subtext?: string;
}

const getQuestions = (position: string): Question[] => {
  switch (position) {
    case 'Secretary':
      return [
        { id: 'secretary_1', question: 'Share an example of a time when you had to manage multiple commitments or deadlines. How did you organize yourself, and what tools or strategies did you use to stay on track?', type: 'text' },
        { id: 'secretary_2', question: 'What is one strength you have that you think will help you be a great secretary? Give a brief example of how you\'ve used that strength in the past.', type: 'text' },
        { id: 'secretary_3', question: 'We want students to attend all SAC meetings. However, sometimes this does not happen. How can you help to keep members on track and what do you think is an acceptable way to provide consequences for absent members?', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    case 'Treasurer':
      return [
        { id: 'treasurer_1', question: 'Describe a time when you managed money or helped organize a budget, even if it was for something small like a club, a fundraiser, or a family project. How did you keep track of what was coming in and going out?', type: 'text' },
        { id: 'treasurer_2', question: 'Imagine you are managing a budget for a school event, but the cost of something important is more than you expected. In a short paragraph, explain how you would handle the situation to make sure the event still happens without overspending.', type: 'text' },
        { id: 'treasurer_3', question: 'Create a spreadsheet document that could be used for an event by members of the council to track finances. Share this document with 909957@pdsb.net AND drop the link into the box below and title it "your name, treasurer applicant"', type: 'text' },
        { id: 'treasurer_4', question: 'In April 2025, SAC released its first-ever Budget Transparency Report on the SAC website. What improvements would you make to this document, and how would you increase student engagement with it to strengthen SAC\'s financial transparency efforts?', type: 'text' },
        { id: 'treasurer_5', question: 'SAC is hoping to find a treasurer that can not only complete all expected tasks but also help improve our financial processes including club funding. Give us some ideas on how we could utilize technology that SAC already has, or come up with a new solution to help streamline the club funding process.', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    case 'Community Outreach':
      return [
        { id: 'outreach_1', question: 'Describe any volunteer work or community service activities you have participated in. What did you enjoy about these experiences?', type: 'text' },
        { id: 'outreach_2', question: 'What was your favourite SAC event this year that heavily involved input from the Community Outreach executive?', type: 'text' },
        { id: 'outreach_3', question: 'SAC runs over 10 major events annually—choose one past event where you believe a local community partnership could have added value. What partnership would you have pursued, and how would it have enhanced the event?', type: 'text' },
        { id: 'outreach_4', question: 'Over the years, John Fraser SAC has worked with several organizations, both locally and nationally. With all these organizations, why is it important to measure the success of these partnerships, and how would you evaluate whether an organization is worth partnering with again in the future?', type: 'text' },
        { id: 'outreach_5', question: 'What is one creative idea you have for a community outreach project that could make a positive impact at John Fraser or in the surrounding community?', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    case 'Athletics Liaison':
      return [
        { id: 'athletics_1', question: 'Being an athletics liaison requires knowledge of the athletics programs here at Fraser. What experience do you have with athletics at Fraser? This includes taking phys-ed classes, being a part of sports teams, and/or being on the Fraser Athletics Council (FAC).', type: 'text' },
        { id: 'athletics_2', question: 'Being the Athletics Liaison involves liaison between both FAC and SAC. Explain a time where you led or were part of a sports-related event, either at school or outside. Clearly detail your role, and how you contributed to the success of your event.', type: 'text' },
        { id: 'athletics_3', question: 'As the Athletics Liaison, you\'ll need to communicate between two councils. Describe a time when you successfully helped different groups work together toward a common goal.', type: 'text' },
        { id: 'athletics_4', question: 'Based on your personal perspective, how would you describe the current dynamic between FAC and SAC? What do you think is working well, what could be improved, and how would you work to improve the relationship between the councils?', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    case 'Promotions Officer':
      return [
        { 
          id: 'promotions_1', 
          question: 'For the position of the Promotions Officer, there is no written application. Instead, a folder containing all the raw clips from our Charity Week Assembly opening video is attached below. Your task is to create a unique reel or hype video using these clips. You can draw inspiration from the original opening video, but you may not copy it directly. We encourage you that your video clips must be unique and have your own creative take. Try your best to use as many clips in this Google Drive folder as possible in your video.', 
          type: 'text',
          subtext: 'Reference video: https://www.youtube.com/watch?v=w9lzT4P0MtQ\nClips for your video: https://drive.google.com/drive/folders/1qZx2OVl4SdZVbdQwLjxQWHJmdVLY3XPP\nNeed help creating a folder: https://docs.google.com/document/d/1Gdt7NefO6nEWTbYdgPxtyv0LpnfD5reM_99acyZPc4I/edit?tab=t.0'
        },
        { id: 'promotions_2', question: 'Along with the Charity Week Assembly opening video, design an engaging poster that will be posted around the school for Charity Week itself. Again, you may draw inspiration from SAC\'s original post, but you may not copy it directly. Please submit the link to your Google Drive folder with the promotional video and poster below.', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    case 'Photography Exec':
      return [
        { id: 'photo_1', question: 'Please create a Google Drive folder that showcases 5 images and videos that you have taken that best showcase your photography abilities. Share it with 909957@pdsb.net and share the link to the folder in the box below. Please note applicants who have submitted inaccessible folders or folders with fewer than 5 images/videos will not be considered.', type: 'text' },
        { id: 'photo_2', question: 'How would you contribute creatively to SAC\'s branding through photography on social media and promotions?', type: 'text' },
        { id: 'photo_3', question: 'Suppose you are selecting photos to post after an SAC event. What is your process for organizing, selecting, and editing photos after the event?', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    case 'Technology Executive':
      return [
        { id: 'tech_1', question: 'A major role of the Technology Executive for the 2025/2026 is to continue the current success of SAC\'s 21st century modern technology, such as systems like Fraser Tickets, FraserPay, FraserVotes, and our brand-new coded website. What experience do you have with platforms like Google Firebase, Vercel, other programming languages, or any web development tools that could support SAC\'s technical needs?', type: 'text' },
        { id: 'tech_2', question: 'Share a link to a portfolio, GitHub repo, or any digital project demonstrating your technical skills and problem-solving. Briefly explain its purpose and impact. Note: For a tech exec role, programming isn\'t required—we want to see your creativity and how you\'d tackle SAC\'s challenges.', type: 'text' },
        { id: 'tech_3', question: 'This year at SAC, we\'ve driven innovation and creativity with platforms like FraserPay Digital Wallet, FraserVotes, and the SAC Application portal. What tool, platform, or system would you build or improve for SAC? This can be an enhancement to an existing system or a completely new platform. How would you ensure student privacy is prioritized during deployment?', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    case 'Arts Liaison':
      return [
        { id: 'arts_1', question: 'As the Arts Liaison, how will you ensure that all Art clubs (ie. Visual Arts Club, Studio 119, Fraser Dance Crew, Photography club, etc) are promoted equally throughout the school-year?', type: 'text' },
        { id: 'arts_2', question: 'What plans do you have that will maintain effective communication between the executives and supervisors of both SAC and Arts Council? Explain.', type: 'text' },
        { id: 'arts_3', question: 'What specific time-management strategies do you practice that will help you balance the business of being an Arts Liaison?', type: 'text' },
        { id: 'arts_4', question: 'From your personal perspective, how would you describe the current dynamic between the Arts Council and SAC? What do you think is working well, what could be improved, and how would you personally work to improve the relationship between the two councils?', type: 'text' },
        { id: 'commitments', question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.', type: 'text' }
      ];
    default:
      return [];
  }
};

const PositionQuestions: React.FC<PositionQuestionsProps> = ({
  position,
  answers,
  uploadedFiles,
  onAnswerChange,
  onFileChange,
  onNext,
  onBack,
  onSave
}) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const questions = getQuestions(position);

  // Auto-save function with debouncing
  const autoSave = async () => {
    if (!user) return;
    
    try {
      await saveApplicationProgress(user.uid, {
        position,
        answers,
        progress: calculateProgress(),
        userProfile: {
          fullName: userProfile?.fullName || '',
          studentNumber: userProfile?.studentNumber || '',
          grade: userProfile?.grade || '',
          studentType: userProfile?.studentType || 'none',
        }
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Debounced auto-save whenever answers change
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000); // Auto-save after 1 second of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers, position, user, userProfile]);

  const calculateProgress = () => {
    const totalQuestions = questions.length + 1; // +1 for SAC connections question
    const answeredQuestions = Object.keys(answers).length;
    return Math.min(20 + (answeredQuestions / totalQuestions) * 70, 90);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    onAnswerChange(questionId, answer);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      toast({
        title: "Progress Saved",
        description: "Your application progress has been saved.",
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isComplete = () => {
    const requiredAnswers = questions.every(q => answers[q.id]?.trim());
    const sacConnectionsAnswer = answers['sac_connections']?.trim();
    return requiredAnswers && sacConnectionsAnswer !== undefined;
  };

  const handleNext = async () => {
    // Ensure final save before proceeding
    await autoSave();
    onNext();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {position} Application
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Please answer all questions thoughtfully. Your responses will help us understand your qualifications and interest in this position.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Question {index + 1}
                </CardTitle>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {question.question}
                </p>
                {question.subtext && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 space-y-1">
                      {question.subtext.split('\n').map((line, idx) => (
                        <div key={idx}>
                          {line.includes('http') ? (
                            <>
                              {line.split(': ')[0]}:{' '}
                              <a 
                                href={line.split(': ')[1]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {line.split(': ')[1]}
                              </a>
                            </>
                          ) : (
                            line
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your response here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="min-h-[120px] text-sm sm:text-base"
                  required
                />
              </CardContent>
            </Card>
          ))}

          {/* SAC Connections Question */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Question {questions.length + 1}
              </CardTitle>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                As part of our efforts to make SAC applications a fair process, we'd like you to disclose if you have a relative, or a friend that is currently a SAC executive. If so, please add their name in the box below.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any SAC executive connections here, or write 'None' if you have no connections..."
                value={answers['sac_connections'] || ''}
                onChange={(e) => handleAnswerChange('sac_connections', e.target.value)}
                className="min-h-[80px] text-sm sm:text-base"
                required
              />
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex-1 sm:flex-none">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              variant="outline"
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Progress'}
            </Button>
          </div>
          
          <Button 
            onClick={handleNext}
            disabled={!isComplete()}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
          >
            Continue to Review
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Progress automatically saved • {Math.round(calculateProgress())}% complete
        </div>
      </div>
    </div>
  );
};

export default PositionQuestions;
