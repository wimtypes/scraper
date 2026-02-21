/**
 * dashboard/app.js
 * Handles fetching from server, filtering, searching, and localStorage saving.
 */

// State
let articles = [];
let savedArticleIds = new Set();
let currentFilter = 'all'; // 'all', 'bens_bites', 'the_rundown_ai'
let currentSearch = '';

// DOM Elements
const els = {
    lastUpdated: document.getElementById('lastUpdated'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnSavedView: document.getElementById('btnSavedView'),
    savedCount: document.getElementById('savedCount'),

    statTotalNum: document.getElementById('statTotalNum'),
    statBensNum: document.getElementById('statBensNum'),
    statRundownNum: document.getElementById('statRundownNum'),
    statSavedNum: document.getElementById('statSavedNum'),

    tabs: document.querySelectorAll('.filter-tab'),
    searchInput: document.getElementById('searchInput'),

    articlesGrid: document.getElementById('articlesGrid'),
    template: document.getElementById('articleTemplate'),

    stateLoading: document.getElementById('stateLoading'),
    stateError: document.getElementById('stateError'),
    stateEmpty: document.getElementById('stateEmpty'),
    stateNoResults: document.getElementById('stateNoResults'),
    errorMsg: document.getElementById('stateErrorMsg'),
    btnRetry: document.getElementById('btnRetry'),

    toast: document.getElementById('toast'),
};

// Initialize
function init() {
    loadSavedState();

    // Event Listeners
    els.btnRefresh.addEventListener('click', () => fetchArticles(true));
    els.btnRetry.addEventListener('click', () => fetchArticles(true));

    els.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Toggle saved view off when switching tabs
            els.btnSavedView.classList.remove('active');

            els.tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.dataset.filter;
            renderArticles();
        });
    });

    els.searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderArticles();
    });

    els.btnSavedView.addEventListener('click', () => {
        const isActive = els.btnSavedView.classList.toggle('active');
        if (isActive) {
            els.tabs.forEach(t => t.classList.remove('active'));
            els.searchInput.value = '';
            currentSearch = '';
        } else {
            // Re-activate 'all' tab
            document.getElementById('tab-all').classList.add('active');
            currentFilter = 'all';
        }
        renderArticles();
    });

    // Initial fetch
    fetchArticles(false);
}

// Local Storage
function loadSavedState() {
    const saved = localStorage.getItem('ai_pulse_saved_ids');
    if (saved) {
        savedArticleIds = new Set(JSON.parse(saved));
    }
    updateSavedCount();
}

function saveState() {
    localStorage.setItem('ai_pulse_saved_ids', JSON.stringify([...savedArticleIds]));
}

function toggleSave(id) {
    if (savedArticleIds.has(id)) {
        savedArticleIds.delete(id);
        showToast('Article removed from saved');
    } else {
        savedArticleIds.add(id);
        showToast('Article saved');
    }
    saveState();
    updateSavedCount();
    renderArticles();
}

function updateSavedCount() {
    const count = savedArticleIds.size;
    els.savedCount.textContent = count;
    els.statSavedNum.textContent = count;
}

// Fetch Logic
async function fetchArticles(force = false) {
    showState('loading');
    els.btnRefresh.classList.add('spinning');
    els.btnRefresh.disabled = true;

    const endpoint = force ? '/api/refresh' : '/api/articles';
    const options = force ? { method: 'POST' } : { method: 'GET' };

    try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        articles = data.articles || [];

        // Check if we need to remove saved ids that don't exist in fetched?
        // Actually, local storage should persist even if article isn't in 24h feed,
        // but we only display what we fetched + what is saved (if we cache whole objects).
        // For MVP: if it's not in the 24h fetch, we don't display it, even if saved. 
        // Wait, the spec says "If I refresh, all my saved articles should be there".
        // We should probably save the entire article object in local storage.
        syncSavedArticlesWithStorage(articles);

        els.lastUpdated.textContent = 'Updated ' + new Date(data.scraped_at).toLocaleTimeString();

        updateStats();
        renderArticles();
    } catch (err) {
        console.error(err);
        els.errorMsg.textContent = err.message;
        showState('error');
    } finally {
        els.btnRefresh.classList.remove('spinning');
        els.btnRefresh.disabled = false;
    }
}

