from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from dotenv import load_dotenv
import os

from model import predict_labels

load_dotenv()
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

app = FastAPI(title="Threads Sentiment Scoring", version="1.0.0")

# --- Pydantic Models ---

class PostItem(BaseModel):
    postId: str
    text: str
    class Config:
        extra = "ignore"

class BatchPostItems(BaseModel):
    posts: List[PostItem]

class LabelResult(BaseModel):
    postId: str
    label: str

class BatchLabelResponse(BaseModel):
    results: List[LabelResult]

# --- API Endpoint ---

@app.post("/score_batch", response_model=BatchLabelResponse)
def score_batch(batch: BatchPostItems):
    texts = [post.text for post in batch.posts]
    
    labels = predict_labels(texts)

    results = [
        LabelResult(postId=post.postId, label=label)
        for post, label in zip(batch.posts, labels)
    ]
    
    return BatchLabelResponse(results=results)