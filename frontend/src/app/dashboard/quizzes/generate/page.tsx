// frontend/src/app/dashboard/quizzes/generate/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, BrainCircuit, ArrowLeft, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';
import Link from 'next/link';

export default function GenerateQuizPage() {
  const router = useRouter();
  const { isLoggedIn, isLoadingAuth, logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoadingAuth, isLoggedIn, router]);

  if (isLoadingAuth || !isLoggedIn) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      
      if (validTypes.includes(selectedFile.type) || 
          selectedFile.name.endsWith('.pdf') || 
          selectedFile.name.endsWith('.jpg') || 
          selectedFile.name.endsWith('.jpeg') || 
          selectedFile.name.endsWith('.png') || 
          selectedFile.name.endsWith('.docx') || 
          selectedFile.name.endsWith('.doc')) {
        setFile(selectedFile);
        setError('');
        // Auto-fill title if empty
        if (!title) {
          const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
          setTitle(nameWithoutExt);
        }
      } else {
        setError('Please upload a PDF, DOCX, or image file (JPG/PNG).');
        setFile(null);
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a quiz title.');
      return;
    }

    setIsGenerating(true);

    try {
      // Skip backend check in production or if API_URL is not localhost
      const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
      if (isLocalhost) {
        const { checkBackendConnection } = await import('@/lib/backend-check');
        const isOnline = await checkBackendConnection();
        if (!isOnline) {
          setError('Backend server is not responding. Please ensure the backend server is running on port 8000.');
          setIsGenerating(false);
          return;
        }
      }

      const authToken = await getAuthToken();
      if (!authToken) {
        setError('No authentication token found. Please log in again.');
        logout();
        router.replace('/login');
        setIsGenerating(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('num_questions', numQuestions.toString());
      formData.append('difficulty', difficulty);

      const response = await axios.post(
        `${API_URL}/quizzes/generate-from-file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutes timeout for AI processing
        }
      );

      // Redirect to quiz taking page
      if (response.data && response.data.quiz_id) {
        router.push(`/dashboard/quizzes/${response.data.quiz_id}`);
      } else {
        setError('Quiz generated but could not redirect. Please check your quiz history.');
      }
    } catch (err: any) {
      console.error('Error generating quiz:', err);
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Request timeout. The file might be too large or processing is taking too long. Please try a smaller file.');
        } else if (err.response?.status === 400) {
          setError(err.response.data?.detail || 'Invalid file or insufficient content. Please ensure your file contains readable text.');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          logout();
          router.replace('/login');
        } else if (err.response?.status === 500) {
          setError(err.response.data?.detail || 'Failed to generate quiz. Please try again.');
        } else {
          setError('Could not generate quiz. Please check your connection and try again.');
        }
      } else {
        setError('Could not generate quiz. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/quizzes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quiz History
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Generate Quiz from File</h1>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-400" />
            Upload Document or Image
          </CardTitle>
          <CardDescription>
            Upload a PDF, DOCX, or image file (JPG/PNG) and our AI will automatically generate a quiz based on the content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label htmlFor="quiz-title" className="block text-sm font-medium text-slate-300 mb-2">
                Quiz Title
              </label>
              <Input
                id="quiz-title"
                placeholder="e.g., Biology Chapter 5 Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <label htmlFor="quiz-file" className="block text-sm font-medium text-slate-300 mb-2">
                Upload File (PDF, DOCX, or Image)
              </label>
              <div className="flex items-center gap-4">
                <Input
                  id="quiz-file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  required
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 bg-slate-900 border-slate-700 text-slate-400"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="num-questions" className="block text-sm font-medium text-slate-300 mb-2">
                  Number of Questions
                </label>
                <Input
                  id="num-questions"
                  type="number"
                  min={1}
                  max={20}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Between 1 and 20 questions</p>
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                  <SelectTrigger id="difficulty" className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="easy">Easy - Basic recall and understanding</SelectItem>
                    <SelectItem value="medium">Medium - Comprehension and application</SelectItem>
                    <SelectItem value="hard">Hard - Analysis and critical thinking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isGenerating || !file || !title.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p>1. Upload a PDF, DOCX document, or image file containing text</p>
          <p>2. Our AI will extract text from your file and analyze the content</p>
          <p>3. Choose the number of questions and difficulty level</p>
          <p>4. The AI generates tailored quiz questions based on your content</p>
          <p>5. Start taking the quiz immediately!</p>
        </CardContent>
      </Card>
    </div>
  );
}

