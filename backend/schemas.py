from pydantic import BaseModel, Field
from typing import List

# --- Request Models ---

class PostData(BaseModel):
    """Schema for a single post's data sent from the extension."""
    postId: str = Field(..., description="Unique identifier for the post.")
    author: str = Field(..., description="Author of the post.")
    text: str = Field(..., description="Text content of the post.")
    timestamp: str = Field(..., description="ISO 8601 timestamp of the post.")

class SentimentRequest(BaseModel):
    """Schema for the batch sentiment analysis request."""
    posts: List[PostData]


# --- Response Models ---

class SentimentResult(BaseModel):
    """Schema for a single sentiment analysis result."""
    postId: str = Field(..., description="Unique identifier for the post.")
    label: str = Field(..., description="Sentiment label (e.g., POSITIVE, NEGATIVE, NEUTRAL).")
    score: float = Field(..., description="Confidence score of the sentiment label.")

class SentimentResponse(BaseModel):
    """Schema for the batch sentiment analysis response."""
    results: List[SentimentResult]
