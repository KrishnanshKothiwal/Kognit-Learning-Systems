'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

export default function SettingsPage() {
  const [defaultQuizLen, setDefaultQuizLen] = useState<number>(5);
  const { isLoggedIn, logout, userEmail } = useAuth();
  const [email, setEmail] = useState<string>(userEmail || '');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [msg, setMsg] = useState<string>('');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-56 text-slate-300">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} className="flex-1 bg-slate-700 border-slate-600 text-white rounded px-3 py-2"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-56 text-slate-300">Current password</label>
            <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="flex-1 bg-slate-700 border-slate-600 text-white rounded px-3 py-2"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-56 text-slate-300">New password</label>
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="flex-1 bg-slate-700 border-slate-600 text-white rounded px-3 py-2"/>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={async ()=>{
              try {
                const authToken = await getAuthToken();
                if (!authToken) {
                  setMsg('No authentication token found. Please log in again.');
                  return;
                }
                await axios.put(`${API_URL}/users/me`, {
                  email: email !== userEmail ? email : undefined,
                  current_password: currentPassword || undefined,
                  new_password: newPassword || undefined
                }, { headers: { Authorization: `Bearer ${authToken}` }});
                setMsg('Account updated');
              } catch(e:any) {
                setMsg(e.response?.data?.detail || 'Update failed');
              }
            }}>Save Account</Button>
            {msg && <span className="text-slate-400 text-sm">{msg}</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Quizzes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-56 text-slate-300">Default number of questions</label>
            <input type="number" min={1} max={20} value={defaultQuizLen} onChange={(e)=>setDefaultQuizLen(parseInt(e.target.value||'5'))} className="w-24 bg-slate-700 border-slate-600 text-white rounded px-2 py-1"/>
          </div>
          <Button disabled>Save (placeholder)</Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button disabled>Toggle Theme (placeholder)</Button>
        </CardContent>
      </Card>
    </div>
  );
}


