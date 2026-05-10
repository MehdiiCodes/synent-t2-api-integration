/* ============================================
   ADVANCED QUOTES APP - FIXED VERSION
   ============================================ */

// Constants
const QUOTE_API_URL = 'https://api.quotable.io/random';
const API_TIMEOUT = 8000;
const HISTORY_LIMIT = 20;
const SESSION_UPDATE_INTERVAL = 1000;

// Demo quotes for fallback
const DEMO_QUOTES = [
    {
        id: 1,
        content: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        category: "Inspiration"
    },
    {
        id: 2,
        content: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs",
        category: "Leadership"
    },
    {
        id: 3,
        content: "Life is what happens when you're busy making other plans.",
        author: "John Lennon",
        category: "Life"
    },
    {
        id: 4,
        content: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        category: "Motivation"
    },
    {
        id: 5,
        content: "It is during our darkest moments that we must focus to see the light.",
        author: "Aristotle",
        category: "Wisdom"
    }
];

// State Management
const state = {
    currentQuote: null,
    quotes: [],
    favorites: [],
    history: [],
    quoteCount: 0,
    sessionStartTime: Date.now(),
    sessionQuoteCount: 0,
    showingFavorites: false,
    darkMode: localStorage.getItem('darkMode') === 'true',
    isLoadingFromAPI: false,
};

// DOM Elements
const elements = {
    loadingState: document.getElementById('loading-state'),
    quoteCard: document.getElementById('quote-card'),
    errorState: document.getElementById('error-state'),
    emptyState: document.getElementById('empty-state'),
    quoteContent: document.getElementById('quote-content'),
    quoteAuthor: document.getElementById('quote-author'),
    quoteNumber: document.getElementById('quote-number'),
    favoriteBtn: document.getElementById('favorite-btn'),
    notification: document.getElementById('notification'),
    totalQuotes: document.getElementById('total-quotes'),
    favoritesCount: document.getElementById('favorites-count'),
    sessionTime: document.getElementById('session-time'),
    sessionQuotes: document.getElementById('session-quotes'),
    favoritesSection: document.getElementById('favorites-section'),
    favoritesGrid: document.getElementById('favorites-grid'),
    historyCar: document.getElementById('history-carousel'),
    searchInput: document.getElementById('search-input'),
    errorTitle: document.getElementById('error-title'),
    errorMessage: document.getElementById('error-message'),
    nextBtn: document.getElementById('next-btn'),
    prevBtn: document.getElementById('prev-btn'),
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[v0] App initializing...');
    
    loadSavedData();
    
    if (state.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    startSessionTimer();
    setupEventListeners();
    fetchQuote();
    
    console.log('[v0] App initialized successfully');
});

function setupEventListeners() {
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// ============================================
// QUOTE FETCHING WITH TIMEOUT & ERROR HANDLING
// ============================================

function fetchQuoteWithTimeout(url, timeout = API_TIMEOUT) {
    return Promise.race([
        fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API request timeout')), timeout)
        )
    ]);
}

async function fetchQuote() {
    try {
        showLoadingState();
        hideErrorState();
        hideEmptyState();

        state.isLoadingFromAPI = true;

        const response = await fetchQuoteWithTimeout(QUOTE_API_URL);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.content || !data.author) {
            throw new Error('Invalid API response format');
        }

        const quote = {
            id: Date.now(),
            content: data.content,
            author: data.author.replace(', type.fit', ''),
            category: data.tags && data.tags[0] ? data.tags[0] : 'Inspirational',
            timestamp: new Date(),
            source: 'api'
        };

        state.currentQuote = quote;
        state.quotes.push(quote);
        state.quoteCount++;
        state.sessionQuoteCount++;

        addToHistory(quote);
        displayQuote(quote);
        updateStats();
        state.isLoadingFromAPI = false;

    } catch (error) {
        console.error('[v0] Fetch error:', error.message);
        state.isLoadingFromAPI = false;
        
        if (state.history.length > 0) {
            showErrorState(`Could not reach server: ${error.message}`);
        } else {
            showErrorState(`Network error: ${error.message}`);
        }
    }
}

