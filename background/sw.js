// Service Worker - ResellKit Pro
'use strict';

// ========================
// INIT
// ========================

chrome.runtime.onInstalled.addListener((details) => {
  try {
    console.log('[ResellKit] Extension installed - v2.2.0');
    // Don't open onboarding page - just init storage
    initStorage().catch(err => console.error('[ResellKit] Init error:', err));
  } catch (err) {
    console.error('[ResellKit] onInstalled error:', err);
  }
});

// ========================
// STORAGE
// ========================

const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: true,
  rolandGarrosMode: false,
  autoCapture: true,
  createdAt: new Date().toISOString()
};

async function initStorage() {
  try {
    const { rkSettings, rkItems } = await chrome.storage.local.get(['rkSettings', 'rkItems']);
    if (!rkSettings) {
      await chrome.storage.local.set({ rkSettings: DEFAULT_SETTINGS });
      console.log('[ResellKit] Settings initialized');
    }
    if (!rkItems) {
      await chrome.storage.local.set({ rkItems: [] });
      console.log('[ResellKit] Items initialized');
    }
  } catch (err) {
    console.error('[ResellKit] Storage init failed:', err);
  }
}

// ========================
// ALARMS
// ========================

async function setupAlarms() {
  try {
    // Daily sync alarm
    chrome.alarms.create('rk-daily-sync', { periodInMinutes: 1440 });
    console.log('[ResellKit] Alarms setup');
  } catch (err) {
    console.error('[ResellKit] Alarms setup failed:', err);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  try {
    if (alarm.name === 'rk-daily-sync') {
      console.log('[ResellKit] Daily sync triggered');
      // Perform sync operations here
    }
  } catch (err) {
    console.error('[ResellKit] Alarm handler error:', err);
  }
});

// ========================
// MESSAGING
// ========================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (!request || typeof request !== 'object') {
      sendResponse({ success: false, error: 'Invalid request' });
      return true;
    }

    if (request.action === 'getData') {
      chrome.storage.local.get(['rkItems'], (result) => {
        try {
          const data = result?.rkItems || [];
          sendResponse({ data, success: true });
        } catch (err) {
          console.error('[ResellKit] getData error:', err);
          sendResponse({ success: false, error: err.message });
        }
      });
      return true;
    }
    
    if (request.action === 'saveData') {
      if (!Array.isArray(request.data)) {
        sendResponse({ success: false, error: 'Data must be an array' });
        return true;
      }
      chrome.storage.local.set({ rkItems: request.data }, () => {
        try {
          if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
          }
          sendResponse({ success: true });
        } catch (err) {
          console.error('[ResellKit] saveData error:', err);
          sendResponse({ success: false, error: err.message });
        }
      });
      return true;
    }
    
    if (request.action === 'getSettings') {
      chrome.storage.local.get(['rkSettings'], (result) => {
        try {
          const settings = result?.rkSettings || DEFAULT_SETTINGS;
          sendResponse({ settings, success: true });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      });
      return true;
    }
    
    if (request.action === 'saveSettings') {
      if (!request.settings || typeof request.settings !== 'object') {
        sendResponse({ success: false, error: 'Invalid settings' });
        return true;
      }
      chrome.storage.local.set({ rkSettings: request.settings }, () => {
        try {
          if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
          }
          sendResponse({ success: true });
        } catch (err) {
          console.error('[ResellKit] saveSettings error:', err);
          sendResponse({ success: false, error: err.message });
        }
      });
      return true;
    }
    
    sendResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    console.error('[ResellKit] Message handler error:', err);
    sendResponse({ success: false, error: err.message });
  }
});

// ========================
// STARTUP
// ========================

initStorage().catch(err => console.error('[ResellKit] Startup init failed:', err));
setupAlarms().catch(err => console.error('[ResellKit] Startup alarms failed:', err));

console.log('[ResellKit] Service Worker ready');
