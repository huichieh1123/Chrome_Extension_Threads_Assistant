/**
 * @file bg.js
 * @description Background service worker for the Threads Sentiment Filter extension.
 */

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "batchPosts" && msg.posts?.length > 0) {
    
    console.log(`[Background] Received batch of ${msg.posts.length} posts. Sending to API.`);

    // The backend now expects the full post objects
    fetch("http://127.0.0.1:8723/score_batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: msg.posts }) 
    })
      .then(r => {
        if (!r.ok) {
          // If the response is not OK, read the body as text for more detailed error info
          return r.text().then(text => {
            throw new Error(`API request failed with status: ${r.status}. Body: ${text}`);
          });
        }
        return r.json();
      })
      .then(data => {
        // The backend now returns an object with a 'results' key,
        // where each result has a 'postId' and a 'label'.
        if (data && data.results) {
          console.log("[Background] Ratings received. Sending results back to content script.");
          sendResponse({ success: true, results: data.results });
        } else {
          throw new Error("Unexpected API response format from backend.");
        }
      })
      .catch(err => {
        console.error("[Background] Error in background script:", err);
        sendResponse({ success: false, error: err.toString() });
      });

    // Return true to indicate that we will respond asynchronously.
    return true;
  }
});

console.log("[Background] Service worker started and listener is ready.");
