// Utility functions for the application

// HTML escaping for security
export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Format timestamp to human readable format
export function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
        return 'just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Throttling function for API rate limiting
export function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

// Debouncing function for request grouping
export function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Post type utilities
export function getPostIcon(type) {
    const icons = {
        'story': '📰',
        'job': '💼',
        'poll': '📊',
        'comment': '💬',
        'ask': '❓'
    };
    return icons[type] || '📄';
}

export function getPostTypeLabel(type) {
    const labels = {
        'story': 'Story',
        'job': 'Job',
        'poll': 'Poll',
        'comment': 'Comment',
        'ask': 'Ask HN'
    };
    return labels[type] || 'Post';
}

export function getPostUrl(post) {
    if (post.url) {
        return post.url;
    }
    // For Ask HN, polls and comments use HN link
    return `https://news.ycombinator.com/item?id=${post.id}`;
}

export function determinePostType(post) {
    // More detailed post type determination
    if (post.type) {
        return post.type;
    }
    
    // Determine type by title and content
    const title = (post.title || '').toLowerCase();
    
    if (title.startsWith('ask hn:') || title.startsWith('ask hacker news:')) {
        return 'ask';
    }
    
    if (title.includes('hiring') || title.includes('job') || 
        title.includes('remote') || title.includes('freelance')) {
        return 'job';
    }
    
    if (post.parts && post.parts.length > 0) {
        return 'poll';
    }
    
    if (post.parent) {
        return 'comment';
    }
    
    return 'story';
}