"""
Configuration file for Threads Feed Scraper
All settings centralized here for easy maintenance
"""

# Backend API Settings
API_BASE_URL = "http://127.0.0.1:8000"
API_ENDPOINT = f"{API_BASE_URL}/api/posts"  # Scraper sends to this endpoint
API_TIMEOUT = 10  # seconds

# Scraping Settings
DEFAULT_INTERVAL = 2.0  # seconds
THREADS_URL = "https://www.threads.net/?hl=zh-tw"

# Chrome Driver Settings
CHROME_OPTIONS = {
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'log_level': '3',
    'disable_features': ['AutomationControlled'],
}

# Element Selectors
# These selectors need to be updated based on Threads.net's actual HTML structure
SELECTORS = {
    'posts': [
        ('css', "div[data-pressable-container='true']"),
        ('tag', "article"),
        ('css', "div[role='article']"),
    ],
    'author': [
        "a[role='link']",
        "span[dir='auto']",
        "div.x1lliihq span",
        "a[href*='/@']",
    ],
    'text': [
        "div[dir='auto']",
        "span[dir='auto']",
        "div.x1lliihq",
    ],
    'link': [
        "a[href*='/post/']",
        "a[href*='/t/']",
    ],
}