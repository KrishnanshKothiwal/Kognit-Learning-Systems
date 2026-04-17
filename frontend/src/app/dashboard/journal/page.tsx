// frontend/src/app/dashboard/journal/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Loader2, Trash2, Edit3 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

interface JournalEntry {
  entry_id: number;
  title: string | null;
  content: string;
  summary: string | null;
  emotions: string | null; // JSON string
  ai_nudge: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export default function JournalListPage() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    const fetchJournalEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Skip backend check in production or if API_URL is not localhost
        const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
        if (isLocalhost) {
          const { checkBackendConnection } = await import('@/lib/backend-check');
          const isOnline = await checkBackendConnection();
          if (!isOnline) {
            setError('Backend server is not responding. Please ensure the backend server is running on port 8000.');
            setIsLoading(false);
            return;
          }
        }

        const authToken = await getAuthToken();
        if (!authToken) {
          setError('No authentication token found. Please log in again.');
          logout();
          router.replace('/login');
          return;
        }
        const response = await axios.get<JournalEntry[]>(`${API_URL}/journals/`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
            skip: 0,
            limit: 30
          },
          timeout: 10000  // Reduced timeout
        });
        setJournalEntries(response.data || []);
      } catch (err: any) {
        console.error('Failed to fetch journal entries:', err);
        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
            setError('Cannot connect to backend server. Please ensure the backend is running on http://127.0.0.1:8000');
          } else if (err.code === 'ECONNABORTED') {
            setError('Request timed out. The backend server may be slow or unresponsive.');
          } else if (err.response?.status === 401) {
            setError('Session expired or unauthorized. Please log in again.');
            logout();
            router.replace('/login');
          } else {
            setError(`Failed to load journal entries: ${err.message || 'Unknown error'}`);
          }
        } else {
          setError('Failed to load journal entries.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchJournalEntries();
    } else {
      setError('No authentication token found. Please log in again.');
      setIsLoading(false);
    }
  }, [isLoggedIn, router, logout]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-slate-700 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="h-6 w-64 bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50">Your Journal</h1>
          <Link href="/dashboard/journal/new" passHref>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <PlusCircle className="h-5 w-5 mr-2" />
              New Entry
            </Button>
          </Link>
        </div>
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-red-400 text-lg font-semibold">{error}</p>
              <div className="space-y-2 text-sm text-slate-400">
                <p>To fix this issue:</p>
                <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>Open a terminal in the <code className="bg-slate-800 px-2 py-1 rounded">backend</code> folder</li>
                  <li>Run: <code className="bg-slate-800 px-2 py-1 rounded">python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000</code></li>
                  <li>Wait for the server to start</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Retry
                </Button>
                <Button onClick={() => router.replace('/login')} variant="outline" className="mt-4 border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700">
                  Go to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50">Your Journal</h1>
        <Link href="/dashboard/journal/new" passHref>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> New Entry
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {journalEntries.length === 0 ? (
          <p className="text-slate-400 text-lg col-span-full">You haven't written any journal entries yet. Time to reflect!</p>
        ) : (
          journalEntries.map((entry) => (
            <Card key={entry.entry_id} className="bg-slate-800/50 border-slate-700 text-slate-50 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{entry.title || `Entry #${entry.entry_id}`}</CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  {new Date(entry.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-slate-300 line-clamp-3">{entry.content}</p>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                 <Link href={`/dashboard/journal/${entry.entry_id}`} passHref>
                    <Button variant="outline" className="border-emerald-500 text-emerald-300 hover:bg-emerald-900/30">
                        View
                    </Button>
                 </Link>
                 <Link href={`/dashboard/journal/${entry.entry_id}`} passHref>
                    <Button variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white">
                        <Edit3 className="mr-2 h-4 w-4"/> Edit
                    </Button>
                 </Link>
                 <Button variant="destructive" className="ml-auto" onClick={async ()=>{
                    if(!confirm('Delete this journal entry?')) return;
                    try {
                      const authToken = await getAuthToken();
                      if (!authToken) {
                        setError('No authentication token found. Please log in again.');
                        return;
                      }
                      await axios.delete(`${API_URL}/journals/${entry.entry_id}`, { headers: { Authorization: `Bearer ${authToken}` }});
                      setJournalEntries(prev=>prev.filter(e=>e.entry_id!==entry.entry_id));
                    } catch(e){
                      console.error('Delete failed', e);
                    }
                 }}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                 </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}