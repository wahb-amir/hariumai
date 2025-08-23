
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { HariumLogo } from './harium-logo';
import Link from 'next/link';
import { createUser } from '@/services/user-service';
import { Loader2 } from 'lucide-react';
import { sendOtp } from '@/ai/flows/send-otp';
import { verifyOtp } from '@/ai/flows/verify-otp';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'auth' | 'otp'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { toast } = useToast();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      await createUser({
        userId: userCredential.user.uid,
        name: name,
        email: email,
      });

      await sendOtp({ email });

      toast({
        title: 'Account Created!',
        description: 'An OTP has been sent to your email. Please verify to continue.',
      });
      setCurrentView('otp');
      setAuthMode('signup');
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please sign in or use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. It must be at least 6 characters long.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRequestOtpForSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await sendOtp({ email });
        toast({
            title: 'OTP Sent',
            description: 'A one-time password has been sent to your email.',
        });
        setCurrentView('otp');
        setAuthMode('signin');
    } catch (error: any) {
        console.error('Error requesting OTP', error);
        toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: error.message || 'Could not send OTP. Please check the email and try again.',
        });
    } finally {
        setIsLoading(false);
    }
  }


  const handleVerifyOtpAndSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { success } = await verifyOtp({ email, otp });
      if (success) {
        // OTP is verified, now we need to sign the user in with Firebase
        await signInWithEmailAndPassword(auth, email, password);
        toast({
            title: 'Signed In!',
            description: 'Welcome to Harium AI!',
        });
        router.push('/');
      } else {
        throw new Error('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: error.message || 'An error occurred during verification.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtpForSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const { success } = await verifyOtp({ email, otp });
        if (success) {
             toast({
                title: 'Email Verified!',
                description: 'Your account is verified. You can now sign in.',
            });
            // Sign out the user, force them to the sign-in tab
            await auth.signOut();
            setCurrentView('auth');
            // We can't programmatically switch tabs, but we can reset state
            // so the user sees the sign-in screen.
            setEmail('');
            setPassword('');
        } else {
            throw new Error('Invalid OTP. Please try again.');
        }
    } catch (error: any) {
         console.error(error);
        toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: error.message || 'An error occurred during verification.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  const renderAuthView = () => (
    <Tabs defaultValue="signin" onValueChange={(val) => { setEmail(''); setPassword(''); setName('');}}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Create Account</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <form onSubmit={handleRequestOtpForSignIn} className="space-y-4 pt-4">
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In with OTP
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="signup">
        <form onSubmit={handleSignUp} className="space-y-4 pt-4">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );

  const renderOtpView = () => (
     <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Check your inbox!</h3>
        <p className="text-muted-foreground mb-4">
            An OTP has been sent to <strong>{email}</strong>. Enter it below to continue.
        </p>
        <form onSubmit={authMode === 'signin' ? handleVerifyOtpAndSignIn : handleVerifyOtpForSignUp} className="space-y-4">
             <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isLoading}
                className="text-center"
            />
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify and {authMode === 'signin' ? 'Sign In' : 'Complete Registration'}
            </Button>
        </form>
        <Button variant="link" onClick={() => setCurrentView('auth')} className="mt-4">Back to Sign In</Button>
    </div>
  )


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <Link href="/" className="flex justify-center items-center gap-2 mb-4">
                <HariumLogo />
                <h1 className="text-2xl font-black">HariumAI</h1>
            </Link>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            {currentView === 'auth' ? 'Sign in or create an account to continue.' : 'Please verify your email to proceed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {currentView === 'auth' ? renderAuthView() : renderOtpView()}
        </CardContent>
      </Card>
    </div>
  );
}
