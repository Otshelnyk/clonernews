const API = "https://hacker-news.firebaseio.com/v0";

const $ = (sel) => document.querySelector(sel);
const $$   = (sel) => document.querySelectorAll(sel);

const postsEl = $('#posts');
const loadingEl = $('#loading');
const liveBadge = $('#liveBadge');

let currentType = 'new';
let loadedIds = new Set();
let cache = new Map();

const endpoints = {
  top: '/topstories',
  new: '/newstories',
  best: '/beststories',
  ask: '/askstories',
  show: '/showstories',
  job: '/jobstories'
};

// === Табы ===
  $$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentType = tab.dataset.type;
    loadedIds.clear();
    postsEl.innerHTML = '';
    cache.clear();
    loadMore();
  });
});

// === Утилиты ===
const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HN API error');
  return res.json();
};

const getItem = async (id) => {
  if (cache.has(id)) return cache.get(id);
  const item = await fetchJSON(`${API}/item/${id}.json`);
  cache.set(id, item);
  return item;
};

const timeAgo = (timestamp) => {
  const sec = (Date.now() / 1000) - timestamp;
  if (sec < 60) return `${Math.floor(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
};

// === Рендер поста ===
const renderPost = async (item) => {
  const div = document.createElement('div');
  div.className = 'post';
  div.dataset.id = item.id;

  const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
  let domain = '';
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}

  const title = item.title || '(no title)';
  const typeBadge = item.type === 'job' ? ' [Job]' : item.type === 'poll' ? ' [Poll]' : '';

  div.innerHTML = `
    <div class="post-title">
      <a href="$$ {url}" target="_blank" rel="noopener"> $${title}</a>${typeBadge}
      ${domain ? ` <span style="color:#888;font-size:0.9rem">(${domain})</span>` : ''}
    </div>
    <div class="post-meta">
      ${item.score || 0} points by 
      <a href="https://news.ycombinator.com/user?id=$$ {item.by}"> $${item.by || 'unknown'}</a>
      ${timeAgo(item.time)} |
      <a href="https://news.ycombinator.com/item?id=$$ {item.id}"> $${item.descendants || 0} comments</a>
    </div>
  `;

  // Poll options
  if (item.type === 'poll' && item.kids) {
    const pollDiv = document.createElement('div');
    for (const kid of item.kids.slice(0, 20)) {
      const opt = await getItem(kid);
      if (opt && opt.type === 'pollopt') {
        const el = document.createElement('div');
        el.className = 'poll-option';
        el.innerHTML = `<strong>${opt.text}</strong> — ${opt.score || 0} votes`;
        pollDiv.appendChild(el);
      }
    }
    div.appendChild(pollDiv);
  }

  // Comments toggle
  if (item.kids?.length) {
    const toggle = document.createElement('div');
    toggle.style.cssText = 'margin-top:0.8rem;color:var(--link);cursor:pointer;font-weight:600;';
    toggle.textContent = `Show ${item.kids.length} comments`;
    toggle.onclick = () => loadComments(item.kids, div, toggle);
    div.appendChild(toggle);
  }

  postsEl.appendChild(div);
};

// === Вложенные комментарии ===
const loadComments = async (kids, parentEl, toggleEl) => {
  toggleEl.textContent = 'Loading…';
  const container = document.createElement('div');
  container.className = 'comments';

  // от новых к старым
  const sorted = [...kids].sort((a, b) => b - a);

  for (const id of sorted.slice(0, 100)) {
    const c = await getItem(id);
    if (!c || c.deleted || c.dead) continue;

    const cdiv = document.createElement('div');
    cdiv.className = 'comment';
    cdiv.innerHTML = `
      <div class="by">${c.by || 'unknown'} • ${timeAgo(c.time)}</div>
      <div>${c.text || ''}</div>
    `;

    if (c.kids?.length) {
      const sub = document.createElement('div');
      sub.style.cssText = 'margin-top:0.6rem;color:#888;cursor:pointer;font-size:0.9rem;';
      sub.textContent = `${c.kids.length} replies`;
      sub.onclick = () => loadComments(c.kids, cdiv, sub);
      cdiv.appendChild(sub);
    }

    container.appendChild(cdiv);
  }

  parentEl.appendChild(container);
  toggleEl.textContent = `Hide comments`;
  toggleEl.onclick = () => {
    container.remove();
    toggleEl.textContent = `Show ${kids.length} comments`;
    toggleEl.onclick = () => loadComments(kids, parentEl, toggleEl);
  };
};

// === Бесконечная прокрутка ===
const loadMore = async () => {
  loadingEl.style.display = 'block';

  const ids = await fetchJSON(`${API}${endpoints[currentType]}.json`);
  let added = 0;

  for (const id of ids) {
    if (loadedIds.has(id) || added >= 30) continue;
    const item = await getItem(id);
    if (!item || item.dead || item.deleted) continue;

    renderPost(item);
    loadedIds.add(id);
    added++;
  }

  loadingEl.style.display = added > 0 ? 'block' : 'none';
};

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1200) {
    loadMore();
  }
});

// === Live updates каждые 5 секунд (throttled) ===
setInterval(async () => {
  try {
    const { items = [] } = await fetchJSON(`${API}/updates.json`);
    if (items.some(id => !loadedIds.has(id))) {
      liveBadge.classList.add('show');
      setTimeout(() => liveBadge.classList.remove('show'), 4000);
    }
  } catch (e) { }
}, 5000);