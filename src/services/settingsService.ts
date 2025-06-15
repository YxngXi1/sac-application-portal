import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type RoleType = "teacher" | "pres" | "vp" | "tech" | "exec" | "guest";
export interface SACRoleAssignment {
  uid: string;
  email: string;
  displayName?: string;
  role: RoleType;
  positions?: string[];
}

export const getSACRoles = async (): Promise<SACRoleAssignment[]> => {
  const ref = collection(db, "roles");
  const snap = await getDocs(ref);
  return snap.docs.map(doc => doc.data() as SACRoleAssignment);
};

export const setSACRole = async (uid: string, role: RoleType, positions?: string[]) => {
  const ref = doc(db, "roles", uid);
  await setDoc(ref, { uid, role, positions }, { merge: true });
};

// Global settings
export interface SACGlobalSettings {
  acceptingApplications: boolean;
  // Other global settings go here
}

export const getSACSettings = async (): Promise<SACGlobalSettings> => {
  const ref = doc(db, "settings", "global");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as SACGlobalSettings;
  }
  // If not set, create with default
  const def: SACGlobalSettings = { acceptingApplications: false };
  await setDoc(ref, def);
  return def;
};

export const setSACSetting = async (key: keyof SACGlobalSettings, value: any) => {
  const ref = doc(db, "settings", "global");
  await updateDoc(ref, { [key]: value });
};
