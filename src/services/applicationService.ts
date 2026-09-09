import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, type DocumentData, type UpdateData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ApplicationData {
  id: string;
  userId: string;
  position: string;
  answers: Record<string, string>;
  progress: number;
  status: 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  score?: number;
  interviewScheduled?: boolean;
  userProfile?: {
    fullName: string;
    studentNumber: string;
    grade: string;
    studentType?: 'AP' | 'SHSM' | 'none';
  };
}

export interface QuestionGrade {
  questionId: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface ExecutiveGrade {
  executiveId: string;
  executiveName: string;
  grades: QuestionGrade[];
  totalScore: number;
  maxTotalScore: number;
  gradedAt: Date;
  feedback?: string; // Overall feedback from the executive
}

export interface ApplicationGrades {
  applicationId: string;
  executiveGrades: ExecutiveGrade[];
  averageScore: number;
  maxTotalScore: number;
  lastUpdated: Date;
}

export interface ExecutiveGradeSubmission {
  applicationId: string;
  executiveId: string;
  executiveName: string;
  grades: QuestionGrade[];
  totalScore: number;
  maxTotalScore: number;
  gradedAt: Date;
  feedback?: string; // Overall feedback
}

const toDateValue = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const getErrorCode = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return '';
};

export const getFirestoreWriteErrorMessage = (error: unknown): string => {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (code === 'permission-denied' || message.includes('permission')) {
    return 'You do not have permission to save this application. Sign out, sign back in, and try again.';
  }
  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'resource-exhausted' ||
    message.includes('network') ||
    message.includes('offline')
  ) {
    return 'Network error while saving. If you are on school Wi-Fi, try mobile data or another network.';
  }
  if (message.includes('undefined') || message.includes('invalid data')) {
    return 'Some application data could not be saved. Please review your answers and try again.';
  }
  return 'Failed to save your application. Please try again.';
};

const isRetryableFirestoreError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  return code === 'unavailable' || code === 'deadline-exceeded' || code === 'resource-exhausted' || code === 'aborted';
};

const withRetries = async <T,>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableFirestoreError(error) || attempt === attempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
};

const sanitizeAnswers = (answers: unknown): Record<string, string> => {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return {};
  }

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
    if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = String(value);
    }
  }
  return sanitized;
};

const sanitizeProgress = (progress: unknown, fallback = 0): number => {
  const numeric = typeof progress === 'number' ? progress : Number(progress);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, numeric));
};

const toOwnerWritableStatus = (
  requested: ApplicationData['status'] | undefined,
  existing: unknown
): 'draft' | 'submitted' => {
  if (existing === 'submitted' || requested === 'submitted') {
    return 'submitted';
  }
  return 'draft';
};

const buildUserProfile = (
  profile: ApplicationData['userProfile'] | undefined
): ApplicationData['userProfile'] | undefined => {
  if (!profile) return undefined;

  const built: ApplicationData['userProfile'] = {
    fullName: profile.fullName || '',
    studentNumber: profile.studentNumber || '',
    grade: profile.grade || '',
  };

  if (profile.studentType === 'AP' || profile.studentType === 'SHSM' || profile.studentType === 'none') {
    built.studentType = profile.studentType;
  }

  return built;
};

export const saveApplicationProgress = async (
  userId: string,
  applicationData: Partial<ApplicationData>
): Promise<void> => {
  const applicationRef = doc(db, 'applications', userId);
  const existingSnap = await withRetries(() => getDoc(applicationRef));
  const existingData = existingSnap.exists() ? existingSnap.data() : undefined;
  const now = new Date();
  const existingAnswers = sanitizeAnswers(existingData?.answers);
  const incomingAnswers = applicationData.answers !== undefined
    ? sanitizeAnswers(applicationData.answers)
    : undefined;
  const answers = incomingAnswers
    ? { ...existingAnswers, ...incomingAnswers }
    : existingAnswers;
  const progress = sanitizeProgress(applicationData.progress ?? existingData?.progress, 0);
  const position = applicationData.position || (typeof existingData?.position === 'string' ? existingData.position : '');
  const userProfile = buildUserProfile(applicationData.userProfile) ?? existingData?.userProfile;

  if (existingData?.status === 'submitted') {
    return;
  }

  if (!existingSnap.exists()) {
    const createPayload: Record<string, unknown> = {
      id: userId,
      userId,
      position,
      answers,
      progress,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    if (userProfile) {
      createPayload.userProfile = userProfile;
    }

    await withRetries(() => setDoc(applicationRef, createPayload as DocumentData));
    return;
  }

  const updatePayload: Record<string, unknown> = {
    userId,
    position,
    answers,
    progress,
    status: toOwnerWritableStatus(applicationData.status, existingData?.status),
    updatedAt: now,
  };

  if (userProfile) {
    updatePayload.userProfile = userProfile;
  }

  await withRetries(() => updateDoc(applicationRef, updatePayload as UpdateData<DocumentData>));
};

export const loadApplicationProgress = async (userId: string): Promise<ApplicationData | null> => {
  console.log('loadApplicationProgress called for userId:', userId);
  
  try {
    const applicationRef = doc(db, 'applications', userId);
    const applicationSnap = await getDoc(applicationRef);
    
    if (applicationSnap.exists()) {
      const data = applicationSnap.data() as ApplicationData;
      console.log('Application data loaded successfully:', {
        hasAnswers: !!data.answers,
        answersCount: data.answers ? Object.keys(data.answers).length : 0,
        position: data.position,
        status: data.status
      });
      
      return {
        ...data,
        createdAt: toDateValue(data.createdAt) || new Date(),
        updatedAt: toDateValue(data.updatedAt) || new Date(),
        submittedAt: toDateValue(data.submittedAt),
      };
    } else {
      console.log('No application data found for user');
      return null;
    }
  } catch (error) {
    console.error('Error in loadApplicationProgress:', error);
    throw error;
  }
};

export const submitApplication = async (
  userId: string,
  currentApplicationData?: Partial<ApplicationData>
): Promise<void> => {
  if (currentApplicationData) {
    await saveApplicationProgress(userId, currentApplicationData);
  }

  const applicationRef = doc(db, 'applications', userId);
  const existingSnap = await withRetries(() => getDoc(applicationRef));
  if (!existingSnap.exists()) {
    throw new Error('No application data found to submit');
  }

  if (existingSnap.data().status === 'submitted') {
    return;
  }

  await withRetries(() =>
    updateDoc(applicationRef, {
      status: 'submitted',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: 100,
    })
  );
};

export const getAllApplicationsByPosition = async (position: string): Promise<ApplicationData[]> => {
  const applicationsRef = collection(db, 'applications');
  const q = query(applicationsRef, where('position', '==', position));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as ApplicationData;
    return {
      ...data,
      createdAt: toDateValue(data.createdAt) || new Date(),
      updatedAt: toDateValue(data.updatedAt) || new Date(),
      submittedAt: toDateValue(data.submittedAt),
    };
  });
};

