// Main application file - now modularized
import { fetchPostIds, fetchItem } from './api.js';
import { state, elements, initializeElements } from './state.js';
import { apiCache } from './cache.js';
import { displayPost } from './posts.js';
import { startLiveData, stopLiveData, updateLiveDataBar } from './liveData.js';

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

// Убираем дублирование - элементы уже объявлены выше

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

// displayPost function moved to posts.js module

function getPostIcon(type) {
    const icons = {
        'story': '📰',
        'job': '💼',
        'poll': '📊',
        'comment': '💬',
        'ask': '❓'
    };
    return icons[type] || '📄';
}

function getPostTypeLabel(type) {
    const labels = {
        'story': 'Story',
        'job': 'Job',
        'poll': 'Poll',
        'comment': 'Comment',
        'ask': 'Ask HN'
    };
    return labels[type] || 'Post';
}

function getPostUrl(post) {
    if (post.url) {
        return post.url;
    }
    // Для Ask HN, polls и комментариев используем ссылку на HN
    return `https://news.ycombinator.com/item?id=${post.id}`;
}

function determinePostType(post) {
    // Более детальное определение типа поста
    if (post.type) {
        return post.type;
    }
    
    // Определяем тип по заголовку и контенту
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

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTime(timestamp) {
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

// Throttling функция для ограничения API запросов
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

// Debouncing функция для группировки запросов
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Кэш для API запросов с TTL
class APICache {
    constructor(ttl = 30000) { // 30 секунд TTL
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    clear() {
        this.cache.clear();
    }
}

const apiCache = new APICache();

// Live Data система
function updateLiveDataBar(message) {
    if (liveUpdatesBar) {
        const now = new Date().toLocaleTimeString();
        liveUpdatesBar.innerHTML = `<p>🔄 ${message} | Последнее обновление: ${now}</p>`;
        state.lastUpdateTime = Date.now();
    }
}

async function checkForNewPosts() {
    if (!state.liveDataEnabled) return;
    
    try {
        const newIds = await fetchPostIds(state.currentPostType);
        const oldIds = state.allPostIds.slice(0, 10); // Сравниваем первые 10
        const latestIds = newIds.slice(0, 10);
        
        // Проверяем, есть ли новые посты
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

function showRefreshNotification(newCount) {
    // Создаем уведомление о новых постах
    const notification = document.createElement('div');
    notification.className = 'refresh-notification';
    notification.innerHTML = `
        <span>📢 ${newCount} new posts</span>
        <button onclick="refreshPosts()" class="refresh-btn">Refresh</button>
        <button onclick="dismissNotification(this)" class="dismiss-btn">×</button>
    `;
    
    // Добавляем в начало контейнера
    postsContainer.insertBefore(notification, postsContainer.firstChild);
}

function dismissNotification(btn) {
    btn.parentElement.remove();
}

async function refreshPosts() {
    apiCache.clear();
    await loadPosts();
    // Убираем все уведомления
    document.querySelectorAll('.refresh-notification').forEach(n => n.remove());
}

// Запускаем Live Data систему
let liveDataTimer;

function startLiveData() {
    if (liveDataTimer) clearInterval(liveDataTimer);
    
    liveDataTimer = setInterval(() => {
        throttledCheckForNewPosts();
    }, state.liveUpdateInterval);
    
    updateLiveDataBar('🔄 Live updates active');
}

function stopLiveData() {
    if (liveDataTimer) {
        clearInterval(liveDataTimer);
        liveDataTimer = null;
    }
    updateLiveDataBar('⏸️ Live updates paused');
}

// Throttled версия проверки новых постов
const throttledCheckForNewPosts = throttle(checkForNewPosts, state.throttleDelay);

// Функции для работы с комментариями
async function toggleReplies(commentId) {
    const repliesWrapper = document.querySelector(`[data-parent-id="${commentId}"]`);
    const toggleBtn = event.target.closest('.toggle-replies');
    const toggleText = toggleBtn.querySelector('.toggle-text');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    
    if (repliesWrapper.classList.contains('collapsed')) {
        // Разворачиваем
        repliesWrapper.classList.remove('collapsed');
        repliesWrapper.classList.add('expanded');
        toggleText.textContent = 'Collapse';
        toggleIcon.textContent = '▲';
        
        // Lazy load comments if not already loaded
        if (repliesWrapper.children.length === 0) {
            const commentElement = repliesWrapper.closest('.comment-item');
            const commentId = commentElement.getAttribute('data-comment-id');
            const comment = apiCache.get(`comment_${commentId}`);
            
            if (comment && comment.kids) {
                const depth = parseInt(commentElement.className.match(/depth-(\d+)/)?.[1] || 0);
                await renderComments(comment.kids, repliesWrapper, depth + 1);
            }
        }
    } else {
        // Collapse
        repliesWrapper.classList.remove('expanded');
        repliesWrapper.classList.add('collapsed');
        toggleText.textContent = 'Expand';
        toggleIcon.textContent = '▼';
    }
}

function showReplyForm(commentId) {
    // Reply form placeholder
    alert(`Reply to comment ${commentId} - feature in development`);
}

function copyPermalink(commentId) {
    const permalink = `https://news.ycombinator.com/item?id=${commentId}`;
    navigator.clipboard.writeText(permalink).then(() => {
        // Показываем уведомление
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = '✅ Link copied';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }).catch(() => {
        // Fallback for browsers without clipboard API support
        prompt('Copy link:', permalink);
    });
}

let intersectionObserver;

function setupIntersectionObserver() {
    intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[0]; 

        if (entry.isIntersecting && state.postsLoadedCount > 0 && state.postsLoadedCount < state.allPostIds.length) {
            console.log("Loading indicator visible. Triggering next batch.");
            intersectionObserver.unobserve(loadingIndicator);
            loadNextBatch();
        }
    }, {
        threshold: 0.1
    });
}

async function renderComments(commentIds, parentContainer, depth = 0) {
    if (commentIds.length === 0) return;
    
    const repliesContainer = document.createElement('div');
    repliesContainer.className = `comment-replies depth-${depth}`;
    parentContainer.appendChild(repliesContainer);

    // Загружаем комментарии с кэшированием
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
    
    // Сортируем комментарии по времени (новые сначала)
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
                        <span class="toggle-text">Expand</span> <span class="toggle-icon">▼</span>
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
        
        // Рекурсивно загружаем вложенные комментарии, но ограничиваем глубину
        if (hasReplies && depth < 5) {
            const repliesWrapper = document.createElement('div');
            repliesWrapper.className = 'replies-wrapper collapsed';
            repliesWrapper.setAttribute('data-parent-id', comment.id);
            commentElement.appendChild(repliesWrapper);
            
            // Ленивая загрузка - загружаем только при разворачивании
            if (depth < 2) { // Автоматически загружаем только первые 2 уровня
                await renderComments(comment.kids, repliesWrapper, depth + 1);
            }
        }
    }
}


async function loadItemDetails(id) {
    commentsContainer.innerHTML = 'Loading...';
    detailHeader.innerHTML = '';
    pollOptionsContainer.innerHTML = '';
    commentCountSpan.textContent = '...';

    modalBackdrop.style.display = 'flex';
    state.isModalOpen = true;

    let post;
    try {
        post = await fetchItem(id);

        if (!post || post.dead || post.deleted) {
            detailHeader.innerHTML = '<h2>Post unavailable</h2>';
            commentsContainer.innerHTML = '<p>This post has been deleted or not found.</p>';
            return;
        }
    } catch (error) {
        console.error('Error loading item details:', error);
        detailHeader.innerHTML = '<h2>Error loading</h2>';
        commentsContainer.innerHTML = '<p>An error occurred while loading post details.</p>';
        return;
    }

    // Определяем тип поста и соответствующую иконку
    const postType = determinePostType(post);
    const postIcon = getPostIcon(postType);
    const postUrl = getPostUrl(post);

    detailHeader.innerHTML = `
        <div class="modal-post-header">
            <span class="post-type-icon">${postIcon}</span>
            <span class="post-type-label">${getPostTypeLabel(postType)}</span>
        </div>
        <h2>
            <a href="${postUrl}" target="_blank" rel="noopener noreferrer">
                ${post.title || '[No Title]'}
            </a>
        </h2>
        <p class="modal-post-meta">
            by <span class="post-author">${escapeHtml(post.by || 'n/a')}</span> 
            | Score: <strong>${post.score || 0}</strong>
            ${post.time ? `| ${formatTime(post.time)}` : ''}
        </p>
        ${post.text ? `<div class="modal-post-text">${post.text}</div>` : ''}
    `;

    // Handle polls
    if (post.type === 'poll' && post.parts) {
        pollOptionsContainer.innerHTML = `<h3>Poll Options</h3>`;

        const pollOptions = await Promise.all(post.parts.map(optId => fetchItem(optId)));

        pollOptions.forEach(option => {
            if (option && option.text) {
                pollOptionsContainer.innerHTML += `
                    <div class="poll-option-item">
                        <p class="comment-text">${option.text} <strong>(${option.score || 0} votes)</strong></p>
                    </div>
                `;
            }
        });
    }

    // Handle comments
    const commentCount = post.kids ? post.kids.length : 0;
    commentCountSpan.textContent = commentCount;
    commentsContainer.innerHTML = ''; 

    if (commentCount > 0) {
        await renderComments(post.kids, commentsContainer);
    } else {
        commentsContainer.innerHTML = '<p>No comments.</p>';
    }

    // If this is a comment, show its parent
    if (post.type === 'comment' && post.parent) {
        const parentPost = await fetchItem(post.parent);
        if (parentPost) {
            detailHeader.innerHTML += `
                <div class="parent-post-info">
                    <p><strong>In reply to:</strong> 
                        <a href="#" onclick="loadItemDetails(${post.parent}); return false;">
                            ${parentPost.title || `Comment #${parentPost.id}`}
                        </a>
                    </p>
                </div>
            `;
        }
    }
}




function closeModal() {
    modalBackdrop.style.display = 'none';
    state.isModalOpen = false;
    commentsContainer.innerHTML = '';
    detailHeader.innerHTML = '';
    pollOptionsContainer.innerHTML = '';
    commentCountSpan.textContent = '0';
}


function initializeApp() {
    console.log("App initialized.");
    
    // События навигации
    postTypeNav.addEventListener('click', handleNavClick);
    
    // События модального окна
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                closeModal();
            }
        });
    }
    
    // Добавляем контроль Live Data
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
    
    if (liveUpdatesBar) {
        liveUpdatesBar.appendChild(liveToggle);
    }
    
    // События для Intersection Observer
    setupIntersectionObserver();
    
    // События для управления окном (паузим Live Data когда окно неактивно)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopLiveData();
        } else if (state.liveDataEnabled) {
            startLiveData();
        }
    });
    
    // Загружаем первоначальные данные
    loadPosts();
    
    // Запускаем Live Data систему
    if (state.liveDataEnabled) {
        startLiveData();
    }
}

initializeApp();