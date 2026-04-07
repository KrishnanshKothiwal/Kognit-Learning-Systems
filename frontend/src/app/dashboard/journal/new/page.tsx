// frontend/src/app/dashboard/journal/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Upload, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

// Helper function to extract text from files
async function extractTextFromFile(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    // For images, use Google Vision API via backend
    const formData = new FormData();
    formData.append('file', file);
    const authToken = await getAuthToken();
    try {
      const response = await axios.post(`${API_URL}/journals/extract-image`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });
      return response.data.content || '';
    } catch (err) {
      console.error('OCR error:', err);
      throw new Error('Failed to extract text from image. Please try again or add text manually.');
    }
  } else if (file.type === 'application/pdf') {
    // For PDFs, send to backend for extraction
    const formData = new FormData();
    formData.append('file', file);
    const authToken = await getAuthToken();
    try {
      const response = await axios.post(`${API_URL}/notes/extract-pdf`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });
      return response.data.content || '';
    } catch (err) {
      throw new Error('Failed to extract text from PDF');
    }
  } else if (file.type === 'text/plain') {
    return await file.text();
  }
  return '';
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (!content.trim()) {
      setError('Journal content cannot be empty.');
      return;
    }

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
      
      let finalContent = content.trim();
      
      // If file is uploaded, extract text from it
      if (file) {
        setIsExtracting(true);
        try {
          const fileContent = await extractTextFromFile(file);
          if (fileContent) {
            finalContent = fileContent + (content.trim() ? '\n\n' + content.trim() : '');
          }
        } catch (fileErr) {
          console.error('File extraction error:', fileErr);
          setError('Failed to extract text from file. You can still enter text manually.');
          setIsExtracting(false);
          setIsLoading(false);
          return;
        } finally {
          setIsExtracting(false);
        }
      }
      
      if (!finalContent.trim()) {
        setError('Please enter content or upload a file.');
        setIsLoading(false);
        return;
      }
      
      await axios.post(
        `${API_URL}/journals/`,
        { title: title.trim() || null, content: finalContent },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      router.push('/dashboard/journal'); // Redirect to journal list on success
    } catch (err: any) {
      console.error('Failed to create journal entry:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) { // More robust check
        setError('Session expired or unauthorized. Please log in again.');
        logout();
        router.replace('/login');
      } else {
        setError(err.response?.data?.detail || 'Failed to create journal entry. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50">New Journal Entry</h1>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 text-slate-50">
        <CardHeader>
          <CardTitle>Write Your Thoughts</CardTitle>
          <CardDescription>Capture your reflections, ideas, or experiences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                Title (Optional)
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A brief title for your entry"
                className="bg-slate-700 border-slate-600 text-slate-50 focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-slate-300 mb-1">
                Upload Image/PDF (Optional)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept="image/*,.pdf,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="bg-slate-700 border-slate-600 text-slate-50"
                />
                {file && (
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <FileText className="h-4 w-4" /> {file.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Upload images or PDFs to extract text automatically</p>
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-1">
                Your Entry {file && '(Text will be extracted from file)'}
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing here... or upload a file to extract text"
                rows={10}
                className="bg-slate-700 border-slate-600 text-slate-50 focus:border-emerald-500"
              />
            </div>
            {isExtracting && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Extracting text from file...</span>
              </div>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={isLoading || isExtracting || (!content.trim() && !file)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                'Save Entry'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}