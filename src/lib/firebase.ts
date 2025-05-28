
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCaP_RYaXLzsY7SwT5m2RBBWz7WeJA1OAk",
  authDomain: "sac-apply.firebaseapp.com",
  projectId: "sac-apply",
  storageBucket: "sac-apply.appspot.com",
  messagingSenderId: "226413841077",
  appId: "1:226413841077:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider to request email
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;
