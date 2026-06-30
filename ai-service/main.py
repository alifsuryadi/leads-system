from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from typing import Literal
import re

app = FastAPI(title="Sentiment Analysis Service", version="1.0.0")

# Keyword dictionaries for rule-based sentiment analysis
POSITIVE_KEYWORDS = {
    # English
    "good", "great", "excellent", "amazing", "wonderful", "fantastic",
    "love", "happy", "joy", "best", "awesome", "perfect", "brilliant",
    "outstanding", "superb", "positive", "success", "win", "enjoy",
    "like", "beautiful", "nice", "recommend", "helpful", "useful",
    "impressive", "delightful", "pleased", "satisfied", "thrilled",
    "extraordinary", "phenomenal", "marvelous", "splendid", "glad",
    # Indonesian
    "bagus", "baik", "luar", "biasa", "hebat", "mantap", "keren",
    "sempurna", "indah", "senang", "suka", "cinta", "sayang", "bangga",
    "puas", "berhasil", "sukses", "menang", "terbaik", "recommended",
    "memuaskan", "menyenangkan", "bermanfaat", "membantu", "mudah",
    "nyaman", "aman", "terpercaya", "profesional", "ramah", "cepat",
    "berkualitas", "istimewa", "luar biasa", "top", "jos", "oke",
}

NEGATIVE_KEYWORDS = {
    # English
    "bad", "terrible", "awful", "horrible", "hate", "angry", "sad",
    "worst", "poor", "negative", "fail", "failure", "disappointed",
    "frustrating", "useless", "broken", "wrong", "problem", "issue",
    "complaint", "unhappy", "boring", "ugly", "difficult", "confusing",
    "dreadful", "disgusting", "appalling", "inadequate", "inferior",
    "mediocre", "catastrophic", "disaster", "regret", "annoying",
    # Indonesian
    "buruk", "jelek", "parah", "kecewa", "marah", "sedih", "benci",
    "gagal", "rusak", "salah", "masalah", "kendala", "lambat", "lelet",
    "mahal", "ribet", "susah", "sulit", "tidak", "bukan", "kurang",
    "mengecewakan", "merugikan", "menjengkelkan", "membosankan",
    "berbahaya", "penipuan", "bohong", "palsu", "buruknya", "payah",
    "zonk", "nyebelin", "kesal", "jengkel", "sebal", "bete",
}


class SentimentRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text must not be empty")
        if len(v) > 1000:
            raise ValueError("Text must not exceed 1000 characters")
        return v.strip()


class SentimentResponse(BaseModel):
    text: str
    sentiment: Literal["positive", "negative"]
    confidence: float
    matched_keywords: list[str]


def tokenize(text: str) -> set[str]:
    """Extract lowercase words from text, removing punctuation."""
    return set(re.findall(r"\b[a-z]+\b", text.lower()))


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "sentiment-analysis"}


@app.post("/analyze", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest) -> SentimentResponse:
    try:
        words = tokenize(request.text)

        positive_matches = sorted(words & POSITIVE_KEYWORDS)
        negative_matches = sorted(words & NEGATIVE_KEYWORDS)

        pos_count = len(positive_matches)
        neg_count = len(negative_matches)
        total = pos_count + neg_count

        if total == 0:
            # No keywords found — default to negative with low confidence
            return SentimentResponse(
                text=request.text,
                sentiment="negative",
                confidence=0.5,
                matched_keywords=[],
            )

        if pos_count >= neg_count:
            sentiment: Literal["positive", "negative"] = "positive"
            confidence = round(pos_count / total, 2)
            matched = positive_matches
        else:
            sentiment = "negative"
            confidence = round(neg_count / total, 2)
            matched = negative_matches

        return SentimentResponse(
            text=request.text,
            sentiment=sentiment,
            confidence=confidence,
            matched_keywords=matched,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
