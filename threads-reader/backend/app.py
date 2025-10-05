from fastapi import FastAPI
from typing import List

from .schemas import SentimentRequest, SentimentResponse, SentimentResult
from .sentiment import loader, infer
from .store import cache

app = FastAPI(
    title="Threads Sentiment Analysis API",
    description="An API to analyze the sentiment of posts from threads.net.",
    version="1.0.0",
)

# Load the sentiment analysis model on startup
sentiment_model = loader.load_sentiment_model()

@app.get("/", tags=["Health"])
async def read_root():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/sentiment/batch", response_model=SentimentResponse, tags=["Sentiment"])
async def get_batch_sentiment(request: SentimentRequest):
    """Receives a batch of posts, analyzes their sentiment, and returns the results."""
    results = []
    posts_to_infer = []
    post_texts_to_infer = []

    # First, check the cache for existing results
    for post in request.posts:
        cached_result = cache.get_from_cache(post.postId)
        if cached_result:
            results.append(cached_result)
        else:
            posts_to_infer.append(post)
            post_texts_to_infer.append(post.text)

    # If there are posts that weren't in the cache, run inference on them
    if posts_to_infer:
        # Get sentiment predictions from the model
        sentiments = infer.infer_sentiment(texts=post_texts_to_infer, model=sentiment_model)

        for i, post in enumerate(posts_to_infer):
            sentiment_result = SentimentResult(
                postId=post.postId,
                label=sentiments[i]['label'],
                score=sentiments[i]['score']
            )
            results.append(sentiment_result)
            # Save the new result to the cache
            cache.set_in_cache(post.postId, sentiment_result)

    return SentimentResponse(results=results)
