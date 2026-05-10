// API Configuration
const QUOTE_API_URL = 'https://api.quotable.io/random';

// DOM Elements
const loadingEl = document.getElementById('loading');
const quoteContainerEl = document.getElementById('quote-container');
const quoteContentEl = document.getElementById('quote-content');
const quoteAuthorEl = document.getElementById('quote-author');
const errorMessageEl = document.getElementById('error-message');
const errorTextEl = document.getElementById('error-text');
const newQuoteBtnEl = document.getElementById('new-quote-btn');
const copyBtnEl = document.getElementById('copy-btn');
const quoteCountEl = document.getElementById('quote-count');

// State
let currentQuote = null;
let quotesCount = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
});

/**
 * Fetch a random quote from the API
 */
async function fetchQuote() {
    try {
        // Show loading state
        showLoadingState();

        // Disable buttons during fetch
        disableButtons(true);

        // Fetch quote from API
        const response = await fetch(QUOTE_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Handle response status
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        // Parse JSON
        const data = await response.json();

        // Validate data
        if (!data.content || !data.author) {
            throw new Error('Invalid data format from API');
        }

        // Update current quote
        currentQuote = {
            content: data.content,
            author: data.author.replace(', type.fit', '')
        };

        // Increment counter
        quotesCount++;
        updateQuoteCount();

        // Display quote
        displayQuote();

        // Hide error state if shown
        hideErrorState();

    } catch (error) {
        console.error('[v0] Error fetching quote:', error.message);
        showErrorState(error.message);
    } finally {
        // Re-enable buttons
        disableButtons(false);
    }
}

/**
 * Load initial quote (alias for fetchQuote)
 */
function loadQuotes() {
    fetchQuote();
}

/**
 * Display the current quote
 */
function displayQuote() {
    if (!currentQuote) return;

    // Hide loading state
    hideLoadingState();

    // Update DOM with quote content
    quoteContentEl.textContent = currentQuote.content;
    quoteAuthorEl.textContent = currentQuote.author;

    // Show quote container
    showQuoteContainer();

    // Scroll into view on mobile
    if (window.innerWidth < 768) {
        quoteContainerEl.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Copy current quote to clipboard
 */
function copyToClipboard() {
    if (!currentQuote) {
        showNotification('No quote to copy', 'error');
        return;
    }

    const textToCopy = `"${currentQuote.content}" — ${currentQuote.author}`;

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showNotification('Quote copied to clipboard!', 'success');
            console.log('[v0] Quote copied successfully');
        })
        .catch((error) => {
            console.error('[v0] Failed to copy quote:', error);
            showNotification('Failed to copy quote', 'error');
        });
}

/**
 * Show loading state UI
 */
function showLoadingState() {
    loadingEl.classList.remove('hidden');
    quoteContainerEl.classList.add('hidden');
    errorMessageEl.classList.add('hidden');
}

/**
 * Hide loading state UI
 */
function hideLoadingState() {
    loadingEl.classList.add('hidden');
}

/**
 * Show quote container
 */
function showQuoteContainer() {
    quoteContainerEl.classList.remove('hidden');
}

/**
 * Show error state UI
 */
function showErrorState(errorMessage) {
    console.log('[v0] Showing error state with message:', errorMessage);

    quoteContainerEl.classList.add('hidden');
    loadingEl.classList.add('hidden');
    errorMessageEl.classList.remove('hidden');

    const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
    errorTextEl.textContent = userFriendlyMessage;
}

/**
 * Hide error state UI
 */
function hideErrorState() {
    errorMessageEl.classList.add('hidden');
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyErrorMessage(error) {
    if (error.includes('Failed to fetch')) {
        return 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.includes('API Error: 500')) {
        return 'Server error. Please try again later.';
    } else if (error.includes('API Error: 404')) {
        return 'Quote not found. Please try again.';
    } else if (error.includes('Invalid data format')) {
        return 'Invalid data received from server. Please try again.';
    }
    return `Error: ${error}`;
}

/**
 * Update quote counter display
 */
function updateQuoteCount() {
    quoteCountEl.textContent = quotesCount;
}

/**
 * Disable or enable buttons
 */
function disableButtons(disabled) {
    newQuoteBtnEl.disabled = disabled;
    copyBtnEl.disabled = disabled;
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `copy-notification`;
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#10b981' : '#ef4444';

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Handle Enter key for Get New Quote button
 */
newQuoteBtnEl.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        fetchQuote();
    }
});

console.log('[v0] API Integration app loaded successfully');