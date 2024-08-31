async function getCSRF() {
    try {
        const response = await fetch('https://www.roblox.com/trades', { method: 'GET' });
        const text = await response.text();
        const tokenMatch = text.match(/<meta name="csrf-token" data-token="([^"]+)"/);
        return tokenMatch ? tokenMatch[1] : null;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        return null;
    }
}

async function storeCSRF() {
    const token = await getCSRF();
    if (token) chrome.storage.local.set({ csrf: token });
}

async function getCookie() {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({ url: 'https://www.roblox.com', name: '.ROBLOSECURITY' }, cookie => {
            cookie ? resolve(cookie.value) : resolve(null);
        });
    });
}

async function storeCookie() {
    const cookie = await getCookie();
    if (cookie) chrome.storage.local.set({ cookie: cookie });
}

chrome.runtime.onInstalled.addListener(() => {
    storeCSRF();
    storeCookie();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url === 'https://www.roblox.com/trades') {
        storeCSRF();
        storeCookie();
    }
});