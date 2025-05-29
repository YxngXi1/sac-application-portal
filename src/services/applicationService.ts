import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
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

export const saveApplicationProgress = async (
  userId: string,
  applicationData: Partial<ApplicationData>
): Promise<void> => {
  const applicationRef = doc(db, 'applications', userId);
  
  const dataToSave = {
    ...applicationData,
    userId,
    updatedAt: new Date(),
  };

  // If this is the first save, set createdAt
  if (!applicationData.id) {
    dataToSave.createdAt = new Date();
    dataToSave.id = userId;
    dataToSave.status = 'draft';
  }

  await setDoc(applicationRef, dataToSave, { merge: true });
};

export const loadApplicationProgress = async (userId: string): Promise<ApplicationData | null> => {
  const applicationRef = doc(db, 'applications', userId);
  const applicationSnap = await getDoc(applicationRef);
  
  if (applicationSnap.exists()) {
    const data = applicationSnap.data() as ApplicationData;
    return {
      ...data,
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      submittedAt: data.submittedAt ? (data.submittedAt instanceof Date ? data.submittedAt : new Date(data.submittedAt)) : undefined,
    };
  }
  
  return null;
};

export const submitApplication = async (userId: string): Promise<void> => {
  const applicationRef = doc(db, 'applications', userId);
  
  await updateDoc(applicationRef, {
    status: 'submitted',
    submittedAt: new Date(),
    updatedAt: new Date(),
    progress: 100,
  });
};

export const getAllApplicationsByPosition = async (position: string): Promise<ApplicationData[]> => {
  const applicationsRef = collection(db, 'applications');
  const q = query(applicationsRef, where('position', '==', position));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as ApplicationData;
    return {
      ...data,
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      submittedAt: data.submittedAt ? (data.submittedAt instanceof Date ? data.submittedAt : new Date(data.submittedAt)) : undefined,
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
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      submittedAt: data.submittedAt ? (data.submittedAt instanceof Date ? data.submittedAt : new Date(data.submittedAt)) : undefined,
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
