import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Save, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  type: string;
  question: string;
  note?: string;
  requiredFiles?: number;
  referenceLink?: string;
  linkText?: string;
  secondaryLink?: string;
  secondaryLinkText?: string;
  tertiaryLink?: string;
  tertiaryLinkText?: string;
}

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
  const { toast } = useToast();

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getQuestions = (): Question[] => {
    // Universal question for all positions
    const universalQuestion: Question = {
      id: 'commitments',
      type: 'textarea',
      question: 'What other commitments do you plan to have next year? Include the club/council/extracurricular, your position and the estimated time per week.'
    };

    switch (position) {
      case 'Secretary':
        return [
          {
            id: 'secretary_1',
            type: 'textarea',
            question: 'Share an example of a time when you had to manage multiple commitments or deadlines. How did you organize yourself, and what tools or strategies did you use to stay on track?'
          },
          {
            id: 'secretary_2',
            type: 'textarea',
            question: 'What is one strength you have that you think will help you be a great secretary? Give a brief example of how you\'ve used that strength in the past.'
          },
          {
            id: 'secretary_3',
            type: 'textarea',
            question: 'We want students to attend all SAC meetings. However, sometimes this does not happen. How can you help to keep members on track and what do you think is an acceptable way to provide consequences for absent members?'
          },
          universalQuestion
        ];

      case 'Treasurer':
        return [
          {
            id: 'treasurer_1',
            type: 'textarea',
            question: 'Describe a time when you managed money or helped organize a budget, even if it was for something small like a club, a fundraiser, or a family project. How did you keep track of what was coming in and going out?'
          },
          {
            id: 'treasurer_2',
            type: 'textarea',
            question: 'Imagine you are managing a budget for a school event, but the cost of something important is more than you expected. In a short paragraph, explain how you would handle the situation to make sure the event still happens without overspending.'
          },
          {
            id: 'treasurer_3',
            type: 'textarea',
            question: 'Create a spreadsheet document that could be used for an event by members of the council to track finances. Share this document with 909957@pdsb.net and title it "your name, treasurer applicant"',
            note: 'Please confirm that you have shared the document with 909957@pdsb.net'
          },
          {
            id: 'treasurer_4',
            type: 'textarea',
            question: 'In April 2025, SAC released its first-ever Budget Transparency Report on the SAC website. What improvements would you make to this document, and how would you increase student engagement with it to strengthen SAC\'s financial transparency efforts?',
            referenceLink: 'https://www.johnfrasersac.com/JFSS_SAC_Transparency_Report.pdf',
            linkText: 'View Budget Transparency Report'
          },
          {
            id: 'treasurer_5',
            type: 'textarea',
            question: 'SAC is hoping to find a treasurer that can not only complete all expected tasks but also help improve our financial processes including club funding. Give us some ideas on how we could utilize technology that SAC already has, or come up with a new solution to help streamline the club funding process.'
          },
          universalQuestion
        ];

      case 'Community Outreach':
        return [
          {
            id: 'outreach_1',
            type: 'textarea',
            question: 'Describe any volunteer work or community service activities you have participated in. What did you enjoy about these experiences?'
          },
          {
            id: 'outreach_2',
            type: 'textarea',
            question: 'What was your favourite SAC event this year that heavily involved input from the Community Outreach executive?'
          },
          {
            id: 'outreach_3',
            type: 'textarea',
            question: 'SAC runs over 10 major events annually—choose one past event where you believe a local community partnership could have added value. What partnership would you have pursued, and how would it have enhanced the event?'
          },
          {
            id: 'outreach_4',
            type: 'textarea',
            question: 'Over the years, John Fraser SAC has worked with several organizations, both locally and nationally. With all these organizations, why is it important to measure the success of these partnerships, and how would you evaluate whether an organization is worth partnering with again in the future?'
          },
          {
            id: 'outreach_5',
            type: 'textarea',
            question: 'What is one creative idea you have for a community outreach project that could make a positive impact at John Fraser or in the surrounding community?'
          },
          universalQuestion
        ];

      case 'Athletics Liaison':
        return [
          {
            id: 'athletics_1',
            type: 'textarea',
            question: 'Being an athletics liaison requires knowledge of the athletics programs here at Fraser. What experience do you have with athletics at Fraser? This includes taking phys-ed classes, being a part of sports teams, and/or being on the Fraser Athletics Council (FAC).'
          },
          {
            id: 'athletics_2',
            type: 'textarea',
            question: 'Being the Athletics Liaison involves liaison between both FAC and SAC. Explain a time where you led or were part of a sports-related event, either at school or outside. Clearly detail your role, and how you contributed to the success of your event.'
          },
          {
            id: 'athletics_3',
            type: 'textarea',
            question: 'As the Athletics Liaison, you\'ll need to communicate between two councils. Describe a time when you successfully helped different groups work together toward a common goal.'
          },
          {
            id: 'athletics_4',
            type: 'textarea',
            question: 'Based on your personal perspective, how would you describe the current dynamic between FAC and SAC? What do you think is working well, what could be improved, and how would you work to improve the relationship between the councils?'
          },
          universalQuestion
        ];

      case 'Promotions Officer':
        return [
          {
            id: 'promotions_1',
            type: 'textarea',
            question: 'For the position of the Promotions Officer, there is no written application. Instead, you will be given access to a Google Drive folder containing all the raw clips from our Charity Week Assembly opening video. Your task is to create a unique reel or hype video using these clips. You can draw inspiration from the original opening video, but you may not copy it directly. We encourage you that your video clips must be unique and have your own creative take. Note that the quality of your video will not be assessed as the clips are heavy.',
            note: 'Please submit your video to the Google Drive folder and create a folder titled with your name and "Promotions Officer". Also share the file with 909957@pdsb.net. Please also share the link in this text box.',
            referenceLink: 'https://youtu.be/w9lzT4P0MtQ',
            linkText: 'View Reference Video',
            secondaryLink: 'https://drive.google.com/drive/folders/1qZx2OVl4SdZVbdQwLjxQWHJmdVLY3XPP?usp=sharing',
            secondaryLinkText: 'Clips for your video',
            tertiaryLink: 'https://drive.google.com/drive/folders/1eUBZnHcz-PZP1Hr1-uo90Xgld7wUgQ2x?usp=sharing',
            tertiaryLinkText: 'Google Drive Dropbox here'
          },
          {
            id: 'promotions_2',
            type: 'textarea',
            question: 'Along with the Charity Week Assembly opening video, design an engaging poster that will be posted around the school for Charity Week itself. Again, you may draw inspiration from SAC\'s original post, but you may not copy it directly.',
            note: 'Please submit your poster to the Google Drive folder and confirm completion in this text box.',
            referenceLink: 'https://drive.google.com/drive/folders/1eUBZnHcz-PZP1Hr1-uo90Xgld7wUgQ2x?usp=sharing',
            linkText: 'Google Drive Dropbox here'
          },
          universalQuestion
        ];

      case 'Photography Exec':
        return [
          {
            id: 'photo_1',
            type: 'file',
            question: 'Submit a portfolio of 5 images and videos that you have taken that best showcase your photography abilities.',
            note: 'Upload your best photography work (minimum 5 photos required)',
            requiredFiles: 5
          },
          {
            id: 'photo_2',
            type: 'textarea',
            question: 'How would you contribute creatively to SAC\'s branding through photography on social media and promotions?'
          },
          {
            id: 'photo_3',
            type: 'textarea',
            question: 'Suppose you are selecting photos to post after an SAC event. What is your process for organizing, selecting, and editing photos after the event?'
          },
          universalQuestion
        ];

      case 'Technology Executive':
        return [
          {
            id: 'tech_1',
            type: 'textarea',
            question: 'A major role of the Technology Executive for the 2025/2026 is to continue the current success of SAC\'s 21st century modern technology, such as systems like Fraser Tickets, FraserPay, FraserVotes, and our brand-new coded website. What experience do you have with platforms like Google Firebase, Vercel, other programming languages, or any web development tools that could support SAC\'s technical needs?'
          },
          {
            id: 'tech_2',
            type: 'textarea',
            question: 'Share a link to a portfolio, GitHub repo, or any digital project demonstrating your technical skills and problem-solving. Briefly explain its purpose and impact. Note: For a tech exec role, programming isn\'t required—we want to see your creativity and how you\'d tackle SAC\'s challenges.'
          },
          {
            id: 'tech_3',
            type: 'textarea',
            question: 'This year at SAC, we\'ve driven innovation and creativity with platforms like FraserPay Digital Wallet, FraserVotes, and the SAC Application portal. What tool, platform, or system would you build or improve for SAC? This can be an enhancement to an existing system or a completely new platform. How would you ensure student privacy is prioritized during deployment?'
          },
          universalQuestion
        ];

      case 'Arts Liaison':
        return [
          {
            id: 'arts_1',
            type: 'textarea',
            question: 'As the Arts Liaison, how will you ensure that all Art clubs (ie. Visual Arts Club, Studio 119, Fraser Dance Crew, Photography club, etc) are promoted equally throughout the school-year?'
          },
          {
            id: 'arts_2',
            type: 'textarea',
            question: 'What plans do you have that will maintain effective communication between the executives and supervisors of both SAC and Arts Council? Explain.'
          },
          {
            id: 'arts_3',
            type: 'textarea',
            question: 'What specific time-management strategies do you practice that will help you balance the business of being an Arts Liaison?'
          },
          {
            id: 'arts_4',
            type: 'textarea',
            question: 'From your personal perspective, how would you describe the current dynamic between the Arts Council and SAC? What do you think is working well, what could be improved, and how would you personally work to improve the relationship between the two councils.'
          },
          universalQuestion
        ];

      default:
        return [universalQuestion];
    }
  };

  const questions = getQuestions();

  const isQuestionComplete = (question: Question): boolean => {
    if (question.type === 'textarea') {
      return !!answers[question.id] && answers[question.id].trim().length > 0;
    } else if (question.type === 'file') {
      const files = uploadedFiles[question.id] || [];
      const requiredCount = question.requiredFiles || 1;
      return files.length >= requiredCount;
    }
    return false;
  };

  const isComplete = questions.every(q => isQuestionComplete(q));

  const getFileValidationMessage = (question: Question): string | null => {
    if (question.type !== 'file') return null;
    
    const files = uploadedFiles[question.id] || [];
    const requiredCount = question.requiredFiles || 1;
    
    if (files.length === 0) {
      return `Please upload ${requiredCount} file${requiredCount > 1 ? 's' : ''}`;
    } else if (files.length < requiredCount) {
      return `Please upload ${requiredCount - files.length} more file${requiredCount - files.length > 1 ? 's' : ''} (${files.length}/${requiredCount})`;
    }
    
    return null;
  };

  const handleFileInputChange = (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onFileChange(questionId, files);
    
    // Update answer to show file names
    if (files.length > 0) {
      onAnswerChange(questionId, files.map(f => f.name).join(', '));
    }
  };

  const handleSave = async () => {
    try {
      await onSave();
      toast({
        title: "Progress Saved",
        description: "Your application progress has been saved. We recommend saving a backup of these answers on another safe platform too.",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAndGoBack = async () => {
    try {
      await onSave();
      toast({
        title: "Progress Saved",
        description: "Your application progress has been saved.",
      });
      onBack();
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{position} Application</CardTitle>
            <p className="text-gray-600">Please answer all questions below. Your progress is automatically saved. We recommend saving a backup of these answers on another safe platform too.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => {
              const validationMessage = getFileValidationMessage(question);
              const isQuestionValid = isQuestionComplete(question);
              
              return (
                <div key={question.id} className="space-y-2">
                  <Label className="text-base font-medium">
                    {index + 1}. {question.question}
                  </Label>
                  {question.note && (
                    <p className="text-sm text-gray-500">{question.note}</p>
                  )}
                  {(question.referenceLink || question.secondaryLink || question.tertiaryLink) && (
                    <div className="flex flex-wrap gap-4">
                      {question.referenceLink && (
                        <a 
                          href={question.referenceLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {question.linkText || 'View Reference'}
                        </a>
                      )}
                      {question.secondaryLink && (
                        <a 
                          href={question.secondaryLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {question.secondaryLinkText || 'View Secondary Reference'}
                        </a>
                      )}
                      {question.tertiaryLink && (
                        <a 
                          href={question.tertiaryLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {question.tertiaryLinkText || 'View Tertiary Reference'}
                        </a>
                      )}
                    </div>
                  )}
                  
                  {question.type === 'textarea' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                        placeholder="Enter your answer here..."
                        className="min-h-[120px]"
                      />
                      <div className="flex justify-between items-center text-sm">
                        <div className={`${getWordCount(answers[question.id] || '') > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                          {getWordCount(answers[question.id] || '')} / 200 words
                        </div>
                        {getWordCount(answers[question.id] || '') > 200 && (
                          <div className="text-red-500 text-xs">
                            Exceeds word limit
                          </div>
                        )}
                      </div>
                    </div>
                  ) : question.type === 'file' ? (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        onChange={(e) => handleFileInputChange(question.id, e)}
                        accept={question.id.includes('video') ? 'video/*' : 
                               question.id.includes('poster') ? 'image/*' : 
                               question.id.includes('photo') ? 'image/*' : '*'}
                        multiple={question.requiredFiles && question.requiredFiles > 1}
                        className={!isQuestionValid ? 'border-red-300' : ''}
                      />
                      {validationMessage && (
                        <div className="flex items-center space-x-2 text-sm text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{validationMessage}</span>
                        </div>
                      )}
                      {isQuestionValid && (
                        <div className="text-sm text-green-600">
                          ✓ Files uploaded successfully
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSaveAndGoBack}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Go Back
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSave}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Progress
              </Button>
              
              <Button 
                onClick={onNext}
                disabled={!isComplete}
                className="flex-1"
              >
                Review & Submit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionQuestions;
