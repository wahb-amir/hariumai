
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useRouter, usePathname } from 'next/navigation';
import FullscreenLoader from '@/components/harium-ai-loader';
import { getUser } from '@/services/user-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!app) {
        setLoading(false);
        return;
    }
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase, now check if they are verified in our DB
        const dbUser = await getUser(firebaseUser.uid);
        // The new OTP flow doesn't require email verification check here
        // as verification happens during the login/signup flow itself.
        setUser(firebaseUser);

        // When user logs in, remove anonymous id, redirect and reload sessions.
        localStorage.removeItem('anonymous_user_id');
        window.dispatchEvent(new Event('chat-updated'));
        if (pathname === '/login') {
            router.replace('/');
        }

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  useEffect(() => {
    if (!loading) {
      // Start the unlock animation after the initial loading is done
      setIsUnlocking(true);
    }
  }, [loading]);

  if (loading || !isUnlocking) {
    return <FullscreenLoader isUnlocking={isUnlocking} />;
  }

  return (
    <AuthContext.Provider value={{ user, loading: false }}>
        <div className="animate-app-fade-in-up">
            {children}
        </div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
