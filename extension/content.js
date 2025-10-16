/**
 * @file content.js
 * @description Threads.net Heuristic Content Scraper & View Modifier
 */

// ===== 1. Configurable Parameters =====
const BATCH_SIZE = 20;
const DEBOUNCE_DELAY = 500;
const ACTION_BUTTON_LABELS = ["like", "讚", "reply", "回覆", "repost", "轉發", "share", "分享"];
const PROCESSED_ATTR = "data-xaj-processed";
const STORAGE_KEY = 'sentimentThresholdLevel'; // Key used by the popup

// ===== 2. State Variables =====
let postIndex = 0;
let postQueue = [];
let observer = null;
let scanDebounceTimer = null;

/** @type {Map<string, {element: HTMLElement, label: string|null, originalHTML: string|null}>} */
const postRegistry = new Map();

let settings = {
    enabled: true,
    dataLevel: 2 // Default to Neutral
};

// Maps the backend label to a numeric level for comparison.
const LABEL_TO_LEVEL = {
    "very positive": 4,
    "positive": 3,
    "neutral": 2,
    "negative": 1,
    "very negative": 0
};

// ===== 3. Settings & Storage =====

function applySetting(key, value) {
    if (key === 'enabled' && typeof value === 'boolean') {
        settings.enabled = value;
    } else if (key === STORAGE_KEY && value !== undefined) {
        settings.dataLevel = parseInt(value, 10);
    }
}

chrome.storage.sync.get(["enabled", STORAGE_KEY], (data) => {
  applySetting('enabled', data.enabled);
  applySetting(STORAGE_KEY, data[STORAGE_KEY]);
  console.log("[XAJ] Initial settings loaded:", settings);
  updateAllPostViews();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    let needsUpdate = false;
    for (let [key, { newValue }] of Object.entries(changes)) {
        if (key === 'enabled' || key === STORAGE_KEY) {
            applySetting(key, newValue);
            needsUpdate = true;
        }
    }
    if (needsUpdate) {
        console.log("[XAJ] Settings changed, updating all views:", settings);
        updateAllPostViews();
    }
});

// ===== 4. Helper Functions (DOM & UI) =====

