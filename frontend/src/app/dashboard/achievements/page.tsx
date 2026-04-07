'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Award } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

interface Achievement {
  id: number;
  key: string;
  title: string;
  earned_at: string;
}

export default function AchievementsPage() {
  const { isLoggedIn, logout } = useAuth();
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;
    const run = async () => {
      setLoading(true);
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          setError('No authentication token found. Please log in again.');
          logout();
          setLoading(false);
          return;
        }
        const resp = await axios.get(`${API_URL}/users/achievements`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setItems(resp.data);
      } catch (e:any) {
        if (e.response?.status === 401) logout();
        else setError('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isLoggedIn, logout]);

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Achievements</h1>
      {items.length === 0 ? (
        <p className="text-slate-400">No achievements yet. Keep learning!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map(a => (
            <Card key={a.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex items-center gap-2">
                <Award className="text-amber-400" />
                <CardTitle>{a.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">Unlocked: {new Date(a.earned_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