function loadDemoQuote() {
    const randomDemo = DEMO_QUOTES[Math.floor(Math.random() * DEMO_QUOTES.length)];
    
    const quote = {
        ...randomDemo,
        id: Date.now(),
        timestamp: new Date(),
        source: 'demo'
    };

    state.currentQuote = quote;
    state.quotes.push(quote);
    state.quoteCount++;
    state.sessionQuoteCount++;

    addToHistory(quote);
    displayQuote(quote);
    updateStats();

    showNotification('Loaded demo quote', 'success');
}

function displayQuote(quote) {
    hideLoadingState();
    showQuoteCard();

    elements.quoteContent.textContent = quote.content;
    elements.quoteAuthor.textContent = quote.author;
    elements.quoteNumber.textContent = state.quoteCount;

    const isFavorite = state.favorites.some(fav => fav.id === quote.id);
    updateFavoriteButton(isFavorite);

    saveCurrentState();
}

function showLoadingState() {
    elements.loadingState.classList.remove('hidden');
    elements.quoteCard.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
}

function hideLoadingState() {
    elements.loadingState.classList.add('hidden');
}

function showQuoteCard() {
    elements.quoteCard.classList.remove('hidden');
}

function showErrorState(message) {
    elements.loadingState.classList.add('hidden');
    elements.quoteCard.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.errorState.classList.remove('hidden');
    elements.errorMessage.textContent = message || 'Failed to fetch quote. Please try again.';
}

function hideErrorState() {
    elements.errorState.classList.add('hidden');
}

function showEmptyState() {
    elements.loadingState.classList.add('hidden');
    elements.quoteCard.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
}

function hideEmptyState() {
    elements.emptyState.classList.add('hidden');
}

// ============================================
// FAVORITES
// ============================================

function toggleFavorite() {
    if (!state.currentQuote) return;

    const isFavorite = state.favorites.some(fav => fav.id === state.currentQuote.id);

    if (isFavorite) {
        state.favorites = state.favorites.filter(fav => fav.id !== state.currentQuote.id);
        updateFavoriteButton(false);
        showNotification('Removed from favorites', 'success');
    } else {
        state.favorites.push(state.currentQuote);
        updateFavoriteButton(true);
        showNotification('Added to favorites!', 'success');
    }

    updateStats();
    saveCurrentState();
}

function updateFavoriteButton(isFavorite) {
    elements.favoriteBtn.textContent = isFavorite ? '❤️' : '🤍';
    if (isFavorite) {
        elements.favoriteBtn.classList.add('active');
    } else {
        elements.favoriteBtn.classList.remove('active');
    }
}

function toggleFavorites() {
    state.showingFavorites = !state.showingFavorites;

    if (state.showingFavorites) {
        renderFavorites();
        elements.favoritesSection.classList.remove('hidden');
        elements.nextBtn.disabled = true;
        elements.prevBtn.disabled = true;
        showNotification(`${state.favorites.length} favorite quotes`, 'success');
    } else {
        elements.favoritesSection.classList.add('hidden');
        elements.nextBtn.disabled = false;
        elements.prevBtn.disabled = false;
    }
}

function renderFavorites() {
    if (state.favorites.length === 0) {
        elements.favoritesGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">No favorites yet!</p>';
        return;
    }

    elements.favoritesGrid.innerHTML = state.favorites.map(quote => `
        <div class="favorite-card">
            <p>"${quote.content}"</p>
            <p class="favorite-card-author">— ${quote.author}</p>
            <button class="favorite-card-remove" onclick="removeFavorite(${quote.id})">
                Remove
            </button>
        </div>
    `).join('');
}

function removeFavorite(quoteId) {
    state.favorites = state.favorites.filter(fav => fav.id !== quoteId);
    updateStats();
    renderFavorites();
    saveCurrentState();
    showNotification('Removed from favorites', 'success');
}

// ============================================
// HISTORY
// ============================================

