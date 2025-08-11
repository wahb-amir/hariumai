'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
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
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!app) {
        setLoading(false);
        return;
    }
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if(email) {
          signInWithEmailLink(auth, email, window.location.href)
            .then((result) => {
              setUser(result.user);
              window.localStorage.removeItem('emailForSignIn');
              toast({ title: 'Success!', description: 'You have been signed in.' });
              router.replace('/');
            })
            .catch((error) => {
              toast({ variant: 'destructive', title: 'Error', description: 'Invalid sign-in link.' });
            });
      }
    }

    return () => unsubscribe();
  }, [toast, router, pathname]);

  if (loading) {
    return <FullscreenLoader />;
  }

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
