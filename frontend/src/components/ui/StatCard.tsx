import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription } from '@/components/ui/card'; // Import CardDescription from shadcn

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string; // <-- ADD THIS LINE: Make description optional
}

export function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <ShadcnCardDescription className="text-xs text-slate-400 mt-1">{description}</ShadcnCardDescription>} {/* RENDER DESCRIPTION */}
      </CardContent>
    </Card>
  );
}