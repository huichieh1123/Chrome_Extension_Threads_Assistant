# store/cache.py

# A simple in-memory dictionary to act as a cache for sentiment results.
# In a production environment, you would use a more robust solution like Redis.
SENTIMENT_CACHE = {}

def get_from_cache(post_id: str):
    """Retrieves a sentiment result from the cache if it exists."""
    return SENTIMENT_CACHE.get(post_id)

def set_in_cache(post_id: str, result):
    """Saves a sentiment result to the cache."""
    SENTIMENT_CACHE[post_id] = result
