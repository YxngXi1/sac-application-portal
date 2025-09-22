import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, User, Star, CheckCircle, Users, Shuffle } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface InterviewGraderProps {
  candidate: ApplicationData;
  interviewType: 'one' | 'two';
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
  selectedQuestions?: string[];
}

interface InterviewGrades {
  candidateId: string;
  interviewType: 'one' | 'two';
  panelGrades: PanelMemberGrade[];
  averageScore: number;
  masterQuestions?: string[];
}

// State for tracking grades across all group candidates
interface CandidateGradeState {
  grades: Record<string, number>;
  feedback: string;
  checkboxes: InterviewCheckboxes;
}

const InterviewGrader: React.FC<InterviewGraderProps> = ({ candidate, interviewType, onBack }) => {
  const { user } = useAuth();
  const [currentCandidate, setCurrentCandidate] = useState<ApplicationData>(candidate);
  const [groupSlotCandidates, setGroupSlotCandidates] = useState<ApplicationData[]>([]);
  const [allCandidateGrades, setAllCandidateGrades] = useState<Record<string, CandidateGradeState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [panelGrades, setPanelGrades] = useState<PanelMemberGrade[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  useEffect(() => {
    setCurrentCandidate(candidate);
  }, [candidate]);

  const getCandidateGroupSlot = (c: ApplicationData) => {
    return (
      (c as any).groupInterviewSlot ||
      (c as any).interviewOne?.slot ||
      (c as any).interviewOneSlot ||
      (c as any).groupInterviewTime ||
      (c as any).interviewOneTime ||
      null
    );
  };

  const fetchGroupSlotCandidates = async (c: ApplicationData) => {
    try {
      const scheduledQ = query(
        collection(db, 'scheduledInterviews'),
        where('candidateId', '==', c.id)
      );
      const scheduledSnap = await getDocs(scheduledQ);

      if (!scheduledSnap.empty) {
        const scheduledDoc = scheduledSnap.docs[0];
        const scheduledData: any = scheduledDoc.data();

        const interviewDate = scheduledData.interviewOneDate;
        const interviewTime = scheduledData.interviewOneTime;

        if (interviewDate && interviewTime) {
          const peersQ = query(
            collection(db, 'scheduledInterviews'),
            where('interviewOneDate', '==', interviewDate),
            where('interviewOneTime', '==', interviewTime)
          );
          const peersSnap = await getDocs(peersQ);

          if (!peersSnap.empty) {
            const candidateIds = peersSnap.docs.map(d => (d.data() as any).candidateId).filter(Boolean) as string[];
            const uniqueIds = Array.from(new Set(candidateIds));

            const apps: ApplicationData[] = [];
            for (const id of uniqueIds) {
              try {
                const appDoc = await getDoc(doc(db, 'applications', id));
                if (appDoc.exists()) {
                  apps.push({ ...(appDoc.data() as ApplicationData), id: appDoc.id });
                }
              } catch (e) {
                console.debug('error fetching application', id, e);
              }
            }

            // Filter by the same grade as the current candidate
            const currentCandidateGrade = c.userProfile?.grade;
            const sameGradeApps = apps.filter(app => 
              app.userProfile?.grade === currentCandidateGrade
            );

            sameGradeApps.sort((a, b) => {
              const nameA = a.userProfile?.fullName || '';
              const nameB = b.userProfile?.fullName || '';
              return nameA.localeCompare(nameB);
            });

            // Limit to 5 candidates maximum per grade group
            const gradeGroupApps = sameGradeApps.slice(0, 5);
            setGroupSlotCandidates(gradeGroupApps);
            return;
          }
        }
      }
    } catch (err) {
      console.debug('scheduledInterviews lookup failed, falling back to applications query', err);
    }

    // Fallback method - also filter by grade
    const slot = getCandidateGroupSlot(c);
    if (!slot) {
      setGroupSlotCandidates([]);
      return;
    }

    try {
      const possibleFieldPaths = ['groupInterviewSlot', 'interviewOne.slot', 'interviewOneSlot', 'groupInterviewTime', 'interviewOneTime'];
      let results: ApplicationData[] = [];

      for (const fieldPath of possibleFieldPaths) {
        const q = query(collection(db, 'applications'), where(fieldPath, '==', slot));
        const snap = await getDocs(q);
        if (!snap.empty) {
          results = snap.docs.map(d => ({ ...(d.data() as ApplicationData), id: d.id }));
          break;
        }
      }

      // Filter by the same grade as the current candidate
      const currentCandidateGrade = c.userProfile?.grade;
      const sameGradeResults = results.filter(app => 
        app.userProfile?.grade === currentCandidateGrade
      );

      sameGradeResults.sort((a, b) => {
        const nameA = a.userProfile?.fullName || '';
        const nameB = b.userProfile?.fullName || '';
        return nameA.localeCompare(nameB);
      });

      // Limit to 5 candidates maximum per grade group
      const combined = sameGradeResults.slice(0, 5);
      setGroupSlotCandidates(combined);
    } catch (err) {
      console.error('Error fetching group slot candidates (fallback):', err);
      setGroupSlotCandidates([]);
    }
  };

  const getQuestionPools = (position: string) => {
    const questionPools: Record<string, { 
      interviewOne: string[],
      pool1: string[], 
      pool2: string[], 
      pool3: string[],
      pool4: string[]
    }> = {
      'Grade Rep': {
        interviewOne: [
          "Collaboration",
          "Confidence",
          "Participation",
          "Overall Impression"
        ],
        pool1: [
          "How do you believe an honourary member can best contribute to SAC's ultimate goal of creating a positive school environment?",
          "How should an honorary member demonstrate their commitment to SAC and the student body?",
          "What traits, qualities, or characteristics do you believe make the perfect honourary member?"
        ],
        pool2: [
          "Imagine a fellow council member's motivation begins to decline. They start missing meetings, avoiding volunteer opportunities, and contributing less to SAC's initiatives. As an honorary member, how would you help respark their motivation and encourage them to re-engage?",
          "Imagine an angry student claims they bought their semi-formal ticket, but there is no record of their ticket in the google sheet. How would you deescalate the issue without giving into their lie?",
          "Describe a situation where you had to mediate a disagreement. How exactly did you resolve it and what were your steps in doing so?"
        ],
        pool3: [
          "What experiences from your past school or community involvement have prepared you for an honourary role on SAC?",
          "Describe a time when you worked as part of a team. What did you learn from that experience that you could apply to SAC?",
          "In your opinion, what experiences make you the most suitable candidate for this honourary position?"
        ],
        pool4: [
          "Is there a person, either from real life or a story, who inspires you most? Why?",
          "What kind of impact do you hope to leave on either SAC or the school as an honourary member?",
          "If you could describe yourself as any animal, which would you pick and why?"
        ]
      },
    };

    return questionPools[position] || questionPools['Honourary Member'];
  };

  const generateInterviewTwoQuestions = (position: string): string[] => {
    const pools = getQuestionPools(position);
    
    const question1 = pools.pool1[Math.floor(Math.random() * pools.pool1.length)];
    const question2 = pools.pool2[Math.floor(Math.random() * pools.pool2.length)];
    const question3 = pools.pool3[Math.floor(Math.random() * pools.pool3.length)];
    const question4 = pools.pool4[Math.floor(Math.random() * pools.pool4.length)];
    
    return [question1, question2, question3, question4];
  };

  const getQuestionsForInterview = async (position: string, interviewType: 'one' | 'two'): Promise<string[]> => {
    if (interviewType === 'one') {
      const pools = getQuestionPools(position);
      return pools.interviewOne;
    }

    const gradeDocId = `${currentCandidate.id}_interview_two`;
    const gradeDoc = await getDoc(doc(db, 'interviewGrades', gradeDocId));
    
    if (gradeDoc.exists()) {
      const data = gradeDoc.data() as InterviewGrades;
      if (data.masterQuestions && data.masterQuestions.length === 4) {
        return data.masterQuestions;
      }
    }
    
    const newQuestions = generateInterviewTwoQuestions(position);
    
    try {
      const gradeDocRef = doc(db, 'interviewGrades', gradeDocId);
      const existingDoc = await getDoc(gradeDocRef);
      
      if (existingDoc.exists()) {
        await updateDoc(gradeDocRef, {
          masterQuestions: newQuestions
        });
      } else {
        await setDoc(gradeDocRef, {
          candidateId: currentCandidate.id,
          interviewType: 'two',
          panelGrades: [],
          averageScore: 0,
          masterQuestions: newQuestions
        });
      }
    } catch (error) {
      console.error('Error saving master questions:', error);
    }
    
    return newQuestions;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (interviewType === 'one') {
          await fetchGroupSlotCandidates(currentCandidate);
        } else {
          setGroupSlotCandidates([]);
        }

        const questions = await getQuestionsForInterview(currentCandidate.position, interviewType);
        setSelectedQuestions(questions);

        // Check if user has already submitted for this session
        if (interviewType === 'one' && groupSlotCandidates.length > 0) {
          // For group interviews, check any candidate in the group to see if user has submitted
          const firstCandidateId = groupSlotCandidates[0]?.id || currentCandidate.id;
          const gradeDocId = `${firstCandidateId}_interview_${interviewType}`;
          const gradeDoc = await getDoc(doc(db, 'interviewGrades', gradeDocId));
          
          if (gradeDoc.exists()) {
            const data = gradeDoc.data() as InterviewGrades;
            const existingGrade = data.panelGrades?.find(pg => pg.panelMemberId === user?.uid);
            if (existingGrade) {
              setHasSubmitted(true);
            }
          }
        } else {
          // For individual interviews, check the specific candidate
          const gradeDocId = `${currentCandidate.id}_interview_${interviewType}`;
          const gradeDoc = await getDoc(doc(db, 'interviewGrades', gradeDocId));
          
          if (gradeDoc.exists()) {
            const data = gradeDoc.data() as InterviewGrades;
            setPanelGrades(data.panelGrades || []);
            
            const existingGrade = data.panelGrades?.find(pg => pg.panelMemberId === user?.uid);
            if (existingGrade) {
              // Load existing grades for individual interview
              const candidateState: CandidateGradeState = {
                grades: existingGrade.grades,
                feedback: existingGrade.feedback,
                checkboxes: existingGrade.checkboxes
              };
              setAllCandidateGrades({ [currentCandidate.id]: candidateState });
              setHasSubmitted(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        const pools = getQuestionPools(currentCandidate.position);
        setSelectedQuestions(interviewType === 'one' ? pools.interviewOne : generateInterviewTwoQuestions(currentCandidate.position));
      }
    };

    if (user && currentCandidate) {
      loadData();
    }
  }, [currentCandidate, interviewType, user, groupSlotCandidates.length]);

  // Get current candidate's grade state
  const getCurrentCandidateState = (): CandidateGradeState => {
    return allCandidateGrades[currentCandidate.id] || {
      grades: {},
      feedback: '',
      checkboxes: {
        pastExperience: false,
        roleKnowledge: false,
        leadershipSkills: false,
        creativeOutlook: false,
        timeManagement: false
      }
    };
  };

  // Update current candidate's state
  const updateCurrentCandidateState = (updates: Partial<CandidateGradeState>) => {
    setAllCandidateGrades(prev => ({
      ...prev,
      [currentCandidate.id]: {
        ...getCurrentCandidateState(),
        ...updates
      }
    }));
  };

  const handleGradeChange = (questionIndex: number, score: number) => {
    const currentState = getCurrentCandidateState();
    updateCurrentCandidateState({
      grades: {
        ...currentState.grades,
        [`question_${questionIndex}`]: score
      }
    });
  };

  const handleCheckboxChange = (key: keyof InterviewCheckboxes, checked: boolean) => {
    const currentState = getCurrentCandidateState();
    updateCurrentCandidateState({
      checkboxes: {
        ...currentState.checkboxes,
        [key]: checked
      }
    });
  };

  const handleFeedbackChange = (feedback: string) => {
    updateCurrentCandidateState({ feedback });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      if (interviewType === 'one') {
        // Submit grades for all candidates in the group
        for (const candidateToGrade of groupSlotCandidates) {
          const candidateState = allCandidateGrades[candidateToGrade.id];
          if (!candidateState) continue;

          const newGrade: PanelMemberGrade = {
            panelMemberId: user.uid,
            panelMemberName: user.displayName || user.email || 'Unknown',
            grades: candidateState.grades,
            checkboxes: candidateState.checkboxes,
            feedback: candidateState.feedback,
            submittedAt: new Date(),
            selectedQuestions: selectedQuestions
          };

          const gradeDocId = `${candidateToGrade.id}_interview_${interviewType}`;
          const gradeDocRef = doc(db, 'interviewGrades', gradeDocId);
          const existingDoc = await getDoc(gradeDocRef);

          let updatedPanelGrades: PanelMemberGrade[];
          let masterQuestions = selectedQuestions;
          
          if (existingDoc.exists()) {
            const existingData = existingDoc.data() as InterviewGrades;
            updatedPanelGrades = existingData.panelGrades || [];
            masterQuestions = existingData.masterQuestions || selectedQuestions;
            
            updatedPanelGrades = updatedPanelGrades.filter(pg => pg.panelMemberId !== user.uid);
            updatedPanelGrades.push(newGrade);
          } else {
            updatedPanelGrades = [newGrade];
          }

          const allScores = updatedPanelGrades.map(panelGrade => {
            const scores = Object.values(panelGrade.grades).filter(s => s > 0);
            return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
          });
          
          const averageScore = allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0;

          const interviewGradeData: InterviewGrades = {
            candidateId: candidateToGrade.id,
            interviewType,
            panelGrades: updatedPanelGrades,
            averageScore,
            masterQuestions: masterQuestions
          };

          await setDoc(gradeDocRef, interviewGradeData);
        }
      } else {
        // Submit grades for individual interview (current candidate only)
        const candidateState = getCurrentCandidateState();
        
        const newGrade: PanelMemberGrade = {
          panelMemberId: user.uid,
          panelMemberName: user.displayName || user.email || 'Unknown',
          grades: candidateState.grades,
          checkboxes: candidateState.checkboxes,
          feedback: candidateState.feedback,
          submittedAt: new Date(),
          selectedQuestions: selectedQuestions
        };

        const gradeDocId = `${currentCandidate.id}_interview_${interviewType}`;
        const gradeDocRef = doc(db, 'interviewGrades', gradeDocId);
        const existingDoc = await getDoc(gradeDocRef);

        let updatedPanelGrades: PanelMemberGrade[];
        let masterQuestions = selectedQuestions;
        
        if (existingDoc.exists()) {
          const existingData = existingDoc.data() as InterviewGrades;
          updatedPanelGrades = existingData.panelGrades || [];
          masterQuestions = existingData.masterQuestions || selectedQuestions;
          
          updatedPanelGrades = updatedPanelGrades.filter(pg => pg.panelMemberId !== user.uid);
          updatedPanelGrades.push(newGrade);
        } else {
          updatedPanelGrades = [newGrade];
        }

        const allScores = updatedPanelGrades.map(panelGrade => {
          const scores = Object.values(panelGrade.grades).filter(s => s > 0);
          return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
        });
        
        const averageScore = allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0;

        const interviewGradeData: InterviewGrades = {
          candidateId: currentCandidate.id,
          interviewType,
          panelGrades: updatedPanelGrades,
          averageScore,
          masterQuestions: masterQuestions
        };

        await setDoc(gradeDocRef, interviewGradeData);
        setPanelGrades(updatedPanelGrades);
      }
      
      setHasSubmitted(true);
      
      alert(`Interview ${interviewType === 'one' ? 'One' : 'Two'} grades submitted successfully!`);
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Error submitting grades. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormComplete = () => {
    if (interviewType === 'one') {
      // For group interviews, check that all candidates have complete grades
      const candidatesToCheck = groupSlotCandidates.length > 0 ? groupSlotCandidates : [currentCandidate];
      
      return candidatesToCheck.every(candidate => {
        const candidateState = allCandidateGrades[candidate.id];
        if (!candidateState) return false;
        
        const hasAllGrades = selectedQuestions.every((_, index) => 
          candidateState.grades[`question_${index}`] !== undefined && candidateState.grades[`question_${index}`] > 0
        );
        return hasAllGrades && candidateState.feedback.trim().length > 0;
      });
    } else {
      // For individual interviews, check current candidate only
      const candidateState = getCurrentCandidateState();
      const hasAllGrades = selectedQuestions.every((_, index) => 
        candidateState.grades[`question_${index}`] !== undefined && candidateState.grades[`question_${index}`] > 0
      );
      return hasAllGrades && candidateState.feedback.trim().length > 0;
    }
  };

  const renderScoreButtons = (questionIndex: number) => {
    const currentState = getCurrentCandidateState();
    const currentScore = currentState.grades[`question_${questionIndex}`] || 0;
    
    return (
      <div className="grid grid-cols-11 gap-2 mt-4">
        {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((score) => (
          <Button
            key={score}
            variant={currentScore === score ? "default" : "outline"}
            size="sm"
            onClick={() => handleGradeChange(questionIndex, score)}
            className={`h-10 text-sm font-medium transition-all duration-200 ${
              currentScore === score 
                ? 'bg-blue-600 text-white shadow-md scale-105 border-blue-600' 
                : 'hover:bg-blue-50 hover:border-blue-300 hover:scale-102'
            }`}
            disabled={hasSubmitted}
          >
            {score}
          </Button>
        ))}
      </div>
    );
  };

  if (selectedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  const currentState = getCurrentCandidateState();

  return (
    <div className="min-h-screen bg-gray-50">
      {interviewType === 'one' && groupSlotCandidates.length > 1 && (
        <div className="fixed right-6 top-28 z-40 flex flex-col gap-2" style={{ minWidth: '200px'}}>
          {groupSlotCandidates.map((c) => {
            const isActive = c.id === currentCandidate.id;
            const candidateState = allCandidateGrades[c.id];
            const isComplete = candidateState && 
              selectedQuestions.every((_, index) => 
                candidateState.grades[`question_${index}`] !== undefined && candidateState.grades[`question_${index}`] > 0
              ) && candidateState.feedback.trim().length > 0;
            
            const rawName = c.userProfile?.fullName || 'N/A';
            const displayName = String(rawName);
            const initials = displayName.split(' ').map(s => s[0] || '').slice(0,2).join('').toUpperCase();
            
            return (
              <button
                key={c.id}
                onClick={() => setCurrentCandidate(c)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg shadow-sm border transition-colors w-full min-h-[60px] ${
                  isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-200 hover:scale-102'
                }`}
                title={displayName}
              >
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${isActive ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-800'}`}>
                  {initials}
                </div>
               <div className="text-left text-sm flex-1 min-w-0">
                 <div className="font-medium leading-tight truncate">{displayName}</div>
                 <div className="text-xs text-gray-500 truncate">{c.position}</div>
                 {isComplete && (
                   <div className="text-xs text-green-600 font-medium">✓ Complete</div>
                 )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-white border-b shadow-sm px-8 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview View
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {interviewType === 'one' ? 'Group Interview' : 'Individual Interview'} Grading - {currentCandidate.userProfile?.fullName || 'N/A'}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{currentCandidate.userProfile?.fullName || 'N/A'}</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {currentCandidate.position}
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  Grade {currentCandidate.userProfile?.grade}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`border-2 ${
                    interviewType === 'one' 
                      ? 'border-blue-300 text-blue-700 bg-blue-50' 
                      : 'border-green-300 text-green-700 bg-green-50'
                  }`}
                >
                  {interviewType === 'one' ? 'Group Interview' : 'Individual Interview'}
                </Badge>
                {interviewType === 'two' && (
                  <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                    <Shuffle className="h-3 w-3 mr-1" />
                    Randomized Questions
                  </Badge>
                )}
              </div>
            </div>
            {hasSubmitted && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Submitted</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card className={`border-2 shadow-sm ${
              interviewType === 'one' 
                ? 'border-blue-200 bg-blue-50' 
                : 'border-green-200 bg-green-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    interviewType === 'one' ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {interviewType === 'one' ? '1' : '2'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      interviewType === 'one' ? 'text-blue-800' : 'text-green-800'
                    }`}>
                      Grading {interviewType === 'one' ? 'Group Interview' : 'Individual Interview'}
                    </h3>
                    <p className={`text-sm ${
                      interviewType === 'one' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {interviewType === 'one' 
                        ? `This is the group interview session with standardized questions. ${groupSlotCandidates.length > 1 ? `You must grade all ${groupSlotCandidates.length} candidates in this time slot.` : ''}`
                        : 'This individual interview uses randomly selected questions from predefined pools to ensure variety while maintaining fairness. All panel members will see the same questions for this candidate.'
                      }
                    </p>
                  </div>
                  {interviewType === 'two' && (
                    <Shuffle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {selectedQuestions.map((question, index) => (
                <Card key={index} className="border shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm text-white ${
                          interviewType === 'one' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {index + 1}
                        </div>
                        Question {index + 1} ({interviewType === 'one' ? 'Group Interview' : 'Individual Interview'})
                        {interviewType === 'two' && (
                          <Shuffle className="h-4 w-4 text-orange-500"/>
                        )}
                      </CardTitle>
                      <Badge variant="outline" className={`${
                        interviewType === 'one' 
                          ? 'border-blue-300 text-blue-700 bg-blue-50' 
                          : 'border-green-300 text-green-700 bg-green-50'
                      }`}>
                        Max: 5 points
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                      {question}
                    </p>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Your Score (0-5)
                      </label>
                      {renderScoreButtons(index)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {interviewType === 'two' && (
              <Card className="border shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Assessment Criteria
                  </CardTitle>
                  <CardDescription>
                    Check all criteria that apply to this candidate during the Individual Interview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { key: 'pastExperience', label: 'Past Experience or attendance at SAC events' },
                      { key: 'roleKnowledge', label: 'Good knowledge of tasks involved for the role' },
                      { key: 'leadershipSkills', label: 'Good leadership skills and leadership experience' },
                      { key: 'creativeOutlook', label: 'Creative and energetic outlook for the tasks required for this role' },
                      { key: 'timeManagement', label: 'Seems organized and manages time well' }
                    ].map((criterion) => (
                      <div key={criterion.key} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                        <Checkbox
                          id={criterion.key}
                          checked={currentState.checkboxes[criterion.key as keyof InterviewCheckboxes]}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(criterion.key as keyof InterviewCheckboxes, checked as boolean)
                          }
                          disabled={hasSubmitted}
                          className="mt-0.5"
                        />
                        <label 
                          htmlFor={criterion.key} 
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
                        >
                          {criterion.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border shadow-sm bg-white">
              <CardHeader>
                <CardTitle>{interviewType === 'one' ? 'Group Interview' : 'Individual Interview'} Feedback</CardTitle>
                <CardDescription>
                  Provide detailed feedback about the candidate's performance in the {interviewType === 'one' ? 'Group Interview' : 'Individual Interview'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={`Enter your detailed feedback about the candidate's responses during the ${interviewType === 'one' ? 'Group Interview' : 'Individual Interview'}, communication skills, and overall impression...`}
                  value={currentState.feedback}
                  onChange={(e) => handleFeedbackChange(e.target.value)}
                  className="min-h-32 resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  disabled={hasSubmitted}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <Card className="border shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    {interviewType === 'one' ? 'Group Interview' : 'Individual Interview'} Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {panelGrades.map((grade) => {
                    const isCurrentUser = grade.panelMemberId === user?.uid;
                    const avgScore = Object.values(grade.grades).length > 0 
                      ? (Object.values(grade.grades).reduce((sum, s) => sum + s, 0) / Object.values(grade.grades).length).toFixed(1)
                      : '0.0';
                    
                    return (
                      <div key={grade.panelMemberId} className={`p-3 rounded-lg border transition-all ${
                        isCurrentUser 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-sm text-gray-900">
                            {grade.panelMemberName}
                            {isCurrentUser && (
                              <span className="text-blue-600 ml-1 font-normal">(You)</span>
                            )}
                          </span>
                          <Star className="h-3 w-3 text-yellow-500 ml-auto" />
                        </div>
                        <div className="text-xs text-gray-600">
                          Score: <span className="font-medium text-blue-600">{avgScore}/5</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {panelGrades.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No grades submitted yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isFormComplete() 
                ? hasSubmitted 
                  ? `✅ ${interviewType === 'one' ? 'Group Interview' : 'Individual Interview'} grades submitted successfully` 
                  : interviewType === 'one' && groupSlotCandidates.length > 1
                    ? `✅ All ${groupSlotCandidates.length} candidates completed - ready to submit`
                    : "✅ All fields completed - ready to submit"
                : interviewType === 'one' && groupSlotCandidates.length > 1
                  ? "⚠️ Please complete grades and feedback for all candidates in this group"
                  : "⚠️ Please complete all questions and provide feedback"
              }
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete() || submitting || hasSubmitted}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 font-medium shadow-md"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : hasSubmitted ? (
                'Submitted'
              ) : (
                `Submit ${interviewType === 'one' ? 'Group Interview' : 'Individual Interview'} Grades`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewGrader;