import asyncio
import json
import os
import sys
import httpx
from typing import List, Tuple, Dict, Optional

def _safe_print(*args, **kwargs):
    """Print that won't crash on Windows charmap codec errors."""
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        msg = " ".join(str(a) for a in args)
        print(msg.encode(sys.stdout.encoding or 'utf-8', errors='replace').decode(sys.stdout.encoding or 'utf-8', errors='replace'), **kwargs)

def _sanitize(text: str) -> str:
    """Remove/replace characters that can't be encoded on Windows consoles."""
    if not text:
        return text
    return text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    HAS_VADER = True
    _vader = SentimentIntensityAnalyzer()
except Exception:
    HAS_VADER = False
    _vader = None

# API keys (from env or defaults)

try:
    from config import settings
    HUGGINGFACE_API_KEY = settings.huggingface_api_key or os.getenv("HUGGINGFACE_API_KEY", "")
    GEMINI_API_KEY = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    GOOGLE_VISION_API_KEY = settings.google_vision_api_key or os.getenv("GOOGLE_VISION_API_KEY", "")
except Exception:
    HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GOOGLE_VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY", "")

HUGGINGFACE_SUMMARIZATION_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

def get_gemini_api_url():
    return f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def get_vision_api_url():
    return f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"

def _simple_summarize(text: str, max_sentences: int = 5) -> str:
    import re
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if not sentences:
        return text[:300] + ("..." if len(text) > 300 else "")
    return " ".join(sentences[:max_sentences])

async def _ai_summarize_with_huggingface(text: str) -> Optional[str]:
    if not HUGGINGFACE_API_KEY or len(text) < 50:
        return None
    safe_text = _sanitize(text)
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                HUGGINGFACE_SUMMARIZATION_URL,
                headers={"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"},
                json={"inputs": safe_text[:2048]},
                follow_redirects=True
            )
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get("summary_text", "")
                elif isinstance(result, dict):
                    return result.get("summary_text", "")
            elif response.status_code == 503:
                await asyncio.sleep(5)
                return await _ai_summarize_with_huggingface(text)
    except Exception as e:
        _safe_print(f"Hugging Face API error: {e}")
    return None

async def summarize_note(content: str) -> str:
    """Reliable summarization with Hugging Face → Gemini → fallback."""
    if not content or len(content.strip()) < 50:
        return content if len(content) < 300 else content[:300] + "..."
    
    safe_content = _sanitize(content)
    
    # Try Hugging Face
    if HUGGINGFACE_API_KEY:
        ai_summary = await _ai_summarize_with_huggingface(safe_content)
        if ai_summary and len(ai_summary.strip()) > 10:
            return ai_summary.strip()
    
    # Try Gemini fallback
    if GEMINI_API_KEY:
        try:
            prompt = f"Summarize the following text into concise key points:\n\n{safe_content[:4000]}"
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    get_gemini_api_url(),
                    headers={"Content-Type": "application/json"},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                )
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if text and len(text.strip()) > 10:
                        return text.strip()
                else:
                    _safe_print(f"Gemini API returned status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            _safe_print(f"Gemini fallback failed: {e}")
    
    # Fallback
    _safe_print("Warning: Using heuristic summarization fallback")
    return _simple_summarize(safe_content, max_sentences=5)

async def _generate_quiz_with_gemini(content: str, title: str, num_questions: int, difficulty: str = "medium") -> Optional[List[Dict]]:
    """Generate quiz questions using Google Gemini API with difficulty levels"""
    if not GEMINI_API_KEY:
        return None

    # Difficulty descriptions
    difficulty_prompts = {
        "easy": "Create simple, straightforward questions that test basic understanding and recall. Use simple vocabulary and direct questions. Make the correct answer obvious to someone who has read the content.",
        "medium": "Create moderate difficulty questions that test comprehension and application. Include some nuanced concepts and require understanding of relationships between ideas.",
        "hard": "Create challenging questions that test deep understanding, critical thinking, and analysis. Include complex scenarios, require inference, and test ability to synthesize information. Make distractors plausible and challenging."
    }

    difficulty_instruction = difficulty_prompts.get(difficulty.lower(), difficulty_prompts["medium"])

    try:
        prompt = f"""Generate {num_questions} multiple-choice quiz questions based on the following content.

Title: {title}

Content: {content[:3000]}

Difficulty Level: {difficulty.upper()}
{difficulty_instruction}

For each question, provide:
1. A clear, educational question appropriate for {difficulty} difficulty
2. Exactly 4 options labeled A, B, C, D (only one should be correct)
3. The correct answer (A, B, C, or D)

Format your response as a JSON array. Each question should have:
- "question_text": "The question"
- "options": ["Option A", "Option B", "Option C", "Option D"]
- "correct_answer": "Option A" (the full text of the correct answer)

Return ONLY the JSON array, no other text."""

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                get_gemini_api_url(),
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
            )

            if response.status_code == 200:
                result = response.json()
                candidates = result.get("candidates", [])
                if candidates and len(candidates) > 0:
                    content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")

                    # Try to extract JSON from response
                    import re
                    # Look for JSON array in the response
                    json_match = re.search(r'\[.*\]', content_text, re.DOTALL)
                    if json_match:
                        try:
                            questions = json.loads(json_match.group())
                            if isinstance(questions, list) and len(questions) > 0:
                                # Ensure correct format
                                formatted_questions = []
                                for q in questions[:num_questions]:
                                    if "question_text" in q and "options" in q and "correct_answer" in q:
                                        formatted_questions.append({
                                            "question_text": q["question_text"],
                                            "options": q["options"][:4] if len(q["options"]) >= 4 else q["options"],
                                            "correct_answer": q["correct_answer"]
                                        })
                                if formatted_questions:
                                    return formatted_questions
                        except json.JSONDecodeError as e:
                            print(f"JSON parsing error: {e}")
                            print(f"Response text: {content_text[:500]}")
    except Exception as e:
        _safe_print(f"Gemini API error: {e}")
    return None

