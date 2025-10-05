// popup.js

document.addEventListener('DOMContentLoaded', function () {
    // Toggles
    const sentimentToggle = document.getElementById('sentiment-toggle');
    const fakenewsToggle = document.getElementById('fakenews-toggle');
    const relatedToggle = document.getElementById('related-toggle');

    // Emoji selector elements
    const thresholdSelector = document.getElementById('sentiment-threshold-selector');
    const emojis = document.querySelectorAll('.emoji');

    // Define keys for chrome.storage
    const settingsKeys = {
        sentiment: 'sentimentReviewerEnabled',
        fakeNews: 'fakeNewsReviewerEnabled',
        related: 'relatedPostReviewerEnabled',
        threshold: 'sentimentThresholdLevel'
    };

    // --- Functions ---

    function updateThresholdVisibility(isEnabled) {
        if (isEnabled) {
            thresholdSelector.classList.remove('hidden');
        } else {
            thresholdSelector.classList.add('hidden');
        }
    }

    function updateEmojiSelection(level) {
        emojis.forEach(emoji => {
            if (emoji.dataset.level == level) {
                emoji.classList.add('selected');
            } else {
                emoji.classList.remove('selected');
            }
        });
    }

    // --- Load initial settings ---

    chrome.storage.sync.get(Object.values(settingsKeys), function(result) {
        // Set main toggles
        const isSentimentEnabled = !!result[settingsKeys.sentiment];
        sentimentToggle.checked = isSentimentEnabled;
        fakenewsToggle.checked = !!result[settingsKeys.fakeNews];
        relatedToggle.checked = !!result[settingsKeys.related];

        // Set initial visibility for emoji selector
        updateThresholdVisibility(isSentimentEnabled);

        // Set initial selected emoji (default to level 2 'Neutral' if not set)
        const thresholdLevel = result[settingsKeys.threshold] !== undefined ? result[settingsKeys.threshold] : 2;
        updateEmojiSelection(thresholdLevel);
    });

    // --- Event Listeners ---

    // Listener for the main sentiment toggle
    sentimentToggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        chrome.storage.sync.set({ [settingsKeys.sentiment]: isEnabled });
        updateThresholdVisibility(isEnabled);
    });

    // Listeners for the other toggles
    fakenewsToggle.addEventListener('change', function() {
        chrome.storage.sync.set({ [settingsKeys.fakeNews]: this.checked });
    });

    relatedToggle.addEventListener('change', function() {
        chrome.storage.sync.set({ [settingsKeys.related]: this.checked });
    });

    // Listener for emoji clicks
    emojis.forEach(emoji => {
        emoji.addEventListener('click', function() {
            const level = this.dataset.level;
            chrome.storage.sync.set({ [settingsKeys.threshold]: level });
            updateEmojiSelection(level);
        });
    });
});