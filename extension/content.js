// content.js

// Use a MutationObserver to detect when new posts are added to the page.
const observer = new MutationObserver((mutationsList, observer) => {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Check for new posts and process them
            findAndProcessPosts();
        }
    }
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });

function findAndProcessPosts() {
    // NOTE: These selectors are placeholders and will need to be updated to match the actual HTML structure of threads.net
    const postElements = document.querySelectorAll('div[data-post-id]:not([data-sentiment-processed])');

    if (postElements.length === 0) return;

    const posts = Array.from(postElements).map(postEl => {
        // Mark the post as processed to avoid re-processing
        postEl.setAttribute('data-sentiment-processed', 'true');

        const postId = postEl.getAttribute('data-post-id');
        // Replace with actual selectors
        const author = postEl.querySelector('.post-author')?.innerText || 'Unknown Author';
        const text = postEl.querySelector('.post-text')?.innerText || '';
        const timestamp = postEl.querySelector('.post-timestamp')?.getAttribute('datetime') || new Date().toISOString();

        return { postId, author, text, timestamp };
    });

    // Send the collected post data to the background script for processing
    if (posts.length > 0) {
        chrome.runtime.sendMessage({ type: 'batchPosts', posts: posts });
    }
}

// Listen for messages from the background script containing sentiment results
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sentimentResults') {
        // Add sentiment badges to the posts
        message.results.forEach(result => {
            addSentimentBadge(result.postId, result.label, result.score);
        });
    }
});

// Initial run when the script is injected
findAndProcessPosts();
