'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, BookOpen, Smile, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

interface JournalEntry {
  entry_id: number;
  title: string | null;
  content: string;
  summary: string | null;
  emotions: string | null; // JSON string from backend, e.g. '{"emotions":["happy"],"sentiment":"positive"}'
  ai_nudge: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
}

interface ParsedEmotions {
  emotions: string[];
  sentiment: string;
}

function parseEmotions(raw: string | null): ParsedEmotions | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Support both shapes: { emotions: [...], sentiment: "..." } or just [...] 
    if (Array.isArray(parsed)) {
      return { emotions: parsed, sentiment: '' };
    }
    if (parsed.emotions || parsed.sentiment) {
      return {
        emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
        sentiment: parsed.sentiment ?? '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function JournalDetailPage({ params }: { params: Promise<{ entry_id: string }> | { entry_id: string } }) {
  const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
  const entry_id = resolvedParams.entry_id;

  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (!entry_id) {
      setError('Journal Entry ID is missing.');
      setIsLoading(false);
      return;
    }

    const fetchJournalEntry = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          setError('No authentication token found. Please log in again.');
          logout();
          router.replace('/login');
          return;
        }
        const response = await axios.get<JournalEntry>(`${API_URL}/journals/${entry_id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setJournalEntry(response.data);
      } catch (err: any) {
        console.error('Failed to fetch journal entry:', err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Journal entry not found.');
        } else if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
          logout();
          router.replace('/login');
        } else {
          setError('Failed to load journal entry data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchJournalEntry();
  }, [entry_id, isLoggedIn, router, logout]);

  const parsedEmotions = journalEntry ? parseEmotions(journalEntry.emotions) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Loading journal entry...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        <p>{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  if (!journalEntry) {
    return (
      <div className="text-center text-slate-400 py-10">
        <p>No journal entry data available or entry not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50">
          {journalEntry.title || `Journal Entry #${journalEntry.entry_id}`}
        </h1>
      </div>

      {/* Original Entry Content */}
      <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Your Entry
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Written on: {new Date(journalEntry.created_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap">
            <p>{journalEntry.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      {journalEntry.summary && (
        <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" /> AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-200 whitespace-pre-wrap">{journalEntry.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Emotions */}
      {parsedEmotions && (parsedEmotions.emotions.length > 0 || parsedEmotions.sentiment) && (
        <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-purple-400" /> Detected Emotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-2">
              {parsedEmotions.emotions.map((emotion: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-purple-800/50 text-purple-200 capitalize">
                  {emotion}
                </Badge>
              ))}
              {parsedEmotions.sentiment && (
                <Badge variant="secondary" className="capitalize bg-green-800/50 text-green-200">
                  Sentiment: {parsedEmotions.sentiment}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Nudge */}
      {journalEntry.ai_nudge && (
        <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-400" /> Personalized Nudge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg italic text-slate-200 whitespace-pre-wrap">"{journalEntry.ai_nudge}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
