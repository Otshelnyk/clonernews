// Comments rendering and management
import { fetchItem } from './api.js';
import { apiCache } from './cache.js';
import { escapeHtml, formatTime } from './utils.js';

export async function renderComments(commentIds, parentContainer, depth = 0) {
    if (!commentIds || commentIds.length === 0) return;
    
    const repliesContainer = document.createElement('div');
    repliesContainer.className = `comment-replies depth-${depth}`;
    parentContainer.appendChild(repliesContainer);

    // Load comments with caching
    const commentPromises = commentIds.map(async (id) => {
        const cacheKey = `comment_${id}`;
        let comment = apiCache.get(cacheKey);
        
        if (!comment) {
            comment = await fetchItem(id);
            if (comment) {
                apiCache.set(cacheKey, comment);
            }
        }
        
        return { id, comment };
    });
    
    const commentsData = await Promise.all(commentPromises);
    
    // Sort comments by time (newest first)
    const sortedComments = commentsData
        .filter(({ comment }) => comment && !comment.deleted && !comment.dead)
        .sort((a, b) => (b.comment.time || 0) - (a.comment.time || 0));

    for (const { comment } of sortedComments) {
        const commentElement = document.createElement('div');
        commentElement.className = `comment-item depth-${depth}`;
        commentElement.setAttribute('data-comment-id', comment.id);
        
        const hasReplies = comment.kids && comment.kids.length > 0;
        const replyCount = hasReplies ? comment.kids.length : 0;
        
        commentElement.innerHTML = `
            <div class="comment-meta">
                <span class="comment-author">${escapeHtml(comment.by || 'n/a')}</span>
                <span class="comment-time">${formatTime(comment.time)}</span>
                ${replyCount > 0 ? `<span class="reply-count">(${replyCount} replies)</span>` : ''}
                ${depth < 5 && hasReplies ? `
                    <button class="toggle-replies" onclick="toggleReplies(${comment.id})">
                        <span class="toggle-text">Collapse</span> <span class="toggle-icon">▲</span>
                    </button>
                ` : ''}
            </div>
            <div class="comment-text">${comment.text || 'Comment deleted or empty.'}</div>
            <div class="comment-actions">
                <button class="reply-btn" onclick="showReplyForm(${comment.id})">Reply</button>
                <button class="permalink-btn" onclick="copyPermalink(${comment.id})">Link</button>
            </div>
        `;
        
        repliesContainer.appendChild(commentElement);
        
        // Recursively load nested comments, but limit depth
        if (hasReplies && depth < 5) {
            // Show all replies by default, no need for lazy loading
            await renderComments(comment.kids, commentElement, depth + 1);
        }
    }
}

// Global functions for comment interactions
window.toggleReplies = async function(commentId) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const repliesContainer = commentElement.querySelector('.comment-replies');
    const toggleBtn = event.target.closest('.toggle-replies');
    const toggleText = toggleBtn.querySelector('.toggle-text');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    
    if (repliesContainer.style.display === 'none') {
        // Expand
        repliesContainer.style.display = 'block';
        toggleText.textContent = 'Collapse';
        toggleIcon.textContent = '▲';
    } else {
        // Collapse
        repliesContainer.style.display = 'none';
        toggleText.textContent = 'Expand';
        toggleIcon.textContent = '▼';
    }
};

window.showReplyForm = function(commentId) {
    // Reply form placeholder
    alert(`Reply to comment ${commentId} - feature in development`);
};

window.copyPermalink = function(commentId) {
    const permalink = `https://news.ycombinator.com/item?id=${commentId}`;
    navigator.clipboard.writeText(permalink).then(() => {
        // Show notification
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = '✅ Link copied';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }).catch(() => {
        // Fallback for browsers without clipboard API support
        prompt('Copy link:', permalink);
    });
};