function isVisible(el) {
  if (!el || !(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && (el.offsetWidth > 0 || el.offsetHeight > 0);
}

function isInInteractive(el) {
  if (!el || el === document.body) return false;
  const nodeName = el.nodeName.toLowerCase();
  const role = el.getAttribute("role");
  if (["button", "nav", "a"].includes(nodeName) || role === "button" || role === "navigation") return true;
  if (el.getAttribute("aria-label") && ACTION_BUTTON_LABELS.some(label => el.getAttribute("aria-label").toLowerCase().includes(label))) return true;
  return isInInteractive(el.parentElement);
}

function findLowestCommonAncestor(nodes) {
  if (!nodes || nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0];
  let paths = new WeakMap();
  let current = nodes[0];
  while (current) {
    paths.set(current, true);
    current = current.parentElement;
  }
  for (let i = 1; i < nodes.length; i++) {
    let current2 = nodes[i];
    while (current2) {
      if (paths.has(current2)) return current2;
      current2 = current2.parentElement;
    }
  }
  return null;
}

// ===== 5. Core Logic (Detection, Extraction, View Updates) =====

function findPostRoot(startElement) {
  if (!startElement || startElement.hasAttribute(PROCESSED_ATTR)) return null;
  const searchArea = startElement.parentElement.parentElement;
  if (!searchArea) return null;
  const buttons = [], textNodes = [];
  const allElements = searchArea.querySelectorAll("*");
  for (const el of allElements) {
    const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
    if (ACTION_BUTTON_LABELS.some(label => ariaLabel.includes(label))) buttons.push(el);
    if (el.matches("[dir='auto']") && el.innerText.trim().length > 5 && isVisible(el)) textNodes.push(el);
  }
  if (buttons.length >= 2 && textNodes.length >= 1) {
    const lca = findLowestCommonAncestor([...buttons, ...textNodes]);
    const container = lca?.parentElement?.parentElement;
    if (container && container !== document.body) return container;
  }
  return null;
}

function extractPostText(root) {
  const texts = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: n => (n.nodeType === Node.TEXT_NODE && !isInInteractive(n.parentElement) && n.textContent.trim()) ? NodeFilter.FILTER_ACCEPT : (n.nodeName.toLowerCase() === 'img' && n.alt) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
  while (walker.nextNode()) {
    if(walker.currentNode.nodeType === Node.TEXT_NODE) texts.push(walker.currentNode.textContent.trim());
    else if (walker.currentNode.nodeName.toLowerCase() === 'img') texts.push(`[Image: ${walker.currentNode.alt}]`);
  }
  return texts.join(" ").trim();
}

function updatePostView(postId) {
    const postData = postRegistry.get(postId);
    if (!postData || !postData.label) return;

    const { element, label, originalHTML } = postData;
    const isHidden = originalHTML !== null;

    // Convert the post's text label (e.g., "Positive") to its numeric level (e.g., 3)
    const postLevel = LABEL_TO_LEVEL[label.toLowerCase()] ?? 2; // Default to Neutral

    // The user's setting (e.g., 3) is the minimum level they want to see.
    const minLevelToShow = settings.dataLevel;
    
    const shouldHide = settings.enabled && postLevel < minLevelToShow;

    if (shouldHide && !isHidden) {
        postData.originalHTML = element.innerHTML;
        element.innerHTML = '';
        const notice = document.createElement('div');
        notice.style.padding = '20px';
        notice.style.textAlign = 'center';
        notice.style.color = '#888';
        notice.innerHTML = `
            <p>此貼文已被隱藏 (評級: ${label})。</p>
            <button class="xaj-restore-btn">仍然顯示</button>
        `;
        notice.querySelector('.xaj-restore-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            restorePost(postId);
        });
        element.appendChild(notice);
    } else if (!shouldHide && isHidden) {
        restorePost(postId);
    }
}

function restorePost(postId) {
    const postData = postRegistry.get(postId);
    if (postData && postData.originalHTML !== null) {
        postData.element.innerHTML = postData.originalHTML;
        postData.originalHTML = null;
    }
}

function updateAllPostViews() {
    for (const postId of postRegistry.keys()) {
        updatePostView(postId);
    }
}

// ===== 6. Main Processing & Batching =====

function processPost(element) {
  if (!element || !(element instanceof HTMLElement) || element.hasAttribute(PROCESSED_ATTR)) return;
  element.setAttribute(PROCESSED_ATTR, "true");
  const text = extractPostText(element);
  if (!text || text.length < 10) return;
  postIndex++;
  const postId = `post-${Date.now()}-${postIndex}`;
  element.setAttribute('data-xaj-postid', postId);
  postRegistry.set(postId, { element, label: null, originalHTML: null });
  postQueue.push({ postId, text });
  if (postQueue.length >= BATCH_SIZE) sendBatch();
}

function sendBatch() {
  if (postQueue.length === 0) return;
  const batch = [...postQueue];
  postQueue = [];
  console.log(`[XAJ] Sending batch of ${batch.length} posts for labeling.`);
  chrome.runtime.sendMessage({ type: "batchPosts", posts: batch }, (response) => {
    if (response && response.success && response.results) {
        response.results.forEach(result => {
            if (postRegistry.has(result.postId)) {
                const postData = postRegistry.get(result.postId);
                postData.label = result.label;
                updatePostView(result.postId);
            }
        });
    } else {
        console.error("[XAJ] Failed to get labels for batch:", response?.error);
    }
  });
}

// ===== 7. Scanning and Observation =====

function scanForPosts() {
  const potentialTextElements = document.querySelectorAll("[dir='auto']");
  potentialTextElements.forEach(el => {
    if (!isVisible(el) || el.closest(`[${PROCESSED_ATTR}]`)) return;
    const root = findPostRoot(el);
    if (root && !root.hasAttribute(PROCESSED_ATTR)) processPost(root);
  });
}

function startObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver((mutations) => {
    clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(() => {
      const hasPotentialContent = mutations.some(m => m.addedNodes.length > 0);
      if (hasPotentialContent) scanForPosts();
    }, DEBOUNCE_DELAY);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log("[XAJ] MutationObserver started.");
}

// ===== 8. Initialization =====

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(scanForPosts, 1000);
    startObserver();
  });
} else {
  setTimeout(scanForPosts, 1000);
  startObserver();
}

setInterval(sendBatch, 5000);
console.log("[XAJ] Heuristic Threads scraper initialized.");
