// frontend/src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  sendEmailVerification
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  userEmail: string | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // onIdTokenChanged fires on login, logout, AND whenever Firebase silently
    // refreshes the ID token (every ~hour). This keeps our stored token fresh.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error('Error getting token:', error);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Always get a fresh token - used by pages before making API calls
  const getToken = useCallback(async (): Promise<string | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    try {
      // forceRefresh=false: returns cached token unless within 5 min of expiry
      const idToken = await currentUser.getIdToken(false);
      setToken(idToken);
      return idToken;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/dashboard');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }, [router]);

  const signup = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      router.replace('/dashboard');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      router.replace('/login');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    userEmail: user?.email || null,
    token,
    isLoggedIn: !!user,
    isLoadingAuth,
    login,
    signup,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
