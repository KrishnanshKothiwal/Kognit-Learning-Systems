// frontend/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { BookOpen, BrainCircuit, Activity, Sparkles, Loader2, NotebookText } from 'lucide-react'; // Added NotebookText
import Link from 'next/link';

import { StatCard } from '@/components/ui/StatCard'; // Assuming this component exists
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { LineChart } from '@tremor/react';

// --- Define data shapes ---
interface Note {
  note_id: number;
  title: string;
  content: string; // Added content for robustness, even if only title is displayed
  summary: string | null; // Added summary as it's part of the Note model
  created_at: string; // Added created_at for potential display or sorting
}

interface UserStats {
  total_notes: number;
  quizzes_taken: number;
  average_score: number | null;
}

interface QuizHistoryItem {
  name: string;
  score: number; // Assuming score is out of 100
}

interface Nudge {
  content: string;
}

// NEW INTERFACE FOR JOURNAL SUMMARY
interface JournalSummaryStats {
  total_entries: number;
  last_entry_date: string | null;
}

export default function DashboardPage() {
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [journalStats, setJournalStats] = useState<JournalSummaryStats | null>(null); // NEW STATE
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { logout, isLoggedIn, isLoadingAuth, getToken } = useAuth();
  const router = useRouter();

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    if (isLoadingAuth) {
      return;
    }
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    // Get Firebase token
    const authToken = await getToken();
    if (!authToken) {
      setError('No authentication token found. Please log in again.');
      logout();
      setIsLoading(false);
      return;
    }

    const axiosConfig = {
      headers: { 'Authorization': `Bearer ${authToken}` },
      withCredentials: true
    };

    try {
      // Use Promise.allSettled with individual timeouts for each request
      // Reduced timeouts and limits for faster loading
      const requests = [
        axios.get(`${API_URL}/stats/`, { ...axiosConfig, timeout: 10000 }).catch(err => ({ data: { total_notes: 0, quizzes_taken: 0, average_score: null } })),
        axios.get(`${API_URL}/notes/`, { ...axiosConfig, params: { limit: 10 }, timeout: 10000 }).catch(err => ({ data: [] })),
        axios.get(`${API_URL}/nudges/daily/`, { ...axiosConfig, timeout: 10000 }).catch(err => ({ data: { content: 'Start your learning journey today!' } })),
        axios.get(`${API_URL}/stats/quiz-history/`, { ...axiosConfig, timeout: 10000 }).catch(err => ({ data: [] })),
        axios.get(`${API_URL}/journals/`, { ...axiosConfig, params: { skip: 0, limit: 10 }, timeout: 10000 }).catch(err => ({ data: [] }))
      ];

      const results = await Promise.all(requests);

      // Process results with error handling
      const [statsRes, notesRes, nudgeRes, historyRes, journalsRes] = results;

      setStats(statsRes.data || { total_notes: 0, quizzes_taken: 0, average_score: null });
      setRecentNotes((notesRes.data || []).slice(0, 5));
      setNudge(nudgeRes.data || { content: 'Start your learning journey today!' });
      setQuizHistory(historyRes.data || []);

      // Process journal data to get summary stats
      const allJournals = journalsRes.data || [];
      const total_entries = allJournals.length;
      const last_entry_date = total_entries > 0
        ? allJournals.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;
      setJournalStats({ total_entries, last_entry_date });

    } catch (err: any) {
      console.error("Could not fetch dashboard data", err);
      if (err.message === 'Request timeout') {
        setError('Request took too long. Please check your connection and try again.');
      } else {
        setError('Failed to load dashboard data. Please try again. (Is the backend running?)');
      }
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, isLoadingAuth, getToken]);

  const handleLogout = () => {
    logout();
    router.replace('/login'); // Redirect after logout
  };

  // Quick link to settings
  // You can add a button in your header/sidebar to navigate to /dashboard/settings

  const displayTotalJournalEntries = journalStats?.total_entries ?? 0;
  const displayLastJournalEntryDate = journalStats?.last_entry_date
    ? new Date(journalStats.last_entry_date).toLocaleDateString()
    : 'N/A';

  if (isLoadingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
          <p className="text-lg text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        <p>{error}</p>
        <Button onClick={fetchData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* No logout button here, moved to Sidebar.tsx for consistency if using shared layout */}
        {/* If you want it here as well, uncomment this line: */}
        {/* <Button onClick={handleLogout} variant="destructive">Log Out</Button> */}
      </header>

      {/* Performance Summary Section */}
      <Card className="card-sleek mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Your Learning Overview</CardTitle>
          <CardDescription>
            Summary of your progress, consistency, and performance across all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Learning Activity</p>
              <p className="text-2xl font-bold font-mono tracking-tighter text-primary">
                {stats?.total_notes ? `${stats.total_notes} Notes` : '0 Notes'}
              </p>
              <p className="text-xs text-foreground mt-1">
                {displayTotalJournalEntries > 0 ? `${displayTotalJournalEntries} Journal Entries` : 'No journal entries yet'}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Quiz Performance</p>
              <p className="text-2xl font-bold font-mono tracking-tighter text-primary">
                {stats?.quizzes_taken ? `${stats.quizzes_taken} Quizzes` : '0 Quizzes'}
              </p>
              <p className="text-xs text-foreground mt-1">
                {stats?.average_score !== null && stats?.average_score !== undefined
                  ? `Average: ${Number(stats.average_score).toFixed(0)}%`
                  : 'No scores yet'}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Consistency</p>
              <p className="text-2xl font-bold text-primary">
                {stats?.quizzes_taken && stats.quizzes_taken > 0 && stats?.average_score && stats.average_score >= 70
                  ? 'Great!'
                  : stats?.quizzes_taken && stats.quizzes_taken > 0
                    ? 'Keep Going!'
                    : 'Get Started!'}
              </p>
              <p className="text-xs text-foreground mt-1">
                {quizHistory.length > 0
                  ? `${quizHistory.length} Recent Attempts`
                  : 'Take your first quiz'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Grid Layout */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <StatCard
          title="Total Notes"
          value={stats?.total_notes ?? '0'}
          icon={<BookOpen className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title="Quizzes Taken"
          value={stats?.quizzes_taken ?? '0'}
          icon={<BrainCircuit className="h-4 w-4 text-slate-400" />}
        />
        <StatCard
          title="Average Score"
          value={stats?.average_score !== null && stats?.average_score !== undefined ? `${Number(stats.average_score).toFixed(0)}%` : 'N/A'}
          icon={<Activity className="h-4 w-4 text-slate-400" />}
        />
        {/* NEW JOURNAL STAT CARD */}
        <StatCard
          title="Journal Entries"
          value={displayTotalJournalEntries}
          description={displayLastJournalEntryDate !== 'N/A' ? `Last entry: ${displayLastJournalEntryDate}` : 'No entries yet.'}
          icon={<NotebookText className="h-4 w-4 text-slate-400" />} // Using NotebookText icon
        />

        <Card className="card-sleek bg-gradient-to-br from-primary/20 via-background to-background text-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Daily Nudge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-md italic">{nudge?.content ?? 'Loading today\'s motivation...'}</p>
          </CardContent>
        </Card>

        {/* Quiz History Chart */}
        <Card className="card-sleek lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Quiz Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {quizHistory.length > 0 ? (
              <div className="mt-4">
                <LineChart
                  className="h-72"
                  data={quizHistory}
                  index="name"
                  categories={["score"]}
                  colors={["indigo"]}
                  yAxisWidth={40}
                  valueFormatter={(number) => `${number}%`}
                  showAnimation={true}
                />
              </div>
            ) : (
              <p className="text-slate-400 text-sm h-32 flex items-center justify-center">Take a quiz to see your performance history.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Notes Widget */}
        <Card className="card-sleek lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notes</CardTitle>
            <Link href="/dashboard/notes">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentNotes.length > 0 ? (
              <div className="grid gap-2">
                {recentNotes.map((note) => (
                  <Link key={note.note_id} href={`/dashboard/notes/${note.note_id}`} passHref>
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 transition-colors duration-150 cursor-pointer">
                      <BookOpen className="h-5 w-5 text-indigo-400" />
                      <span className="text-slate-200 hover:text-white">{note.title}</span>
                      {/* You could add note.summary or part of note.content here if desired, e.g.: */}
                      {/* {note.summary && <p className="text-sm text-slate-400 line-clamp-1">{note.summary}</p>} */}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white text-sm">You haven't created any notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}