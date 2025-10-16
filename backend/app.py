from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel, Field
from datetime import datetime

# Import sentiment analysis modules (your friend's code)
# from .sentiment import loader, infer
# from .store import cache

app = FastAPI(
    title="Threads Sentiment Analysis API",
    description="An API to analyze the sentiment of posts from threads.net.",
    version="1.0.0",
)

# Add CORS middleware to allow requests from Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

# For scraper (your code)
class ScraperPost(BaseModel):
    """Post data from the scraper"""
    post_id: str
    author: str
    text: str
    url: str = ""
    scraped_at: str


class ScraperPostsRequest(BaseModel):
    """Request from scraper with batch of posts"""
    posts: List[ScraperPost]


class ScraperPostsResponse(BaseModel):
    """Response to scraper"""
    received: int
    total_stored: int
    message: str


# For Chrome extension (your friend's code)
class ExtensionPost(BaseModel):
    """Post data from Chrome extension"""
    postId: str = Field(..., description="Unique identifier for the post.")
    author: str = Field(..., description="Author of the post.")
    text: str = Field(..., description="Text content of the post.")
    timestamp: str = Field(..., description="ISO 8601 timestamp of the post.")


class SentimentRequest(BaseModel):
    """Request from extension for sentiment analysis"""
    posts: List[ExtensionPost]


class SentimentResult(BaseModel):
    """Sentiment analysis result"""
    postId: str
    label: str  # POSITIVE, NEGATIVE, NEUTRAL
    score: float


class SentimentResponse(BaseModel):
    """Response to extension with sentiment results"""
    results: List[SentimentResult]


# --- In-Memory Storage ---
# Store posts received from scraper
stored_posts = {}

# Simple cache for sentiment results
sentiment_cache = {}


# --- Helper Functions ---

def print_separator():
    """Print a separator line"""
    print("=" * 20)


def print_post_to_terminal(post: ScraperPost, post_number: int):
    """Print post details to terminal in a formatted way"""
    print(f"\n Post #{post_number}")
    print(f"Author: @{post.author}")
    print(f"Text: {post.text[:150]}{'...' if len(post.text) > 150 else ''}")
    if post.url:
        print(f"URL: {post.url}")
    # print(f"Scraped at: {post.scraped_at}")
    print("-" * 20)


# --- Endpoints ---

@app.get("/", tags=["Health"])
async def read_root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "total_posts": len(stored_posts),
        "cached_sentiments": len(sentiment_cache)
    }


@app.post("/api/posts", response_model=ScraperPostsResponse, tags=["Scraper"])
async def receive_posts_from_scraper(request: ScraperPostsRequest):
    """
    Endpoint for scraper to send posts.
    Stores posts and returns confirmation.
    """
    received_count = 0
    current_time = datetime.now().strftime("%H:%M:%S")
    
    # Print header
    if request.posts:
        print_separator()
        print(f" [{current_time}] Received {len(request.posts)} posts from scraper")
    
    for post in request.posts:
        # Store post using post_id as key
        if post.post_id not in stored_posts:
            stored_posts[post.post_id] = {
                "post_id": post.post_id,
                "author": post.author,
                "text": post.text,
                "url": post.url,
                # "scraped_at": post.scraped_at
            }
            received_count += 1
            
            # Print each new post to terminal
            print_post_to_terminal(post, received_count)
    
    # Print summary
    if received_count > 0:
        print(f"\n Successfully stored {received_count} new posts")
        print(f" Total posts in storage: {len(stored_posts)}")
        print()
    
    return ScraperPostsResponse(
        received=received_count,
        total_stored=len(stored_posts),
        message=f"Successfully received {received_count} new posts"
    )


@app.post("/sentiment/batch", response_model=SentimentResponse, tags=["Sentiment"])
async def get_batch_sentiment(request: SentimentRequest):
    """
    Endpoint for Chrome extension to get sentiment analysis.
    Currently returns mock data. Your friend will integrate the actual model.
    """
    results = []
    current_time = datetime.now().strftime("%H:%M:%S")
    
    print(f"\n [{current_time}] Sentiment analysis requested for {len(request.posts)} posts")
    
    for post in request.posts:
        # Check cache first
        if post.postId in sentiment_cache:
            results.append(sentiment_cache[post.postId])
            continue
        
        # TODO: Replace with actual sentiment analysis
        # For now, return mock sentiment based on text length
        text_len = len(post.text)
        if text_len < 50:
            label, score = "NEUTRAL", 0.75
        elif text_len < 100:
            label, score = "POSITIVE", 0.82
        else:
            label, score = "NEGATIVE", 0.68
        
        sentiment_result = SentimentResult(
            postId=post.postId,
            label=label,
            score=score
        )
        
        # Cache the result
        sentiment_cache[post.postId] = sentiment_result
        results.append(sentiment_result)
        
        # Print sentiment result
        print(f"  • @{post.author}: {label} ({score:.2f})")
    
    print()
    
    return SentimentResponse(results=results)


@app.get("/api/posts/count", tags=["Stats"])
async def get_posts_count():
    """Get statistics about stored posts"""
    return {
        "total_posts": len(stored_posts),
        "cached_sentiments": len(sentiment_cache)
    }


@app.get("/api/posts/list", tags=["Stats"])
async def list_posts(limit: int = 10):
    """List recent posts (for debugging)"""
    posts_list = list(stored_posts.values())
    return {
        "total": len(posts_list),
        "posts": posts_list[-limit:]  # Return last N posts
    }


# --- Integration with Sentiment Model ---
# Uncomment and modify when ready to integrate actual sentiment model:

# Load the sentiment analysis model on startup
# sentiment_model = loader.load_sentiment_model()

# Then in get_batch_sentiment, replace mock code with:
# sentiments = infer.infer_sentiment(
#     texts=[post.text for post in posts_to_infer], 
#     model=sentiment_model
# )