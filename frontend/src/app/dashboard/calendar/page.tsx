'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

interface CalendarEvent {
  event_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  event_type: string;
  is_completed: boolean;
  created_at: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    event_type: 'study'
  });

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    fetchEvents();
  }, [isLoggedIn, currentMonth]);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
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
        router.replace('/login');
        return;
      }
      
      // Only load current month's events for faster loading
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await axios.get<CalendarEvent[]>(`${API_URL}/calendar/`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          limit: 50
        },
        timeout: 10000  // Reduced timeout
      });
      setEvents(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
          setError('Cannot connect to backend server. Please ensure the backend is running on http://127.0.0.1:8000');
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timed out. The backend server may be slow or unresponsive.');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          logout();
          router.replace('/login');
        } else {
          setError(`Failed to load calendar events: ${err.message || 'Unknown error'}`);
        }
      } else {
        setError('Failed to load calendar events.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.start_time) {
      setError('Title and start time are required.');
      return;
    }

    setIsLoading(true);
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      await axios.post(
        `${API_URL}/calendar/`,
        {
          ...formData,
          end_time: formData.end_time || null
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      setIsDialogOpen(false);
      setFormData({ title: '', description: '', start_time: '', end_time: '', event_type: 'study' });
      fetchEvents();
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setError(err.response?.data?.detail || 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (eventId: number, currentStatus: boolean) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) return;

      await axios.put(
        `${API_URL}/calendar/${eventId}`,
        { is_completed: !currentStatus },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      fetchEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      const authToken = await getAuthToken();
      if (!authToken) return;

      await axios.delete(`${API_URL}/calendar/${eventId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  // Calendar grid generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading && events.length === 0) {
    return (
      <div className="w-full space-y-4 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
          <div className="h-10 w-40 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded border border-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);

  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Calendar</h1>
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-50">Calendar</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-50">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription className="text-slate-400">
                Schedule your study sessions, assignments, and reminders.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Study Session, Assignment Due, etc."
                  className="bg-slate-700 border-slate-600 text-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about this event..."
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Start Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">End Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Event Type</label>
                <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="study">Study Session</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                  Create Event
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isLoading && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="pt-6">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700">
                ← Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700">
                Next →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-slate-400 py-2">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] border border-slate-700 p-2 ${
                    day ? 'bg-slate-800/30' : 'bg-slate-900/50'
                  } ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.event_id}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${
                              event.is_completed 
                                ? 'bg-green-900/50 text-green-300 line-through' 
                                : event.event_type === 'exam' 
                                  ? 'bg-red-900/50 text-red-300'
                                  : event.event_type === 'assignment'
                                    ? 'bg-yellow-900/50 text-yellow-300'
                                    : 'bg-blue-900/50 text-blue-300'
                            }`}
                            title={event.title}
                            onClick={() => {
                              const eventTime = new Date(event.start_time);
                              const timeStr = eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              alert(`${event.title}\n${timeStr}\n${event.description || 'No description'}`);
                            }}
                          >
                            {event.is_completed && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.filter(e => !e.is_completed && new Date(e.start_time) >= new Date()).length === 0 ? (
            <p className="text-slate-400">No upcoming events. Create one to get started!</p>
          ) : (
            <div className="space-y-3">
              {events
                .filter(e => !e.is_completed && new Date(e.start_time) >= new Date())
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .slice(0, 10)
                .map(event => (
                  <div
                    key={event.event_id}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-200">{event.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          event.event_type === 'exam' ? 'bg-red-900/50 text-red-300' :
                          event.event_type === 'assignment' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-blue-900/50 text-blue-300'
                        }`}>
                          {event.event_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {new Date(event.start_time).toLocaleString()}
                      </p>
                      {event.description && (
                        <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComplete(event.event_id, event.is_completed)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.event_id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
