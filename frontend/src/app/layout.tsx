// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { PageTransition } from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kognit",
  description: "Your AI Study Companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.className} ${inter.className}`}>
        <AuthProvider> {/* AuthProvider should be the outermost wrapper for authentication */}
          <PageTransition> {/* PageTransition wraps the actual page content */}
            {children}
          </PageTransition>
        </AuthProvider>
      </body>
    </html>
  );
}