function addToHistory(quote) {
    state.history.unshift(quote);
    if (state.history.length > HISTORY_LIMIT) {
        state.history.pop();
    }
    renderHistory();
}

function renderHistory() {
    if (state.history.length === 0) {
        elements.historyCar.innerHTML = '<p style="color: var(--text-secondary);">No history yet</p>';
        return;
    }

    elements.historyCar.innerHTML = state.history.map(quote => `
        <div class="history-item" onclick="selectHistoryQuote(${quote.id})">
            <p class="history-item-text">"${quote.content}"</p>
            <p class="history-item-author">${quote.author}</p>
        </div>
    `).join('');
}

function selectHistoryQuote(quoteId) {
    const quote = state.quotes.find(q => q.id === quoteId);
    if (quote) {
        state.currentQuote = quote;
        displayQuote(quote);
        showNotification('Quote loaded from history', 'success');
    }
}

function previousQuote() {
    if (state.history.length > 1) {
        const previousQuote = state.history[1];
        state.currentQuote = previousQuote;
        displayQuote(previousQuote);
    }
}

// ============================================
// CLIPBOARD & SHARING
// ============================================

function copyToClipboard() {
    if (!state.currentQuote) return;

    const text = `"${state.currentQuote.content}" — ${state.currentQuote.author}`;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showNotification('Quote copied to clipboard!', 'success');
        })
        .catch(error => {
            console.error('[v0] Copy failed:', error);
            showNotification('Failed to copy quote', 'error');
        });
}

function shareQuote(platform) {
    if (!state.currentQuote) return;

    const text = `"${state.currentQuote.content}" — ${state.currentQuote.author}`;
    const encodedText = encodeURIComponent(text);
    const url = window.location.href;

    let shareUrl = '';

    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedText}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodedText}`;
            break;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        showNotification(`Shared on ${platform}!`, 'success');
    }
}

// ============================================
// SEARCH & FILTER
// ============================================

function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        fetchQuote();
        return;
    }

    const filtered = state.quotes.filter(quote => 
        quote.content.toLowerCase().includes(searchTerm) ||
        quote.author.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        showEmptyState();
        return;
    }

    const randomResult = filtered[Math.floor(Math.random() * filtered.length)];
    state.currentQuote = randomResult;
    displayQuote(randomResult);
    showNotification(`Found ${filtered.length} matching quote(s)`, 'success');
}

function clearSearch() {
    elements.searchInput.value = '';
    fetchQuote();
}

// ============================================
// DARK MODE
// ============================================

function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', state.darkMode);
    showNotification(state.darkMode ? 'Dark mode ON' : 'Dark mode OFF', 'success');
    saveCurrentState();
}

// ============================================
// STATS & SESSION
// ============================================

function startSessionTimer() {
    setInterval(() => {
        const elapsed = Date.now() - state.sessionStartTime;
        const seconds = Math.floor((elapsed / 1000) % 60);
        const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
        const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);

        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        elements.sessionTime.textContent = timeString;
    }, SESSION_UPDATE_INTERVAL);
}

function updateStats() {
    elements.totalQuotes.textContent = state.quoteCount;
    elements.favoritesCount.textContent = state.favorites.length;
    elements.sessionQuotes.textContent = state.sessionQuoteCount;
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;

    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 3000);
}

// ============================================
// DATA PERSISTENCE
// ============================================

function saveCurrentState() {
    const dataToSave = {
        favorites: state.favorites,
        history: state.history,
        quoteCount: state.quoteCount,
        darkMode: state.darkMode,
        sessionStartTime: state.sessionStartTime
    };

    localStorage.setItem('quoteAppState', JSON.stringify(dataToSave));
}

function loadSavedData() {
    const saved = localStorage.getItem('quoteAppState');
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.favorites = data.favorites || [];
            state.history = data.history || [];
            state.quoteCount = data.quoteCount || 0;
            state.sessionStartTime = data.sessionStartTime || Date.now();
        } catch (error) {
            console.error('[v0] Load error:', error);
        }
    }

    updateStats();
    renderHistory();
}

console.log('[v0] Advanced Quotes App Loaded Successfully');