async def _extract_text_with_vision_api(image_data: bytes, file_type: str) -> Optional[str]:
    """Extract text from image/PDF using Google Cloud Vision API"""
    if not GOOGLE_VISION_API_KEY:
        return None

    try:
        import base64

        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        # For PDFs, we need to convert pages to images first (simplified - in production, use PDF processing)
        # For now, we'll handle images
        if file_type == 'application/pdf':
            # For PDFs, we'll use a different approach or extract text directly
            # Google Vision API can handle PDFs but requires special handling
            return None  # Will use PyMuPDF for PDFs instead

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                get_vision_api_url(),
                headers={"Content-Type": "application/json"},
                json={
                    "requests": [{
                        "image": {"content": image_base64},
                        "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
                    }]
                }
            )

            if response.status_code == 200:
                result = response.json()
                responses = result.get("responses", [])
                if responses and len(responses) > 0:
                    text_annotations = responses[0].get("textAnnotations", [])
                    if text_annotations and len(text_annotations) > 0:
                        # First annotation contains full text
                        return text_annotations[0].get("description", "")
    except Exception as e:
        print(f"Google Vision API error: {e}")
    return None

# Quiz generation (with Gemini AI)
async def generate_quiz_questions(content: str, title: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
    """Generate quiz questions using Gemini AI if available, otherwise use heuristic

    Args:
        content: The content to generate questions from
        title: The title of the content
        num_questions: Number of questions to generate
        difficulty: Difficulty level - "easy", "medium", or "hard"
    """
    text = (content or "").strip()
    if not text:
        return []

    # Try Gemini AI first
    if GEMINI_API_KEY:
        ai_questions = await _generate_quiz_with_gemini(content, title, num_questions, difficulty)
        if ai_questions:
            return ai_questions

    # Fallback to heuristic
    import re, random
    sentences = re.split(r"(?<=[.!?])\s+", text)
    # Extract candidate keywords (naive): top unique words excluding stopwords
    stop = set(["the","and","of","to","a","in","is","it","that","for","on","as","with","are","this","by","an","be","or","from","at","which","we","can","has","have","was","were"])
    words = re.findall(r"[A-Za-z][A-Za-z-]{2,}", text)
    words_lower = [w.lower() for w in words if w.lower() not in stop]
    freq = {}
    for w in words_lower:
        freq[w] = freq.get(w, 0) + 1
    keywords = [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)][:30]
    # Build questions by cloze over sentences containing keywords
    questions: List[Dict] = []
    random.shuffle(sentences)
    for s in sentences:
        kw = next((k for k in keywords if k in s.lower()), None)
        if not kw:
            continue
        # correct answer is the keyword (capitalized version if appears), build distractors from other keywords
        correct = kw
        distractors = [k for k in keywords if k != kw][:10]
        random.shuffle(distractors)
        opts = [correct] + distractors[:3]
        random.shuffle(opts)
        # Question text: remove the keyword to form a blank
        pattern = re.compile(re.escape(kw), re.IGNORECASE)
        cloze = pattern.sub("_____", s, count=1)
        q = {
            "question_text": f"Fill in the blank: {cloze}",
            "options": opts,
            "correct_answer": correct
        }
        questions.append(q)
        if len(questions) >= num_questions:
            break
    # Fallback if not enough
    while len(questions) < num_questions:
        questions.append({
            "question_text": f"What is the main topic of '{title}'?",
            "options": [title, "Background", "Overview", "Summary"],
            "correct_answer": title
        })
    return questions

