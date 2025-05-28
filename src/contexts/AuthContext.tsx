
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  studentNumber?: string;
  role: 'student' | 'exec' | 'teacher' | 'superadmin';
  isOnboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const isValidPDSBEmail = (email: string): boolean => {
  return email.endsWith('@pdsb.net');
};

const isSuperAdmin = (email: string): boolean => {
  return email === '909957@pdsb.net';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if email is valid PDSB email
        if (!isValidPDSBEmail(user.email || '')) {
          console.log('Invalid email domain, signing out user');
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          let profile = profileDoc.data() as UserProfile;
          
          // Update role if user is superadmin
          if (isSuperAdmin(user.email || '')) {
            profile = { ...profile, role: 'superadmin' };
            await setDoc(doc(db, 'users', user.uid), profile);
          }
          
          setUserProfile(profile);
        } else {
          // Create initial profile
          const initialProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            role: isSuperAdmin(user.email || '') ? 'superadmin' : 'student',
            isOnboarded: false,
          };
          await setDoc(doc(db, 'users', user.uid), initialProfile);
          setUserProfile(initialProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Double-check email domain after sign-in
      if (!isValidPDSBEmail(result.user.email || '')) {
        await signOut(auth);
        throw new Error('Only PDSB email addresses (@pdsb.net) are allowed to access this application.');
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      if (error.message && error.message.includes('PDSB email')) {
        throw error;
      }
      
      throw new Error('Failed to sign in. Please ensure you are using a valid PDSB email address.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    const updatedProfile = { ...userProfile, ...updates } as UserProfile;
    await setDoc(doc(db, 'users', user.uid), updatedProfile);
    setUserProfile(updatedProfile);
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
