'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';
import axios from 'axios';

import { useAuth } from '@/context/AuthContext';

interface Notification {
  event_id: number;
  title: string;
  start_time: string;
  description: string | null;
  event_type: string;
  hours_until: number;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const { isLoggedIn, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth || !isLoggedIn) return;
    
    fetchNotifications();
    // Check for notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoadingAuth, isLoggedIn]);

  const fetchNotifications = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) return;

      const response = await axios.get<Notification[]>(`${API_URL}/notifications/upcoming-reminders`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { hours: 24 }
      });

      const upcoming = response.data.filter(n => n.hours_until <= 24 && n.hours_until >= 0);
      setNotifications(upcoming);
      setHasNewNotifications(upcoming.length > 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleDismiss = async (eventId: number) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) return;

      await axios.post(
        `${API_URL}/notifications/mark-reminder-sent/${eventId}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      setNotifications(prev => prev.filter(n => n.event_id !== eventId));
      setHasNewNotifications(notifications.length > 1);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {hasNewNotifications && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-slate-800 border-slate-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200">Upcoming Events</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.event_id}
                    className={`p-3 rounded-lg border ${
                      notif.hours_until < 1 ? 'bg-red-900/20 border-red-700' :
                      notif.hours_until < 6 ? 'bg-yellow-900/20 border-yellow-700' :
                      'bg-blue-900/20 border-blue-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-200 text-sm">{notif.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(notif.start_time).toLocaleString()}
                        </p>
                        {notif.hours_until < 1 && (
                          <p className="text-xs text-red-400 mt-1 font-semibold">
                            Due soon!
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(notif.event_id)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

