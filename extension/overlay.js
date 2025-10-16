// overlay.js

function addSentimentBadge(postId, label, score) {
    // Find the post element by its data attribute
    const postElement = document.querySelector(`div[data-post-id="${postId}"]`);
    if (!postElement) return;

    // Create the badge element
    const badge = document.createElement('div');
    badge.className = `sentiment-badge sentiment-${label.toLowerCase()}`;
    badge.innerText = `${label} (${score.toFixed(2)})`;

    // Basic styling for the badge
    const style = {
        padding: '2px 6px',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
    };

    // Color coding for different sentiments
    const colors = {
        positive: '#28a745', // Green
        negative: '#dc3545', // Red
        neutral: '#6c757d',  // Gray
    };

    style.backgroundColor = colors[label.toLowerCase()] || colors.neutral;

    Object.assign(badge.style, style);

    // Ensure the parent is positioned to contain the absolute badge
    if (getComputedStyle(postElement).position === 'static') {
        postElement.style.position = 'relative';
    }

    postElement.appendChild(badge);
}
