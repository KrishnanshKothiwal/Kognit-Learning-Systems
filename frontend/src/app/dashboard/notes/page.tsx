// frontend/src/app/dashboard/notes/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UploadCloud, FileText, Search, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Define the shape of a single Note object
interface Note {
  note_id: number;
  title: string;
  summary: string | null;
  created_at: string; // ISO 8601 string
}

type SortBy = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [titleInput, setTitleInput] = useState(''); // Renamed to avoid conflict with 'title' state
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, getToken, isLoggedIn, isLoadingAuth, logout } = useAuth();
  const router = useRouter();

  const getAuthHeaders = async () => {
    const authToken = await getToken();
    if (!authToken) {
      return {};
    }
    return { 'Authorization': `Bearer ${authToken}` };
  };
  
  const fetchNotes = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/notes/`, {
        headers,
      });
      setNotes(response.data);
    } catch (err) {
      setError('Could not fetch notes. Please try logging in again.');
      // Redirect to login if token is expired/invalid
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
        router.replace('/login');
      }
    }
  };

  useEffect(() => {
    if (isLoadingAuth) return; // Wait for Firebase
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      fetchNotes();
    }
  }, [isLoggedIn, isLoadingAuth, router]);

  // --- Filtering and Sorting Logic ---
  useEffect(() => {
    let currentNotes = [...notes]; // Create a mutable copy

    // Apply search filter
    if (searchTerm) {
      currentNotes = currentNotes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    currentNotes.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    setFilteredNotes(currentNotes);
  }, [notes, searchTerm, sortBy]);

  const handleCreateNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!titleInput.trim()) {
        setError('Please enter a note title.');
        return;
    }
    setError('');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('title', titleInput);
    formData.append('file', file);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/notes/`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
      });
      
      if (response.data) {
      setTitleInput(''); // Clear title input
      setFile(null); // Clear selected file
      if(fileInputRef.current) fileInputRef.current.value = ""; // Clear file input visually
        setError(''); // Clear any previous errors
      fetchNotes(); // Re-fetch notes to update the list
      }
    } catch (err: any) {
      console.error("Error creating note:", err);
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Upload timeout. The file might be too large. Please try a smaller file.');
        } else if (err.response?.status === 400) {
          setError(err.response.data?.detail || 'Invalid file type. Please upload .txt, .pdf, or .docx files.');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          logout();
          router.replace('/login');
        } else {
          setError(err.response?.data?.detail || 'Could not create note. Please try again.');
        }
      } else {
        setError('Could not create note. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden"> {/* Adjusted height to account for navbar/header */}
      {/* Left Column: Create Note Form */}
      <Card className="w-1/3 min-w-[300px] max-w-[400px] bg-slate-800/50 border-slate-700 p-6 flex flex-col space-y-6 overflow-y-auto">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl">Create New Note</CardTitle>
          <CardDescription>Upload a .txt or .pdf file.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <form onSubmit={handleCreateNote} className="space-y-5">
            <div>
              <label htmlFor="note-title" className="block text-sm font-medium text-slate-300 mb-1">Note Title</label>
              <Input
                id="note-title"
                placeholder="e.g., Photosynthesis Basics"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <label htmlFor="note-file" className="block text-sm font-medium text-slate-300 mb-1">Upload File (.txt, .pdf, .docx)</label>
              <Input
                id="note-file"
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                accept=".txt,.pdf,.docx"
                required
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 bg-slate-900 border-slate-700 text-slate-400"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isLoading ? 'Creating...' : 'Create Note'}
            </Button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Right Column: Notes List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Your Notes Library</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNotes.map((note) => (
              <Card key={note.note_id} className="bg-slate-800/50 border-slate-700 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                <Link href={`/dashboard/notes/${note.note_id}`} passHref>
                  <CardHeader className="cursor-pointer">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-400" />
                        {note.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                        {new Date(note.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Link>
                <CardContent className="flex-grow">
                  <p className="text-slate-400 text-sm line-clamp-3">
                    {note.summary || "AI summary not yet generated or available."}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" className="text-slate-200 border-slate-600 hover:text-white hover:bg-slate-700" onClick={async (e)=>{ e.preventDefault(); router.push(`/dashboard/notes/${note.note_id}`); }}>Open</Button>
                    <Button variant="destructive" onClick={async (e)=>{
                      e.preventDefault();
                      if(!confirm('Delete this note?')) return;
                      try {
                        const headers = await getAuthHeaders();
                        await axios.delete(`${API_URL}/notes/${note.note_id}`, { headers });
                        setNotes(prev=>prev.filter(n=>n.note_id!==note.note_id));
                      } catch(err){ console.error(err); }
                    }}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/20">
            <UploadCloud className="mx-auto h-16 w-16 text-slate-600 mb-4" />
            <h3 className="mt-2 text-xl font-semibold text-slate-300">No notes found</h3>
            <p className="mt-1 text-md text-slate-500">
              {searchTerm ? "Try adjusting your search or filters." : "Get started by creating your first note using the form on the left!"}
            </p>
            {!searchTerm && (
                <Button onClick={() => fileInputRef.current?.click()} className="mt-6 bg-indigo-600 hover:bg-indigo-700">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Note
                </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}