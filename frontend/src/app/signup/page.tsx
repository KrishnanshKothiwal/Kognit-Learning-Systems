'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// NEW: Dynamically import the ParticleBackground component with SSR turned off
import dynamic from 'next/dynamic';
const ParticleBackground = dynamic(
  () => import('@/components/ParticleBackground').then((mod) => mod.ParticleBackground),
  { ssr: false }
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { signup, isLoggedIn, isLoadingAuth } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoadingAuth && isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, isLoadingAuth, router]);

  const passwordRequirements = useMemo(() => ({
    length: password.length >= 8,
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);
  
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      animateFormError();
      return;
    }
    if (!allRequirementsMet) {
      setError('Password does not meet all requirements.');
      animateFormError();
      return;
    }
    
    setIsLoading(true);
    try {
      await signup(email, password);
      setIsSuccess(true);
      // Signup will redirect to dashboard automatically
    } catch (err: any) {
      // Handle Firebase auth errors
      let errorMessage = 'An unexpected error occurred.';
      if (err.message) {
        if (err.message.includes('email-already-in-use')) {
          errorMessage = 'An account with this email already exists.';
        } else if (err.message.includes('weak-password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (err.message.includes('invalid-email')) {
          errorMessage = 'Invalid email address.';
        } else if (err.message.includes('network-request-failed')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      animateFormError();
    } finally {
      setIsLoading(false);
    }
  };
  
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } }
  };
  
  const [animation, setAnimation] = useState('visible');
  const animateFormError = () => {
    setAnimation('shake');
    setTimeout(() => setAnimation('visible'), 500);
  };

  if (isLoadingAuth || isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
          <p className="text-lg text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 relative">
      <div className="hidden lg:flex flex-col items-center justify-center bg-slate-950 p-8 text-center relative overflow-hidden">
        <ParticleBackground />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="z-10 space-y-4">
          <div className="text-center">
            <Image src="/images/logo.jpg" alt="Kognit Logo" width={80} height={80} className="mx-auto rounded-full" />
            <h1 className="text-4xl font-bold text-slate-50 mt-4">Welcome to Kognit</h1>
            <p className="mt-2 text-slate-400">Create an account to continue your learning journey.</p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-center py-12 bg-slate-900">
        <div className="mx-auto grid w-[380px] gap-6">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div key="success" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <Card className="bg-slate-800/50 border-slate-700 text-slate-50 text-center">
                  <CardHeader>
                    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                    <CardTitle className="text-2xl mt-4">Account Created!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Welcome to Kognit! You've been signed in automatically.</p>
                    <p className="text-sm text-slate-400 mt-2">Please check your email to verify your account.</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard" className="w-full">
                      <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">Go to Dashboard</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="form" variants={formVariants} initial="hidden" animate={animation} exit="exit">
                <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
                  <CardHeader>
                    <CardTitle className="text-2xl">Create an Account</CardTitle>
                    <CardDescription>Enter your details below to start your journey.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="grid gap-2 relative">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[29px] text-slate-400 hover:text-slate-200">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="grid gap-2 relative">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input id="confirm-password" type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p className={passwordRequirements.length ? 'text-green-400' : ''}>✓ At least 8 characters</p>
                        <p className={passwordRequirements.number ? 'text-green-400' : ''}>✓ At least one number</p>
                        <p className={passwordRequirements.specialChar ? 'text-green-400' : ''}>✓ At least one special character</p>
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                      <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <div className="mt-4 text-center text-sm">
                      Already have an account?{' '}
                      <Link href="/login" className="underline hover:text-indigo-400">Login</Link>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
