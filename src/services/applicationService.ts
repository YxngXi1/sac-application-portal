
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
  };
}

export interface QuestionGrade {
  questionId: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface ApplicationGrades {
  applicationId: string;
  grades: QuestionGrade[];
  totalScore: number;
  maxTotalScore: number;
  gradedBy: string;
  gradedAt: Date;
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
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      submittedAt: data.submittedAt?.toDate?.() || undefined,
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
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      submittedAt: data.submittedAt?.toDate?.() || undefined,
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
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      submittedAt: data.submittedAt?.toDate?.() || undefined,
    };
  });
};

export const saveApplicationGrades = async (grades: ApplicationGrades): Promise<void> => {
  const gradesRef = doc(db, 'applicationGrades', grades.applicationId);
  await setDoc(gradesRef, {
    ...grades,
    gradedAt: new Date(),
  });
  
  // Also update the application with the total score
  const applicationRef = doc(db, 'applications', grades.applicationId);
  await updateDoc(applicationRef, {
    score: grades.totalScore,
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
      gradedAt: data.gradedAt?.toDate?.() || new Date(data.gradedAt),
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
