
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useRouter, usePathname } from 'next/navigation';
import FullscreenLoader from '@/components/harium-ai-loader';

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.emailVerified && pathname !== '/login') {
         // This case is handled on the login page now.
         // We can add a check here if we want to redirect unverified users from protected pages.
      }
      setUser(user);
      setLoading(false);
      
      // When user logs in, remove anonymous id, redirect and reload sessions.
      if (user) {
        localStorage.removeItem('anonymous_user_id');
        window.dispatchEvent(new Event('chat-updated'));
        if (pathname === '/login') {
            router.replace('/');
        }
      }
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
