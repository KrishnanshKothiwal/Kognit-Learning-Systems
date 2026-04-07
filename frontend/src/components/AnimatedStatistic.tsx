// In frontend/src/components/AnimatedStatistic.tsx

'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';

type AnimatedStatisticProps = {
  to: number;
  title: string;
  icon: React.ReactNode;
};

export function AnimatedStatistic({ to, title, icon }: AnimatedStatisticProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && ref.current) {
      const node = ref.current;
      const controls = animate(0, to, {
        duration: 2,
        onUpdate(value) {
          node.textContent = Math.round(value).toString();
        },
      });
      return () => controls.stop();
    }
  }, [isInView, to]);

  return (
    <div className="flex flex-col items-center text-center p-4">
      {icon}
      <div className="flex items-baseline">
        <p ref={ref} className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
          0
        </p>
        <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">%</span>
      </div>
      <p className="text-slate-400 mt-2">{title}</p>
    </div>
  );
}