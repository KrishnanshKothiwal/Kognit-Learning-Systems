// frontend/src/app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen, BrainCircuit, Sparkles, Target, UploadCloud, Bot, Trophy, Quote, Zap, Clock, TrendingUp,
} from 'lucide-react'; // Removed Loader2 and related imports
import { useEffect, useRef } from 'react'; // Removed useState and useRouter
import { AnimatedStatistic } from '@/components/AnimatedStatistic';

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function LandingPage() {
  // REMOVED: const router = useRouter();
  // REMOVED: const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 50, mass: 0.5 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 50, mass: 0.5 });

  // REMOVED: The entire useEffect for authentication check

  // --- MOUSE MOVE EFFECT (keep this) ---
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (heroRef.current) {
        const { left, top } = heroRef.current.getBoundingClientRect();
        mouseX.set(event.clientX - left);
        mouseY.set(event.clientY - top);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  const features: Feature[] = [
    {
      icon: <BookOpen className="w-8 h-8 text-indigo-500" />,
      title: 'Smart Notes Analyzer',
      description: "Turn lengthy study notes into concise summaries and interactive flashcards in seconds. Our AI finds what's most important, so you can focus.",
    },
    {
      icon: <Target className="w-8 h-8 text-indigo-500" />,
      title: 'Adaptive Quiz Engine',
      description: 'Test your knowledge with quizzes that adapt to your performance. The difficulty adjusts to keep you challenged and reinforce learning.',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-indigo-500" />,
      title: 'Motivation Nudges',
      description: 'Receive timely, personalized motivational messages to combat procrastination and celebrate your achievements. Stay on track, even on tough days.',
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-indigo-500" />,
      title: 'Emotion Analysis',
      description: 'Your well-being matters. A private journal helps our AI detect signs of burnout or stress, suggesting helpful breaks when you need them most.',
    },
  ];

  const howItWorksSteps = [
    {
      icon: <UploadCloud />,
      title: '1. Upload Your Notes',
      description: 'Simply upload your PDF, text files, or paste your study material directly into the platform.',
    },
    {
      icon: <Bot />,
      title: '2. Let AI Do the Work',
      description: 'Our AI analyzes your content, generating summaries, flashcards, and potential quiz questions.',
    },
    {
      icon: <Trophy />,
      title: '3. Ace Your Exams',
      description: 'Study with interactive, adaptive tools and track your progress on your personal dashboard.',
    },
  ];

  // REMOVED: The entire 'if (isCheckingAuth) { ... }' block

  // Otherwise, render the landing page content (unconditionally)
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-50">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 fixed w-full z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="#" className="flex items-center justify-center">
            <Image src="/images/logo.jpg" alt="Kognit Logo" width={32} height={32} className="rounded-full" />
            <span className="ml-3 text-lg font-bold">Kognit</span>
          </Link>
          <nav className="flex gap-4 sm:gap-6 items-center">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-slate-800 hover:text-slate-50">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity">Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section ref={heroRef} className="w-full py-24 md:py-32 lg:py-48 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 bg-glow-gradient rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"
            style={{
              x: smoothMouseX,
              y: smoothMouseY,
            }}
          />
          <div className="container px-4 md:px-6 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
                Unlock Your Full Academic Potential
              </h1>
              <p className="mx-auto max-w-[700px] text-slate-300 md:text-xl">
                Kognit is your personal AI study companion. We turn your notes into smart quizzes, keep you motivated, and help you learn smarter, not just harder.
              </p>
              <Link href="/signup">
                <Button size="lg" className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity">Get Started for Free</Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">From Study Chaos to Organized Clarity</h2>
              <p className="max-w-[900px] text-slate-400 md:text-xl">
                Stop drowning in paper. Start engaging with your material in a smarter way.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <Image
                  src="/images/before-graphic.png"
                  alt="Messy notes transforming into organized digital icons"
                  width={600}
                  height={400}
                  className="mx-auto rounded-lg"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-25"></div>
                <Image
                  src="/images/after-mockup.png"
                  alt="Sleek Kognit dashboard mockup"
                  width={600}
                  height={400}
                  className="mx-auto rounded-lg relative"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-950/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Smarter Way to Study</h2>
              <p className="max-w-[900px] text-slate-400 md:text-xl">
                Kognit isn't just another app. It's a system designed to work with you.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <Card className="shimmer-card relative overflow-hidden bg-slate-800/50 border-slate-700 h-full flex flex-col hover:border-indigo-500 transition-colors">
                    <CardHeader className="flex flex-row items-center gap-4">
                      {feature.icon}
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-slate-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get Started in 3 Easy Steps</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 bg-slate-800 rounded-full border border-slate-700">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-950/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <AnimatedStatistic
                to={40}
                title="Reduction in Manual Prep Time"
                icon={<Clock className="w-10 h-10 text-indigo-500 mb-2" />}
              />
              <AnimatedStatistic
                to={80}
                title="Increase in Knowledge Retention"
                icon={<TrendingUp className="w-10 h-10 text-indigo-500 mb-2" />}
              />
              <AnimatedStatistic
                to={95}
                title="of Beta Users Felt More Confident"
                icon={<Zap className="w-10 h-10 text-indigo-500 mb-2" />}
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Loved by Students Everywhere</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 text-indigo-500 mb-4" />
                  <blockquote className="text-lg text-slate-300">
                    "The AI summaries saved me hours of reading for my history final. I could focus on what actually mattered. I've never felt more prepared!"
                  </blockquote>
                  <p className="font-bold mt-4">- Sarah J., University Student</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 text-indigo-500 mb-4" />
                  <blockquote className="text-lg text-slate-300">
                    "I used to procrastinate all the time, but the motivation nudges actually work. It feels like having a personal coach in your pocket. Game-changer."
                  </blockquote>
                  <p className="font-bold mt-4">- Michael B., High School Senior</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex items-center justify-center py-6 border-t border-slate-700">
        <p className="text-sm text-slate-400">© 2025 Kognit. All rights reserved.</p>
      </footer>
    </div>
  );
}