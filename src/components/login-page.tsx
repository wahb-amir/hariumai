
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  sendSignInLinkToEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
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

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const actionCodeSettings = {
      url: `${window.location.origin}/`,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setEmailSent(true);
      toast({
        title: 'Check your email',
        description: `A sign-in link has been sent to ${email}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });
    }
    return window.recaptchaVerifier;
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const recaptchaVerifier = setupRecaptcha();
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setCodeSent(true);
      toast({
        title: 'Code sent',
        description: `An SMS with a verification code has been sent to ${phone}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
          // @ts-ignore
          grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (window.confirmationResult) {
      try {
        await window.confirmationResult.confirm(code);
        toast({
          title: 'Success!',
          description: 'You have been signed in.',
        });
        router.push('/');
      } catch (error: any) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid verification code.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <Link href="/" className="flex justify-center items-center gap-2 mb-4">
                <HariumLogo />
                <h1 className="text-2xl font-black">HariumAI</h1>
            </Link>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Choose your preferred method to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              {emailSent ? (
                <div className="text-center p-8">
                  <h3 className="text-lg font-semibold mb-2">Check your inbox!</h3>
                  <p className="text-muted-foreground">
                    A sign-in link has been sent to <strong>{email}</strong>. Click the link to complete sign-in.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Sign-In Link'}
                  </Button>
                </form>
              )}
            </TabsContent>
            <TabsContent value="phone">
                <div className="pt-4">
                    {!codeSent ? (
                        <form onSubmit={handlePhoneLogin} className="space-y-4">
                            <Input
                                type="tel"
                                placeholder="+1 123 456 7890"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Verification Code'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <p className="text-sm text-center text-muted-foreground">
                                Enter the code sent to <strong>{phone}</strong>.
                            </p>
                            <Input
                                type="text"
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Verifying...' : 'Verify and Sign In'}
                            </Button>
                        </form>
                    )}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
