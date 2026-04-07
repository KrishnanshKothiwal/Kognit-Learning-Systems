// frontend/src/app/dashboard/notes/[note_id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // <-- Import CardDescription
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, BrainCircuit, Trash2, Edit3, Sparkles } from 'lucide-react'; 
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper'; 


interface Note {
  note_id: number;
  title: string;
  content: string;
  summary?: string;       
  created_at?: string;
  updated_at?: string;
}

export default function NoteDetailPage({ params }: { params: Promise<{ note_id: string }> | { note_id: string } }) {
  const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
  const note_id = resolvedParams.note_id;
  const router = useRouter();
  const { token, isLoggedIn, isLoadingAuth, logout } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('fr');
  const [translatedText, setTranslatedText] = useState('');
  useEffect(() => {
    if (isLoadingAuth) return; // Wait for Firebase to initialize
    
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (!note_id) {
      setError('Note ID is missing.');
      setIsLoading(false);
      return;
    }

    const fetchNote = async () => {
      setIsLoading(true);
      setError('');
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          setError('No authentication token found. Please log in again.');
          logout();
          router.replace('/login');
          return;
        }
        const response = await axios.get(`${API_URL}/notes/${note_id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setNote(response.data);
      } catch (err: any) {
        console.error('Failed to fetch note:', err);
        if (err.response?.status === 404) {
          setError('Note not found.');
        } else if (err.response?.status === 401) {
          logout();
        } else {
          setError('Failed to load note data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchNote();
    } else {
      setError('No authentication token found. Please log in again.');
      setIsLoading(false);
    }
  }, [note_id, isLoggedIn, router, logout]);

  const handleGenerateQuiz = async () => {
      setIsGeneratingQuiz(true);
      try {
          const authToken = await getAuthToken();
          if (!authToken) {
              setError('No authentication token found. Please log in again.');
              setIsGeneratingQuiz(false);
              return;
          }
          const response = await axios.post(
              `${API_URL}/quizzes/generate-from-note/${note_id}?num_questions=${Math.max(1, Math.min(20, numQuestions))}&difficulty=${difficulty}`,
              {},
              { headers: { Authorization: `Bearer ${authToken}` }, timeout: 120000 }
          );
          const newQuizId = response.data.quiz_id;
          router.push(`/dashboard/quizzes/${newQuizId}`);
      } catch (err: any) {
          console.error("Failed to generate quiz", err);
          setError(err.response?.data?.detail || "Failed to generate quiz.");
      } finally {
          setIsGeneratingQuiz(false);
      }
  };

  const handleSummarize = async () => {
    if (!note) return;
    setIsSummarizing(true);
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        setError('No authentication token found. Please log in again.');
        setIsSummarizing(false);
        return;
      }
      await axios.post(
        `${API_URL}/notes/${note_id}/summarize`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      // refresh note
      const refreshed = await axios.get(`${API_URL}/notes/${note_id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNote(refreshed.data);
    } catch (e) {
      setError('Failed to summarize note.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        setError('No authentication token found. Please log in again.');
        setIsDeleting(false);
        return;
      }
      await axios.delete(`${API_URL}/notes/${note_id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      router.replace('/dashboard/notes');
    } catch (e) {
      setError('Failed to delete note.');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = () => {
    if (!note) return;
    setEditTitle(note.title);
    setEditContent(note.content || '');
    setIsEditing(true);
  };

  const saveEdit = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      const resp = await axios.put(`${API_URL}/notes/${note_id}`,
        { title: editTitle, content: editContent },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setNote(resp.data);
      setIsEditing(false);
    } catch (e) {
      setError('Failed to save changes.');
    }
  };
  const handleTranslate = async () => {
    if (!note) return;
    setIsTranslating(true);
    try {
      const authToken = await getAuthToken();
      const resp = await axios.post(
        `${API_URL}/notes/${note_id}/translate`,
        new URLSearchParams({ target_lang: targetLang }),
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setTranslatedText(resp.data.translated_text);
    } catch (e) {
      setError('Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Loading note...
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

  // If note is null after loading and no error, this means no data found
  if (!note) {
    return (
      <div className="text-center text-slate-400 py-10">
        <p>No note data available or note not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
  <div className="space-y-6">
    {/* ─── HEADER & ACTIONS ───────────────────────────── */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold">{note.title}</h1>
      </div>

      {/* ─── ACTION BUTTONS ───────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Number of questions */}
        <input
          type="number"
          min={1}
          max={20}
          value={numQuestions}
          onChange={(e) => setNumQuestions(parseInt(e.target.value || '5'))}
          className="w-20 bg-slate-700 border-slate-600 text-white rounded px-2 py-1"
          placeholder="Questions"
        />

        {/* Quiz difficulty */}
        <Select
          value={difficulty}
          onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
        >
          <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        {/* Summarize */}
        <Button
          onClick={handleSummarize}
          disabled={isSummarizing}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isSummarizing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isSummarizing ? 'Summarizing...' : 'Summarize'}
        </Button>

        {/* Generate Quiz */}
        <Button
          onClick={handleGenerateQuiz}
          disabled={isGeneratingQuiz || !note.content}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isGeneratingQuiz ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
          )}
          {isGeneratingQuiz ? 'Generating Quiz...' : 'Generate Quiz'}
        </Button>

        {/* Edit */}
        <Button onClick={startEdit} variant="outline" className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700">
          <Edit3 className="mr-2 h-4 w-4" /> Edit
        </Button>

        {/* Delete */}
        <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>

        {/* 🆕 Language + Translate controls (moved OUTSIDE of Delete) */}
        <div className="flex items-center gap-2">
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="w-28 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Lang" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isTranslating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isTranslating ? 'Translating...' : 'Translate'}
          </Button>
        </div>
      </div>
    </div>

    {/* ─── ORIGINAL NOTE CARD ───────────────────────────── */}
    <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
      <CardHeader>
        <CardTitle>Original Note</CardTitle>
        {note.created_at && (
          <CardDescription className="text-sm text-slate-400">
            Created: {new Date(note.created_at).toLocaleString()}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-white rounded px-3 py-2"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              className="w-full bg-slate-700 border-slate-600 text-white rounded px-3 py-2"
            />
            <div className="flex gap-3">
              <Button
                onClick={saveEdit}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Save
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none whitespace-pre-wrap">
            <p>{note.content || 'This note has no content.'}</p>
          </div>
        )}
      </CardContent>
    </Card>
    {note.summary && (
  <Card className="bg-slate-800/50 border-slate-700 text-slate-50 mt-6">
    <CardHeader>
      <CardTitle>AI Summary</CardTitle>
      <CardDescription className="text-sm text-slate-400">
        Automatically generated by Kognit
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="whitespace-pre-wrap leading-relaxed text-slate-100">
        {note.summary}
      </p>
    </CardContent>
  </Card>
)}
    {/* ─── TRANSLATED NOTE CARD ───────────────────────────── */}
    {translatedText && (
      <Card className="bg-slate-800/50 border-slate-700 text-slate-50 mt-6">
        <CardHeader>
          <CardTitle>Translated Note ({targetLang.toUpperCase()})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{translatedText}</p>
        </CardContent>
      </Card>
    )}
  </div>
);
}