// In frontend/src/app/dashboard/quizzes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, BrainCircuit, History } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

interface QuizAttempt {
    attempt_id: number;
    quiz_id: number;
    score: number;
    completed_at: string;
    quiz_title: string;
    total_questions: number;
}

export default function QuizHistoryPage() {
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { isLoggedIn, isLoadingAuth, logout } = useAuth();

    useEffect(() => {
        if (isLoadingAuth || !isLoggedIn) return;

        const fetchHistory = async () => {
            setIsLoading(true);
            setError('');
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
                    setIsLoading(false);
                    return;
                }
                const response = await axios.get(`${API_URL}/quizzes/history/all`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                    params: { skip: 0, limit: 50 },
                    timeout: 10000  // Reduced timeout - should be enough if backend is responsive
                });
                setAttempts(response.data || []);
            } catch (err: any) {
                console.error('Failed to fetch quiz history:', err);
                if (axios.isAxiosError(err)) {
                    if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
                        setError('Cannot connect to backend server. Please ensure the backend is running on http://127.0.0.1:8000');
                    } else if (err.code === 'ECONNABORTED') {
                        setError('Request timed out. The backend server may be slow or unresponsive.');
                    } else if (err.response?.status === 401) {
                        logout();
                    } else {
                        setError(`Could not load quiz history: ${err.message || 'Unknown error'}`);
                    }
                } else {
                    setError('Could not load quiz history.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [isLoggedIn, logout]);

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return (
        <div className="w-full space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Quiz History</h1>
                <Link href="/dashboard/quizzes/generate" passHref>
                    <Button variant="outline" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <BrainCircuit className="h-5 w-5 mr-2" />
                        Generate New Quiz
                    </Button>
                </Link>
            </header>
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
                        <Button onClick={() => window.location.reload()} className="mt-4">
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Quiz History</h1>
                <Link href="/dashboard/quizzes/generate" passHref>
                    <Button variant="outline" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <BrainCircuit className="h-5 w-5 mr-2" />
                        Generate New Quiz
                    </Button>
                </Link>
            </header>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <CardTitle>Your Past Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                    {attempts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <History className="mx-auto h-12 w-12 mb-4" />
                            <p className="text-lg">You haven't taken any quizzes yet.</p>
                            <p className="text-sm text-slate-500">Generate a quiz from one of your notes to get started!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-slate-800 border-slate-700">
                                    <TableHead>Quiz Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attempts.map((attempt) => (
                                    <TableRow key={attempt.attempt_id} className="hover:bg-slate-800 border-slate-700">
                                        <TableCell className="font-medium text-slate-200">{attempt.quiz_title}</TableCell>
                                        <TableCell className="text-slate-400">{new Date(attempt.completed_at).toLocaleString()}</TableCell>
                                        <TableCell className={`font-bold ${attempt.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                                            {attempt.score.toFixed(0)}%
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/quizzes/review/${attempt.attempt_id}`} className="underline text-indigo-400">View</Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}