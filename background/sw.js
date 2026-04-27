// Service Worker - ResellKit Pro

// ========================
// INIT
// ========================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ResellKit] Extension installed');
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'popup/onboarding.html' });
  }
});

// ========================
// STORAGE
// ========================

const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: true,
  rolandGarrosMode: false,
  autoCapture: true
};

async function initStorage() {
  const { rkSettings } = await chrome.storage.local.get(['rkSettings']);
  if (!rkSettings) {
    await chrome.storage.local.set({ rkSettings: DEFAULT_SETTINGS });
  }
}

async function createMenus() {
  chrome.contextMenus.create({
    id: 'rk-add-item',
    title: 'Add to ResellKit',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'rk-quick-add',
    title: 'Quick Add Item',
    contexts: ['selection']
  });
}

async function setupAlarms() {
  // Daily sync
  chrome.alarms.create('rk-daily-sync', { periodInMinutes: 1440 });
}

// ========================
// CONTEXT MENUS
// ========================

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'rk-add-item') {
    chrome.tabs.sendMessage(tab.id, { action: 'openQuickAdd' });
  }
  if (info.menuItemId === 'rk-quick-add') {
    const text = info.selectionText;
    chrome.storage.local.get(['rkItems'], (result) => {
      const items = result.rkItems || [];
      items.unshift({
        id: Date.now().toString(36),
        name: text,
        type: 'article',
        createdAt: new Date().toISOString()
      });
      chrome.storage.local.set({ rkItems: items });
    });
  }
});

// ========================
// ALARMS
// ========================

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'rk-daily-sync') {
    console.log('[ResellKit] Daily sync');
  }
});

// ========================
// MESSAGING
// ========================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getData') {
    chrome.storage.local.get(['rkItems'], (result) => {
      sendResponse({ data: result.rkItems || [] });
    });
    return true;
  }
  if (request.action === 'saveData') {
    chrome.storage.local.set({ rkItems: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// ========================
// STARTUP
// ========================

initStorage();
setupAlarms();
