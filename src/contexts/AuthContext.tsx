import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  studentNumber?: string;
  role: 'student' | 'exec' | 'teacher' | 'superadmin';
  fullName?: string;
  studentType?: 'AP' | 'SHSM' | 'none';
  isOnboarded?: boolean;
  grade?: string;
  createdAt: any;
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
  const superadminEmails = [
    '781284@pdsb.net',
    '949834@pdsb.net',
    '782630@pdsb.net',
    '931108@pdsb.net',
    '778130@pdsb.net'
  ];
  return superadminEmails.includes(email);
};

const isExec = (email: string): boolean => {
  const execEmails = [
    '844136@pdsb.net',
    '1061713@pdsb.net',
    '1031623@pdsb.net',
    '874034@pdsb.net',
    '1099702@pdsb.net',
    '780748@pdsb.net',
    '897889@pdsb.net',
    '841491@pdsb.net',
    '909956@pdsb.net',
    '1024557@pdsb.net',
    '778345@pdsb.net',
    '807453@pdsb.net',
    '779629@pdsb.net'
  ];
  return execEmails.includes(email);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getDerivedRole = (email: string): 'student' | 'exec' | 'superadmin' => {
    if (isSuperAdmin(email)) {
      return 'superadmin';
    }
    if (isExec(email)) {
      return 'exec';
    }
    return 'student';
  };

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
            
            // Always update role based on email
            if (isSuperAdmin(user.email || '')) {
              profile = { ...profile, role: 'superadmin' };
              await setDoc(doc(db, 'users', user.uid), { role: 'superadmin' }, { merge: true });
            } else if (isExec(user.email || '')) {
              profile = { ...profile, role: 'exec' };
              await setDoc(doc(db, 'users', user.uid), { role: 'exec' }, { merge: true });
            }
            
            setUserProfile(profile);
          } else {
            // Create initial profile with appropriate role
            const initialRole = getDerivedRole(user.email || '');

            const initialProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || '',
              role: initialRole,
              isOnboarded: false,
              createdAt: firestoreServerTimestamp()
            };
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, initialProfile);

            // Re-fetch so local state holds the *resolved* server
            // timestamp instead of the unresolved sentinel used to
            // write it. Without this, a later profile update (e.g.
            // completing onboarding) re-sends the sentinel, which
            // resolves to a *new* timestamp — failing firestore.rules'
            // requirement that createdAt stay unchanged on update.
            const createdSnap = await getDoc(userDocRef);
            setUserProfile(createdSnap.exists() ? (createdSnap.data() as UserProfile) : initialProfile);
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
    if (!user || !userProfile) return;

    const updatedProfile: UserProfile = {
      ...userProfile,
      ...updates,
      uid: user.uid,
      email: user.email || userProfile.email,
      role: getDerivedRole(user.email || ''),
      createdAt: userProfile.createdAt,
    };

    await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
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
function serverTimestamp(): any {
  return firestoreServerTimestamp();
}