// content.js - Fixed: only scrape once and only visible posts

const SCRAPER_ENDPOINT = 'http://127.0.0.1:8000/api/posts';
const SENTIMENT_ENDPOINT = 'http://127.0.0.1:8000/sentiment/batch';

// Track processed posts to avoid duplicates (same as Python scraper)
const processedPosts = new Set();

// Scraping interval (in milliseconds)
const SCRAPE_INTERVAL = 2000; // 2 seconds

// Use a MutationObserver to detect when new posts are added to the page
const observer = new MutationObserver((mutationsList, observer) => {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            findAndProcessPosts();
        }
    }
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Also run on interval to catch posts that might be missed
setInterval(() => {
    findAndProcessPosts();
}, SCRAPE_INTERVAL);

function findAndProcessPosts() {
    // TODO: Update these selectors to match Threads.net actual HTML structure
    const postSelectors = [
        "div[data-pressable-container='true']",
        "article",
        "div[role='article']"
    ];
    
    let postElements = [];
    
    // Try each selector until we find posts
    for (const selector of postSelectors) {
        postElements = document.querySelectorAll(selector);
        if (postElements.length > 0) break;
    }
    
    if (postElements.length === 0) {
        console.log('No post elements found');
        return;
    }

    const newPosts = [];
    const postsForSentiment = [];
    let newPostsCount = 0;

    Array.from(postElements).forEach(postEl => {
        // IMPORTANT: Check if post is visible in viewport (same as Python scraper)
        if (!isElementVisible(postEl)) {
            return;
        }
        
        // Extract post data FIRST (needed to generate stable ID)
        const author = extractAuthor(postEl);
        const text = extractText(postEl, author);
        const url = extractUrl(postEl);
        
        // Only process if we have actual content
        if (!text || text === author || text.trim().length === 0) {
            return;
        }
        
        // Generate unique ID based on content (not HTML)
        const postId = generatePostId(postEl);
        
        // Debug: log what we're using for ID
        // console.log(`Generating ID from: ${author} | ${text.substring(0, 30)}... | ${url}`);
        
        // IMPORTANT: Skip if already processed (same as Python scraper)
        if (processedPosts.has(postId)) {
            return;
        }
        
        // Mark as processed
        processedPosts.add(postId);
        postEl.setAttribute('data-sentiment-processed', 'true');
        postEl.setAttribute('data-post-id', postId);
        
        newPostsCount++;
        
        // Prepare data for scraper endpoint
        newPosts.push({
            post_id: postId,
            author: author,
            text: text,
            url: url,
            scraped_at: new Date().toISOString()
        });
        
        // Prepare data for sentiment endpoint
        postsForSentiment.push({
            postId: postId,
            author: author,
            text: text,
            timestamp: new Date().toISOString()
        });
        
        console.log(`Post #${newPostsCount} - @${author}`);
        console.log(`  ${text.substring(0, 100)}...`);
        console.log('-'.repeat(60));
    });

    // Only send if we have NEW posts
    if (newPosts.length > 0) {
        sendToScraper(newPosts);
        chrome.runtime.sendMessage({ type: 'batchPosts', posts: postsForSentiment });
    } else {
        console.log('  No new posts on current screen');
    }
    
    console.log(`  Total processed: ${processedPosts.size} posts\n`);
}

function isElementVisible(element) {
    // Check if element is visible in viewport (same logic as Python scraper)
    try {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const elemTop = rect.top + scrollY;
        const elemBottom = elemTop + rect.height;
        
        // Element is visible if it's within viewport bounds
        return (elemTop < scrollY + viewportHeight) && (elemBottom > scrollY);
    } catch (e) {
        return false;
    }
}

function generatePostId(element) {
    // Generate stable ID based on author + text content (not HTML which changes)
    const author = extractAuthor(element);
    const text = extractText(element, author);
    const url = extractUrl(element);
    
    // Combine stable content to create ID
    const stableContent = author + '|||' + text + '|||' + url;
    
    // Generate hash
    let hash = 0;
    for (let i = 0; i < stableContent.length; i++) {
        const char = stableContent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

function extractAuthor(postEl) {
    // Try multiple selectors for author, but filter out UI elements
    const authorSelectors = [
        "a[role='link']",
        "span[dir='auto']",
        "div.x1lliihq span",
        "a[href*='/@']"
    ];
    
    for (const selector of authorSelectors) {
        const authorEl = postEl.querySelector(selector);
        if (authorEl && authorEl.innerText.trim()) {
            const author = authorEl.innerText.trim();
            // Filter out common UI text and numbers
            if (author !== 'Translate' && 
                !/^\d+$/.test(author) &&
                !/^[\d.]+[KMk]$/.test(author) &&
                !/^\d+[hm]$/.test(author) &&
                author.length > 2) {
                return author;
            }
        }
    }
    
    return 'Unknown';
}

function extractText(postEl, author) {
    // Try specific text selectors first to get clean content
    const textSelectors = [
        "div[dir='auto']",
        "span[dir='auto']",
        "div.x1lliihq"
    ];
    
    let longestText = '';
    
    for (const selector of textSelectors) {
        const textEls = postEl.querySelectorAll(selector);
        textEls.forEach(el => {
            const text = el.innerText.trim();
            // Filter out: author name, numbers only, translate buttons, very short text
            if (!text || 
                text === author || 
                text === 'Translate' ||
                /^\d+$/.test(text) || // Only numbers
                /^[\d.]+[KMk]$/.test(text) || // Like "7.9K"
                /^\d+h$/.test(text) || // Like "3h"
                /^\d+m$/.test(text) || // Like "10m"
                text.length < 5) {
                return;
            }
            
            if (text.length > longestText.length) {
                longestText = text;
            }
        });
    }
    
    // Clean up: remove trailing numbers and common UI elements
    longestText = longestText
        .replace(/\s*Translate\s*/gi, '')
        .replace(/\s*NEUTRAL\s*\([^)]+\)\s*/gi, '')
        .replace(/\s*POSITIVE\s*\([^)]+\)\s*/gi, '')
        .replace(/\s*NEGATIVE\s*\([^)]+\)\s*/gi, '')
        .trim();
    
    return longestText;
}

function extractUrl(postEl) {
    const linkSelectors = [
        "a[href*='/post/']",
        "a[href*='/t/']"
    ];
    
    for (const selector of linkSelectors) {
        const linkEl = postEl.querySelector(selector);
        if (linkEl) {
            return linkEl.href;
        }
    }
    
    return '';
}

async function sendToScraper(posts) {
    try {
        const response = await fetch(SCRAPER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ posts: posts }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`   Successfully sent ${posts.length} new posts`);
        console.log(`    Backend now has ${data.total_stored} posts total`);

    } catch (error) {
        console.error('   Error sending to scraper:', error);
    }
}

// Listen for messages from the background script containing sentiment results
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sentimentResults') {
        message.results.forEach(result => {
            addSentimentBadge(result.postId, result.label, result.score);
        });
    }
});

// Initial run when the script is injected
console.log('[Scan #1 - ' + new Date().toLocaleTimeString() + ']');
findAndProcessPosts();