'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

export default function ReviewAttemptPage({ params }: { params: Promise<{ attempt_id: string }> | { attempt_id: string } }) {
  const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
  const attempt_id = resolvedParams.attempt_id;
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { router.replace('/login'); return; }
    const doFetch = async () => {
      setIsLoading(true);
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          setError('No authentication token found. Please log in again.');
          logout();
          setIsLoading(false);
          return;
        }
        const resp = await axios.get(`${API_URL}/quizzes/attempts/${attempt_id}`, { headers: { Authorization: `Bearer ${authToken}` }});
        setData(resp.data);
      } catch (e:any) {
        if (e.response?.status === 501) {
          setError('Review details are not stored yet. I can enable persistence if you want.');
        } else if (e.response?.status === 401) {
          logout();
        } else {
          setError('Failed to load attempt details.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    doFetch();
  }, [attempt_id, isLoggedIn, logout, router]);

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!data) return <div className="text-center text-slate-400 py-10">No details found.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{data.quiz_title} • Score: {data.score?.toFixed?.(0)}%</h1>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.details?.map((d:any)=> (
            <div key={d.question_id} className={`p-3 rounded border ${d.is_correct? 'border-emerald-600' : 'border-red-600'}`}>
              <p className="font-medium mb-2">{d.question_text}</p>
              <ul className="text-sm space-y-1">
                {d.options.map((o:string, i:number)=> (
                  <li key={i} className={`${o===d.correct_answer? 'text-emerald-400' : ''} ${o===d.user_answer && !d.is_correct? 'text-red-400' : ''}`}>• {o}</li>
                ))}
              </ul>
              <p className="text-xs mt-2 text-slate-400">Your answer: {d.user_answer || '—'} • Correct: {d.correct_answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


