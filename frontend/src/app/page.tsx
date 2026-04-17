'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen, BrainCircuit, Sparkles, Target, UploadCloud, Bot, Trophy, Quote, Zap, Clock, TrendingUp,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AnimatedStatistic } from '@/components/AnimatedStatistic';

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 50, mass: 0.5 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 50, mass: 0.5 });

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
      icon: <BookOpen className="w-8 h-8 text-neutral-100 group-hover:text-black transition-colors" />,
      title: 'Smart Notes Analyzer',
      description: "Turn lengthy study notes into concise summaries and interactive flashcards in seconds. Our AI finds what's most important, so you can focus.",
    },
    {
      icon: <Target className="w-8 h-8 text-neutral-100 group-hover:text-black transition-colors" />,
      title: 'Adaptive Quiz Engine',
      description: 'Test your knowledge with quizzes that adapt to your performance. The difficulty adjusts to keep you challenged and reinforce learning.',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-neutral-100 group-hover:text-black transition-colors" />,
      title: 'Motivation Nudges',
      description: 'Receive timely, personalized motivational messages to combat procrastination and celebrate your achievements. Stay on track, even on tough days.',
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-neutral-100 group-hover:text-black transition-colors" />,
      title: 'Emotion Analysis',
      description: 'Your well-being matters. A private journal helps our AI detect signs of burnout or stress, suggesting helpful breaks when you need them most.',
    },
  ];

  const howItWorksSteps = [
    {
      icon: <UploadCloud className="w-8 h-8 text-neutral-100" />,
      title: '1. Upload Your Notes',
      description: 'Simply upload your PDF, text files, or paste your study material directly into the platform.',
    },
    {
      icon: <Bot className="w-8 h-8 text-neutral-100" />,
      title: '2. Let AI Do the Work',
      description: 'Our AI analyzes your content, generating summaries, flashcards, and potential quiz questions.',
    },
    {
      icon: <Trophy className="w-8 h-8 text-neutral-100" />,
      title: '3. Ace Your Exams',
      description: 'Study with interactive, adaptive tools and track your progress on your personal dashboard.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-neutral-50 overflow-hidden font-sans">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-black/80 backdrop-blur-md border-b border-neutral-900 fixed w-full z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="#" className="flex items-center justify-center">
            <span className="text-lg font-black tracking-widest uppercase">Kognit</span>
          </Link>
          <nav className="flex gap-4 sm:gap-6 items-center">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-neutral-900 hover:text-neutral-50 rounded-none font-medium">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-black hover:bg-neutral-200 transition-colors rounded-none font-bold uppercase tracking-wide">Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section ref={heroRef} className="w-full py-24 md:py-32 lg:py-48 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <h1 className="text-[30vw] font-black leading-none tracking-tighter">STUDY</h1>
          </div>
          <motion.div
            className="absolute top-0 left-0 w-[500px] h-[500px] bg-neutral-800/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
            style={{
              x: smoothMouseX,
              y: smoothMouseY,
            }}
          />
          <div className="container px-4 md:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl uppercase">
                Unlock Your Full <br /> Academic Potential
              </h1>
              <p className="mx-auto max-w-[700px] text-neutral-400 md:text-xl font-light">
                Kognit is your personal AI study companion. We turn your notes into smart quizzes, keep you motivated, and help you learn smarter, not just harder.
              </p>
              <div className="pt-8">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-black hover:bg-neutral-200 transition-colors uppercase tracking-widest font-bold rounded-none px-8 py-6 h-auto">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Big Kognit in the middle section! Replacing mockups */}
        <section className="w-full py-32 md:py-48 bg-neutral-950 flex flex-col items-center justify-center overflow-hidden relative border-y border-neutral-900">
           <div className="container px-4 md:px-6 z-10 flex flex-col items-center justify-center">
             <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
               <h2 className="text-3xl font-black tracking-tighter sm:text-5xl uppercase">From Study Chaos to Organized Clarity</h2>
               <p className="max-w-[900px] text-neutral-400 md:text-xl font-light">
                 Stop drowning in paper. Start engaging with your material in a smarter way.
               </p>
             </div>
             <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                viewport={{ once: true }}
                className="w-full flex justify-center py-12"
             >
                <h2 className="text-[18vw] md:text-[22vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-900 leading-none select-none drop-shadow-2xl">
                   KOGNIT
                </h2>
             </motion.div>
           </div>
           
           {/* Subtle glow behind text */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl max-h-3xl bg-white/5 blur-[150px] rounded-full pointer-events-none" />
        </section>

        <section className="w-full py-24 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-black tracking-tighter sm:text-5xl uppercase">A Smarter Way to Study</h2>
              <p className="max-w-[900px] text-neutral-400 md:text-xl font-light">
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
                  className="h-full"
                >
                  <Card className="h-full bg-neutral-950 border-neutral-900 hover:border-neutral-700 transition-colors group rounded-none">
                    <CardHeader className="flex flex-col items-start gap-4 space-y-0">
                      <div className="p-4 bg-black border border-neutral-800 group-hover:bg-white group-hover:text-black transition-colors rounded-none">
                        {feature.icon}
                      </div>
                      <CardTitle className="tracking-tight uppercase font-bold">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-neutral-400 leading-relaxed font-light">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-24 md:py-32 bg-neutral-950 border-y border-neutral-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-black tracking-tighter sm:text-5xl uppercase">Get Started in 3 Easy Steps</h2>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="flex items-center justify-center w-24 h-24 mb-6 bg-black rounded-none border border-neutral-800 group-hover:border-neutral-500 transition-colors">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight uppercase">{step.title}</h3>
                  <p className="text-neutral-400 font-light leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-24 md:py-32 border-b border-neutral-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <AnimatedStatistic
                to={40}
                title="Reduction in Prep Time"
                icon={<Clock className="w-10 h-10 text-neutral-100 mb-4" />}
              />
              <AnimatedStatistic
                to={80}
                title="Increase in Knowledge Retention"
                icon={<TrendingUp className="w-10 h-10 text-neutral-100 mb-4" />}
              />
              <AnimatedStatistic
                to={95}
                title="Users Felt More Confident"
                icon={<Zap className="w-10 h-10 text-neutral-100 mb-4" />}
              />
            </div>
          </div>
        </section>

        <section className="w-full py-24 md:py-32 bg-neutral-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-black tracking-tighter sm:text-5xl uppercase">Loved by Students Everywhere</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              <Card className="bg-black border-neutral-900 rounded-none hover:border-neutral-700 transition-colors">
                <CardContent className="pt-8 px-8">
                  <Quote className="w-8 h-8 text-neutral-500 mb-6" />
                  <blockquote className="text-lg text-neutral-300 font-light leading-relaxed">
                    "The AI summaries saved me hours of reading for my history final. I could focus on what actually mattered. I've never felt more prepared!"
                  </blockquote>
                  <p className="font-bold mt-6 tracking-wide uppercase text-sm text-neutral-500">- Sarah J., University Student</p>
                </CardContent>
              </Card>
              <Card className="bg-black border-neutral-900 rounded-none hover:border-neutral-700 transition-colors">
                <CardContent className="pt-8 px-8">
                  <Quote className="w-8 h-8 text-neutral-500 mb-6" />
                  <blockquote className="text-lg text-neutral-300 font-light leading-relaxed">
                    "I used to procrastinate all the time, but the motivation nudges actually work. It feels like having a personal coach in your pocket. Game-changer."
                  </blockquote>
                  <p className="font-bold mt-6 tracking-wide uppercase text-sm text-neutral-500">- Michael B., High School Senior</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex items-center justify-center py-8 border-t border-neutral-900 bg-black">
        <p className="text-sm text-neutral-500 font-light tracking-widest uppercase">© 2025 Kognit. All rights reserved.</p>
      </footer>
    </div>
  );
}