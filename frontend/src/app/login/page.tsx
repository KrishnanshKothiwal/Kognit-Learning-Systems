// frontend/src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isLoggedIn, isLoadingAuth } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoadingAuth && isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, isLoadingAuth, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Login will redirect to dashboard automatically
    } catch (err: any) {
      // Handle Firebase auth errors
      let errorMessage = 'An unexpected error occurred.';
      if (err.message) {
        if (err.message.includes('user-not-found')) {
          errorMessage = 'No account found with this email.';
        } else if (err.message.includes('wrong-password') || err.message.includes('invalid-credential')) {
          errorMessage = 'Incorrect email or password.';
        } else if (err.message.includes('too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (err.message.includes('network-request-failed')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-slate-950 p-8 text-center relative overflow-hidden">
        <ParticleBackground />
        <div className="z-10 space-y-4">
          <Image src="/images/logo.jpg" alt="Kognit Logo" width={80} height={80} className="mx-auto rounded-full" />
          <h1 className="text-4xl font-bold text-slate-50">Welcome Back</h1>
          <p className="text-slate-400 max-w-md">
            Sign in to continue your journey and unlock your full academic potential.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center py-12 bg-slate-900">
        <div className="mx-auto grid w-[350px] gap-6">
          <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 relative">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="ml-auto inline-block text-xs underline hover:text-indigo-400">
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-200">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="underline hover:text-indigo-400">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