export const getAllApplications = async (): Promise<ApplicationData[]> => {
  const applicationsRef = collection(db, 'applications');
  const querySnapshot = await getDocs(applicationsRef);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as ApplicationData;
    return {
      ...data,
      createdAt: toDateValue(data.createdAt) || new Date(),
      updatedAt: toDateValue(data.updatedAt) || new Date(),
      submittedAt: toDateValue(data.submittedAt),
    };
  });
};

export const saveApplicationGrades = async (gradeSubmission: ExecutiveGradeSubmission): Promise<void> => {
  const gradesRef = doc(db, 'applicationGrades', gradeSubmission.applicationId);
  
  // Get existing grades
  const existingGradesSnap = await getDoc(gradesRef);
  let applicationGrades: ApplicationGrades;
  
  if (existingGradesSnap.exists()) {
    applicationGrades = existingGradesSnap.data() as ApplicationGrades;
  } else {
    applicationGrades = {
      applicationId: gradeSubmission.applicationId,
      executiveGrades: [],
      averageScore: 0,
      maxTotalScore: gradeSubmission.maxTotalScore,
      lastUpdated: new Date()
    };
  }
  
  // Update or add the executive's grades
  const existingGradeIndex = applicationGrades.executiveGrades.findIndex(
    eg => eg.executiveId === gradeSubmission.executiveId
  );
  
  const newExecutiveGrade: ExecutiveGrade = {
    executiveId: gradeSubmission.executiveId,
    executiveName: gradeSubmission.executiveName,
    grades: gradeSubmission.grades,
    totalScore: gradeSubmission.totalScore,
    maxTotalScore: gradeSubmission.maxTotalScore,
    gradedAt: new Date(),
    feedback: gradeSubmission.feedback
  };
  
  if (existingGradeIndex >= 0) {
    applicationGrades.executiveGrades[existingGradeIndex] = newExecutiveGrade;
  } else {
    applicationGrades.executiveGrades.push(newExecutiveGrade);
  }
  
  // Calculate new average score
  const totalScore = applicationGrades.executiveGrades.reduce((sum, eg) => sum + eg.totalScore, 0);
  applicationGrades.averageScore = applicationGrades.executiveGrades.length > 0 
    ? totalScore / applicationGrades.executiveGrades.length 
    : 0;
  applicationGrades.lastUpdated = new Date();
  
  // Save the updated grades
  await setDoc(gradesRef, applicationGrades);
  
  // Also update the application with the average score
  const applicationRef = doc(db, 'applications', gradeSubmission.applicationId);
  await updateDoc(applicationRef, {
    score: applicationGrades.averageScore,
    updatedAt: new Date(),
  });
};

export const getApplicationGrades = async (applicationId: string): Promise<ApplicationGrades | null> => {
  const gradesRef = doc(db, 'applicationGrades', applicationId);
  const gradesSnap = await getDoc(gradesRef);
  
  if (gradesSnap.exists()) {
    const data = gradesSnap.data() as ApplicationGrades;
    return {
      ...data,
      lastUpdated: data.lastUpdated instanceof Date ? data.lastUpdated : new Date(data.lastUpdated),
      executiveGrades: data.executiveGrades.map(eg => ({
        ...eg,
        gradedAt: eg.gradedAt instanceof Date ? eg.gradedAt : new Date(eg.gradedAt)
      }))
    };
  }
  
  return null;
};

export const updateInterviewStatus = async (applicationId: string, scheduled: boolean): Promise<void> => {
  const applicationRef = doc(db, 'applications', applicationId);
  await updateDoc(applicationRef, {
    interviewScheduled: scheduled,
    updatedAt: new Date(),
  });
};
