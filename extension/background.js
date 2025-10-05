// background.js

const BACKEND_URL = 'http://127.0.0.1:8000/sentiment/batch';

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'batchPosts') {
        console.log('Received posts from content script:', message.posts);
        fetchSentimentForPosts(message.posts);
    }
});

async function fetchSentimentForPosts(posts) {
    try {
        const response = await fetch(BACKEND_URL, {
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
        console.log('Received sentiment from backend:', data);

        // Send the results back to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'sentimentResults', results: data.results });
            }
        });

    } catch (error) {
        console.error('Error fetching sentiment:', error);
    }
}
