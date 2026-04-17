// frontend/src/components/Sidebar.tsx
'use client'; // This component uses client-side hooks like useRouter, usePathname, useAuth

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // <-- Import useRouter
import { LayoutDashboard, BookOpen, BrainCircuit, NotebookText, LogOut, Settings, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext'; // <-- Import useAuth context

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); // Initialize useRouter
  const { logout } = useAuth(); // Get logout function from context

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/dashboard/notes', icon: BookOpen, label: 'Notes' },
    { href: '/dashboard/quizzes', icon: BrainCircuit, label: 'Quizzes' },
    { href: '/dashboard/journal', icon: NotebookText, label: 'Journal' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/achievements', icon: BrainCircuit, label: 'Achievements' },
  ];

  const handleLogout = () => {
    logout(); // Call the logout function
    router.replace('/login'); // Redirect to login page after logout
  };

  return (
    <aside className="w-64 bg-card/50 backdrop-blur-md border-r border-border p-4 flex flex-col transition-colors duration-500">
      <h2 className="text-2xl font-bold text-primary mb-8 tracking-tighter">Kognit</h2>
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} passHref>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-lg px-4 py-2 ${pathname === item.href ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors duration-300' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors duration-300'
                    }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-border">
        <Button
          onClick={handleLogout} 
          variant="ghost"
          className="w-full justify-start text-lg px-4 py-2 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors duration-300"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}