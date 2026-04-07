// In frontend/src/app/dashboard/quizzes/[quiz_id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter }from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-helper';

// --- Define Types ---
interface Question {
    question_id: number;
    question_text: string;
    options: string[]; // Backend parses JSON for us
    correct_answer: string;
}
interface Quiz {
    quiz_id: number;
    title: string;
    questions: Question[];
}
interface Answers {
    [question_id: number]: string; // e.g., { 1: "Option A", 2: "True" }
}

export default function TakeQuizPage({ params }: { params: Promise<{ quiz_id: string }> | { quiz_id: string } }) {
    const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
    const quiz_id = parseInt(resolvedParams.quiz_id); // Convert to number
    const router = useRouter();
    const { isLoggedIn, logout } = useAuth();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState<Answers>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [review, setReview] = useState<any | null>(null);

    useEffect(() => {
        if (!isLoggedIn || !quiz_id) return;
        const fetchQuiz = async () => {
            setIsLoading(true);
            try {
                const authToken = await getAuthToken();
                if (!authToken) {
                    setError('No authentication token found. Please log in again.');
                    logout();
                    setIsLoading(false);
                    return;
                }
                const response = await axios.get(`${API_URL}/quizzes/${quiz_id}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setQuiz(response.data);
            } catch (err: any) {
                console.error('Failed to fetch quiz:', err);
                if (err.response?.status === 401) logout();
                else setError('Could not load quiz.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [quiz_id, isLoggedIn, logout]);

    const handleAnswerSelect = (question_id: number, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [question_id]: answer
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const authToken = await getAuthToken();
            if (!authToken) {
                setError('No authentication token found. Please log in again.');
                setIsSubmitting(false);
                return;
            }
            const response = await axios.post(
                `${API_URL}/quizzes/${quiz_id}/submit`,
                { answers }, // Backend expects { "answers": {...} }
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            
            const result = response.data;
            setReview(result);
            
        } catch (err: any) {
            console.error('Failed to submit quiz:', err);
            setError('Could not submit quiz. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="text-center text-red-500">{error}</div>;
    if (!quiz) return <div className="text-center">Quiz not found.</div>;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            {review && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>Review • Score: {review.score?.toFixed?.(0)}%</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {review.details?.map((d:any)=> (
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
            )}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <CardTitle>Question {currentQuestionIndex + 1} of {quiz.questions.length}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-lg font-medium">{currentQuestion.question_text}</p>
                    <RadioGroup
                        value={answers[currentQuestion.question_id] || ""}
                        onValueChange={(value) => handleAnswerSelect(currentQuestion.question_id, value)}
                    >
                        {currentQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 rounded-md hover:bg-slate-800 transition-colors">
                                <RadioGroupItem value={option} id={`q${currentQuestion.question_id}-o${index}`} />
                                <Label htmlFor={`q${currentQuestion.question_id}-o${index}`} className="text-base cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <Button 
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-700"
                >
                    Previous
                </Button>
                
                {!review && (isLastQuestion ? (
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || Object.keys(answers).length !== quiz.questions.length}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Quiz'}
                    </Button>
                ) : (
                    <Button 
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        disabled={!answers[currentQuestion.question_id]}
                    >
                        Next
                    </Button>
                ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>
    );
}