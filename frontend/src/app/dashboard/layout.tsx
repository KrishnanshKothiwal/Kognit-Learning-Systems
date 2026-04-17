// frontend/src/app/dashboard/layout.tsx

import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-card/50 backdrop-blur-md border-b border-border p-4 flex justify-end transition-colors duration-500">
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
