
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
  fullName?: string;
  studentType?: 'AP' | 'SHSM' | 'none';
  isOnboarded?: boolean;
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
      console.log('Auth state changed:', user?.email);
      setUser(user);
      if (user) {
        // Strict email validation
        if (!isValidPDSBEmail(user.email || '')) {
          console.log('Invalid email domain detected, signing out user:', user.email);
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            let profile = profileDoc.data() as UserProfile;
            
            // Always update role if user is superadmin
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
        } catch (error) {
          console.error('Error handling user profile:', error);
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
      console.log('Attempting Google sign in...');
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('Sign in result:', result.user.email);
      
      // Double-check email domain after sign-in
      if (!isValidPDSBEmail(result.user.email || '')) {
        console.log('Email domain check failed:', result.user.email);
        await signOut(auth);
        throw new Error('Access denied. Only PDSB email addresses (@pdsb.net) are allowed to access this application.');
      }
      
      console.log('Sign in successful for:', result.user.email);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      }
      
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google sign-in.');
      }
      
      if (error.message && error.message.includes('PDSB email')) {
        throw error;
      }
      
      throw new Error('Failed to sign in. Please ensure you are using a valid PDSB email address (@pdsb.net).');
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
