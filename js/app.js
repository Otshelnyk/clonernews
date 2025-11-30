// Main application file - now modularized
import { fetchPostIds, fetchItem } from './api.js';
import { state, elements, initializeElements } from './state.js';
import { apiCache } from './cache.js';
import { displayPost } from './posts.js';
import { startLiveData, stopLiveData, updateLiveDataBar } from './liveData.js';

// Main post loading function
export async function loadPosts() {
    elements.loadingIndicator.style.display = 'block';
    elements.postsContainer.innerHTML = '<h2>Loading content...</h2>';
    
    try {
        // Check cache first
        const cacheKey = `postIds_${state.currentPostType}`;
        let postIds = apiCache.get(cacheKey);
        
        if (!postIds) {
            postIds = await fetchPostIds(state.currentPostType);
            apiCache.set(cacheKey, postIds);
        }
        
        state.allPostIds = postIds;
        state.postsLoadedCount = 0; // Reset counter

        console.log(`Total IDs fetched for ${state.currentPostType}: ${state.allPostIds.length}`);

        if (state.allPostIds.length === 0) {
            elements.postsContainer.innerHTML = '<h2>No posts available</h2>';
            elements.loadingIndicator.style.display = 'none';
            return;
        }

        await loadNextBatch(); 
        updateLiveDataBar(`Loaded ${state.postsLoadedCount} posts`);
    } catch (error) {
        console.error('Error loading posts:', error);
        elements.postsContainer.innerHTML = '<h2>Error loading posts. Please try again later.</h2>';
        updateLiveDataBar('❌ Error loading data');
    }

    elements.loadingIndicator.style.display = 'none';
}

// Load next batch of posts
async function loadNextBatch() {
    const start = state.postsLoadedCount;
    const end = start + state.postsPerLoad;
    const batchIds = state.allPostIds.slice(start, end);

    if (batchIds.length === 0) {
        console.log("No more posts to load.");
        return;
    }
    
    elements.loadingIndicator.style.display = 'block';
    const itemPromises = batchIds.map(id => fetchItem(id));
    const postsData = await Promise.all(itemPromises);
    const validPosts = postsData.filter(post => post !== null);

    validPosts.forEach(post => {
        displayPost(post);
    });

    state.postsLoadedCount += validPosts.length;
    elements.loadingIndicator.style.display = 'none';

    if (state.postsLoadedCount < state.allPostIds.length) {
        intersectionObserver.observe(elements.loadingIndicator);
    }
}

// Navigation click handler
async function handleNavClick(event) {
    const newType = event.target.dataset.type;

    if (!newType || newType === state.currentPostType) {
        return;
    }

    state.currentPostType = newType;

    elements.navButtons.forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');

    await loadPosts();
}

// Intersection Observer for infinite scrolling
let intersectionObserver;

function setupIntersectionObserver() {
    intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[0]; 

        if (entry.isIntersecting && state.postsLoadedCount > 0 && state.postsLoadedCount < state.allPostIds.length) {
            console.log("Loading indicator visible. Triggering next batch.");
            intersectionObserver.unobserve(elements.loadingIndicator);
            loadNextBatch();
        }
    }, {
        threshold: 0.1
    });
}

// Application initialization
function initializeApp() {
    console.log("App initialized.");
    
    // Initialize DOM elements
    initializeElements();
    
    // Navigation events
    if (elements.postTypeNav) {
        elements.postTypeNav.addEventListener('click', handleNavClick);
    }
    
    // Add Live Data control
    const liveToggle = document.createElement('button');
    liveToggle.className = 'live-toggle';
    liveToggle.textContent = '⏸️ Pause';
    liveToggle.onclick = () => {
        if (state.liveDataEnabled) {
            state.liveDataEnabled = false;
            stopLiveData();
            liveToggle.textContent = '▶️ Start';
        } else {
            state.liveDataEnabled = true;
            startLiveData();
            liveToggle.textContent = '⏸️ Pause';
        }
    };
    
    if (elements.liveUpdatesBar) {
        elements.liveUpdatesBar.appendChild(liveToggle);
    }
    
    // Setup intersection observer for infinite scroll
    setupIntersectionObserver();
    
    // Pause Live Data when window is inactive
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopLiveData();
        } else if (state.liveDataEnabled) {
            startLiveData();
        }
    });
    
    // Load initial data
    loadPosts();
    
    // Start Live Data system
    if (state.liveDataEnabled) {
        startLiveData();
    }
}

// Start the application
initializeApp();