import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';
import { getPerformance } from 'firebase/performance';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBKtbYxdZg3T4SjcVXeqjKNr1aQQp_El0w",
  authDomain: "roarboard-9b104.firebaseapp.com",
  databaseURL: "https://roarboard-9b104-default-rtdb.firebaseio.com",
  projectId: "roarboard-9b104",
  storageBucket: "roarboard-9b104.firebasestorage.app",
  messagingSenderId: "552857258785",
  appId: "1:552857258785:web:ebb52fe5ca890af23dcc60",
  measurementId: "G-0FPDPKHHV8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app);

// Initialize conditionally for browser-only APIs
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const perf = typeof window !== 'undefined' ? getPerformance(app) : null;
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