// Save Full Article Objects locally so they never disappear
function syncSavedArticlesWithStorage(fetchedArticles) {
    let savedArticlesList = [];
    try {
        const stored = localStorage.getItem('ai_pulse_saved_articles');
        if (stored) savedArticlesList = JSON.parse(stored);
    } catch (e) { }

    const savedMap = new Map();
    savedArticlesList.forEach(a => savedMap.set(a.id, a));

    // Add newly fetched articles to map if they are saved
    fetchedArticles.forEach(a => {
        if (savedArticleIds.has(a.id)) {
            savedMap.set(a.id, a);
        }
    });

    // Only keep ones that are still in savedArticleIds
    const finalSavedList = [];
    for (const id of savedArticleIds) {
        if (savedMap.has(id)) {
            finalSavedList.push(savedMap.get(id));
        }
    }

    localStorage.setItem('ai_pulse_saved_articles', JSON.stringify(finalSavedList));

    // Merge full list for rendering
    const fetchedIds = new Set(fetchedArticles.map(a => a.id));
    finalSavedList.forEach(sa => {
        if (!fetchedIds.has(sa.id)) {
            articles.push(sa);
        }
    });
}

// Render
function updateStats() {
    els.statTotalNum.textContent = articles.length;
    els.statBensNum.textContent = articles.filter(a => a.source === 'bens_bites').length;
    els.statRundownNum.textContent = articles.filter(a => a.source === 'the_rundown_ai').length;
}

function formatRelativeTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now - d) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hr ago';
    if (diffHours < 24) return `${diffHours} hrs ago`;
    return d.toLocaleDateString();
}

function renderArticles() {
    els.articlesGrid.innerHTML = '';

    const isSavedView = els.btnSavedView.classList.contains('active');

    let filtered = articles;

    if (isSavedView) {
        filtered = filtered.filter(a => savedArticleIds.has(a.id));
    } else {
        if (currentFilter !== 'all') {
            filtered = filtered.filter(a => a.source === currentFilter);
        }
    }

    if (currentSearch) {
        filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(currentSearch) ||
            a.summary.toLowerCase().includes(currentSearch)
        );
    }

    // Sort by published descending
    filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    if (filtered.length === 0) {
        if (articles.length === 0) {
            showState('empty');
        } else {
            showState('no_results');
        }
        return;
    }

    showState('results');

    filtered.forEach(article => {
        const node = els.template.content.cloneNode(true);
        const card = node.querySelector('.article-card');

        node.querySelector('.source-emoji').textContent = article.source_emoji || '📰';
        node.querySelector('.source-name').textContent = article.source_label;

        // Color dot on card edge based on source
        card.style.borderLeft = `4px solid ${article.source_color || '#BFF549'}`;

        node.querySelector('.card-title').textContent = article.title;
        node.querySelector('.card-summary').textContent = article.summary || 'No summary available.';
        node.querySelector('.card-time').textContent = formatRelativeTime(article.published_at);
        node.querySelector('.card-link').href = article.url;

        const saveBtn = node.querySelector('.save-btn');
        if (savedArticleIds.has(article.id)) {
            saveBtn.classList.add('saved');
        }
        saveBtn.addEventListener('click', () => toggleSave(article.id));

        els.articlesGrid.appendChild(node);
    });
}

function showState(state) {
    els.stateLoading.classList.add('hidden');
    els.stateError.classList.add('hidden');
    els.stateEmpty.classList.add('hidden');
    els.stateNoResults.classList.add('hidden');
    els.articlesGrid.style.display = 'none';

    if (state === 'loading') els.stateLoading.classList.remove('hidden');
    if (state === 'error') els.stateError.classList.remove('hidden');
    if (state === 'empty') els.stateEmpty.classList.remove('hidden');
    if (state === 'no_results') els.stateNoResults.classList.remove('hidden');
    if (state === 'results') {
        els.articlesGrid.style.display = 'grid';
    }
}

// Toast Notification
let toastTimeout;
function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
}

// Start
document.addEventListener('DOMContentLoaded', init);