# Journal insights: summary + emotions + nudge (with AI support)
async def get_journal_insights(content: str) -> Tuple[str, str, str]:
    """Get journal insights with AI summarization if available"""
    # Summary - try Hugging Face first
    summary = await summarize_note(content)
    if not summary:
        summary = _simple_summarize(content, max_sentences=3)

    # Sentiment/emotions
    detected_emotions: List[str] = []
    sentiment_label = "neutral"
    if HAS_VADER:
        scores = _vader.polarity_scores(content or "")
        compound = scores.get("compound", 0)
        if compound >= 0.3:
            sentiment_label = "positive"
        elif compound <= -0.3:
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"
    else:
        # very naive fallback
        low = (content or "").lower()
        if any(w in low for w in ["happy", "great", "excited", "good"]):
            sentiment_label = "positive"
        elif any(w in low for w in ["sad", "depressed", "bad", "anxious"]):
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"
    # rudimentary emotion tags
    low = (content or "").lower()
    if any(w in low for w in ["joy", "happy", "grateful"]):
        detected_emotions.append("joy")
    if any(w in low for w in ["sad", "down", "lonely", "depressed"]):
        detected_emotions.append("sadness")
    if any(w in low for w in ["angry", "annoyed", "frustrated"]):
        detected_emotions.append("anger")
    if any(w in low for w in ["anxious", "worried", "stressed"]):
        detected_emotions.append("anxiety")
    if not detected_emotions:
        detected_emotions.append("neutral")
    emotions_json = json.dumps({"detected_emotions": detected_emotions, "sentiment": sentiment_label})
    # Nudge
    if sentiment_label == "positive":
        ai_nudge = "You're in a great mindset—leverage that momentum with a focused 25-minute study block."
    elif sentiment_label == "negative":
        ai_nudge = "Take a short break, breathe, then tackle a small, achievable task to regain traction."
    else:
        ai_nudge = "Start with a quick review to warm up, then outline your next three study tasks."
    return summary, emotions_json, ai_nudge

# Flashcard generation (free heuristic)
async def generate_flashcards(content: str, num_cards: int = 10) -> List[Dict]:
    import re
    text = (content or "").strip()
    if not text:
        return []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    cards: List[Dict] = []
    for s in sentences:
        if len(s) < 30:
            continue
        # simple Q/A: question asks for the key idea of the sentence
        cards.append({
            "question_text": f"What is the key idea of: '{s[:120]}'.",
            "answer_text": s.strip()
        })
        if len(cards) >= num_cards:
            break
    return cards

# Mood-based nudge generation (free)
async def generate_mood_based_nudge(user_mood: str, recent_mood_history: List[str] = None) -> str:
    mood = (user_mood or "neutral").lower()
    if mood == "positive":
        return "You're doing great—set a focused 25-minute timer and build on your momentum!"
    if mood == "negative":
        return "Be kind to yourself. Take a 5-minute reset, then tackle one small win."
    return "Start with a quick review, then list your next three actionable steps."

# Export OCR function for use in routers
async def extract_text_from_image(image_data: bytes, file_type: str) -> Optional[str]:
    """Extract text from image using Google Cloud Vision API"""
    return await _extract_text_with_vision_api(image_data, file_type)