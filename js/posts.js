// Post rendering and display logic
import { state, elements } from './state.js';
import { escapeHtml, formatTime, getPostIcon, getPostTypeLabel, getPostUrl, determinePostType } from './utils.js';
import { renderComments } from './comments.js';

export function displayPost(post) {
    if (elements.postsContainer.innerHTML === '<h2>Loading content...</h2>') {
        elements.postsContainer.innerHTML = '';
    }

    // Determine post type with improved detection
    const postType = determinePostType(post);
    const domain = post.url ? new URL(post.url).hostname.replace('www.', '') : '';
    
    const postElement = document.createElement('article');
    postElement.className = `simple-post post-${postType}`;
    
    // Determine icon for post type
    const postIcon = getPostIcon(postType);
    
    // Determine URL for post  
    const postUrl = getPostUrl(post);
    
    // Calculate comment count properly
    const commentCount = post.kids ? post.kids.length : 0;
    
    postElement.innerHTML = `
        <div class="score-container">
            <span class="score-value">${post.score || 0}</span>
            <span class="score-label">points</span>
        </div>
        <div class="post-content">
            <div class="post-header">
                <span class="post-type-icon">${postIcon}</span>
                <span class="post-type-label">${getPostTypeLabel(postType)}</span>
            </div>
            <div class="post-title">
                <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="post-title-link">
                    ${post.title || '[No Title]'}
                </a>
                ${domain ? `<span class="domain">(${domain})</span>` : ''}
            </div>
            <div class="post-meta">
                <span>by <span class="post-author">${escapeHtml(post.by || 'n/a')}</span></span>
                ${post.time ? `<span>${formatTime(post.time)}</span>` : ''}
                <span>${commentCount} comments</span>
                ${post.type === 'poll' && post.parts ? `<span>${post.parts.length} options</span>` : ''}
            </div>
            ${post.text ? `<div class="post-text">${post.text}</div>` : ''}
        </div>
    `;
    
    // Add click handler to redirect to Hacker News
    postElement.addEventListener('click', (e) => {
        // Don't trigger for link clicks
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            return;
        }
        e.preventDefault();
        window.open(`https://news.ycombinator.com/item?id=${post.id}`, '_blank');
    });
    
    elements.postsContainer.appendChild(postElement);
    
    // Add comments section if there are comments
    if (commentCount > 0) {
        const commentsSection = document.createElement('div');
        commentsSection.className = 'post-comments-section';
        commentsSection.innerHTML = `
            <div class="comments-header">
                <h3>Comments (${commentCount})</h3>
            </div>
            <div class="comments-container" id="comments-${post.id}">
                <div class="loading-comments">Loading comments...</div>
            </div>
        `;
        
        postElement.appendChild(commentsSection);
        
        // Load comments immediately
        loadPostComments(post.id, post.kids, commentsSection.querySelector('.comments-container'));
    }
    
    console.log(`Displayed ${postType}: ${post.title || post.id}`);
}

async function loadPostComments(postId, commentIds, container) {
    try {
        container.innerHTML = '<div class="loading-comments">Loading comments...</div>';
        await renderComments(commentIds, container);
        // Remove loading indicator
        const loadingDiv = container.querySelector('.loading-comments');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    } catch (error) {
        console.error('Error loading comments for post', postId, error);
        container.innerHTML = '<div class="error-comments">Error loading comments</div>';
    }
}