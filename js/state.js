// Application state management
export const state = {
    allPostIds: [],
    postsLoadedCount: 0,
    postsPerLoad: 10,
    currentPostType: 'newstories',
    liveDataEnabled: true,
    lastUpdateTime: null,
    requestQueue: new Map(),
    throttleDelay: 500,
    liveUpdateInterval: 30000 // 30 seconds instead of 5
};

// DOM elements
export const elements = {
    postsContainer: document.getElementById('posts-container'),
    loadingIndicator: document.getElementById('loading-indicator'),
    liveUpdatesBar: document.getElementById('live-updates-bar'),
    postTypeNav: document.getElementById('post-type-nav'),
    navButtons: null // Will be set after DOM is ready
};

// Initialize elements that need query selectors
export function initializeElements() {
    if (elements.postTypeNav) {
        elements.navButtons = elements.postTypeNav.querySelectorAll('button');
    }
}