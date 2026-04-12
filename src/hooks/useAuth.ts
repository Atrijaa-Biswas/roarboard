import { useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useUserStore } from '../store/useUserStore';

export function useAuth() {
  const setUser = useUserStore((state) => state.setUser);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Force refresh token to get latest claims
        const token = await firebaseUser.getIdTokenResult(true);
        const isAdmin = !!token.claims.admin;
        
        setUser({
          uid: firebaseUser.uid,
          isAnonymous: firebaseUser.isAnonymous,
          email: firebaseUser.email,
          role: isAdmin ? 'staff' : 'attendee'
        });
      } else {
        try {
          setUser(null);
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Anonymous authentication failed", err);
        }
      }
    });

    return () => unsubscribe();
  }, [setUser]);
}

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("Staff Google Sign-in failed", err);
    throw err;
  }
};

export const logout = () => signOut(auth);
