// Live Data system for real-time updates
import { fetchPostIds } from './api.js';
import { state, elements } from './state.js';
import { apiCache } from './cache.js';
import { throttle } from './utils.js';

// Live Data система
export function updateLiveDataBar(message) {
    if (elements.liveUpdatesBar) {
        const now = new Date().toLocaleTimeString();
        elements.liveUpdatesBar.innerHTML = `<p>🔄 ${message} | Last update: ${now}</p>`;
        state.lastUpdateTime = Date.now();
    }
}

export async function checkForNewPosts() {
    if (!state.liveDataEnabled) return;
    
    try {
        const newIds = await fetchPostIds(state.currentPostType);
        const oldIds = state.allPostIds.slice(0, 10); // Compare first 10
        const latestIds = newIds.slice(0, 10);
        
        // Check if there are new posts
        const hasNewPosts = latestIds.some(id => !oldIds.includes(id));
        
        if (hasNewPosts) {
            const newCount = latestIds.filter(id => !oldIds.includes(id)).length;
            updateLiveDataBar(`📢 ${newCount} new posts available!`);
            
            // Update cache
            apiCache.set(`postIds_${state.currentPostType}`, newIds);
            
            // Show refresh notification
            showRefreshNotification(newCount);
        } else {
            updateLiveDataBar('✅ Data is up to date');
        }
    } catch (error) {
        console.error('Error checking for new posts:', error);
        updateLiveDataBar('⚠️ Error checking for updates');
    }
}

export function showRefreshNotification(newCount) {
    // Remove existing notifications
    document.querySelectorAll('.refresh-notification').forEach(n => n.remove());
    
    // Create notification about new posts
    const notification = document.createElement('div');
    notification.className = 'refresh-notification';
    notification.innerHTML = `
        <span>📢 ${newCount} new posts</span>
        <button onclick="refreshPosts()" class="refresh-btn">Refresh</button>
        <button onclick="dismissNotification(this)" class="dismiss-btn">×</button>
    `;
    
    // Add to container start
    elements.postsContainer.insertBefore(notification, elements.postsContainer.firstChild);
}

// Global functions for notifications
window.dismissNotification = function(btn) {
    btn.parentElement.remove();
};

window.refreshPosts = async function() {
    apiCache.clear();
    // Import loadPosts function dynamically to avoid circular dependency
    const { loadPosts } = await import('./app.js');
    await loadPosts();
    // Remove all notifications
    document.querySelectorAll('.refresh-notification').forEach(n => n.remove());
};

// Start Live Data system
let liveDataTimer;

export function startLiveData() {
    if (liveDataTimer) clearInterval(liveDataTimer);
    
    liveDataTimer = setInterval(() => {
        throttledCheckForNewPosts();
    }, state.liveUpdateInterval);
    
    updateLiveDataBar('🔄 Live updates active');
}

export function stopLiveData() {
    if (liveDataTimer) {
        clearInterval(liveDataTimer);
        liveDataTimer = null;
    }
    updateLiveDataBar('⏸️ Live updates paused');
}

// Throttled version of new posts check
export const throttledCheckForNewPosts = throttle(checkForNewPosts, state.throttleDelay);