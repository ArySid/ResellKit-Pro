// background/sw.js - Service Worker
import { PLATFORMS, CATEGORIES, ROLAND_GARROS_INFO, CAPTCHA_TYPES, PLANS, DEFAULT_SETTINGS } from './constants.js';

// ========== INIT ==========
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ResellKit] Install:', details.reason);
  await initStorage();
  await createMenus();
  await setupAlarms();
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/onboarding.html') });
  }
});

// ========== STORAGE ==========
async function initStorage() {
  const data = await chrome.storage.local.get(null);
  if (!data.settings) await chrome.storage.local.set({ settings: { ...DEFAULT_SETTINGS } });
  if (!data.portfolio) await chrome.storage.local.set({ portfolio: [] });
  if (!data.alerts) await chrome.storage.local.set({ alerts: [] });
  if (!data.pageStates) await chrome.storage.local.set({ pageStates: {} });
  if (!data.captchaInbox) await chrome.storage.local.set({ captchaInbox: [] });
  if (!data.watchlist) await chrome.storage.local.set({ watchlist: [] });
  if (!data.stats) await chrome.storage.local.set({ stats: { totalAdded: 0, totalProfit: 0 } });
}

// ========== MENUS ==========
async function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'addToPortfolio', title: 'Ajouter au Portfolio', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'createAlert', title: 'Creer une alerte', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'openResellKit', title: 'Ouvrir ResellKit', contexts: ['page'] });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToPortfolio') {
    chrome.tabs.sendMessage(tab.id, { action: 'addToPortfolio' });
  } else if (info.menuItemId === 'createAlert') {
    chrome.tabs.sendMessage(tab.id, { action: 'createAlert', selection: info.selectionText });
  } else if (info.menuItemId === 'openResellKit') {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// ========== ALARMS ==========
async function setupAlarms() {
  chrome.alarms.create('checkAlerts', { periodInMinutes: 15 });
  chrome.alarms.create('updatePrices', { periodInMinutes: 30 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkAlerts') await checkAlerts();
  if (alarm.name === 'updatePrices') await updateWatchlistPrices();
});

// ========== MESSAGES ==========
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender).then(sendResponse);
  return true;
});

async function handleMessage(msg, sender) {
  switch (msg.action) {
    case 'getSettings':
      const s = await chrome.storage.local.get('settings');
      return s.settings || DEFAULT_SETTINGS;
    case 'saveSettings':
      await chrome.storage.local.set({ settings: msg.settings });
      return { success: true };
    case 'getPortfolio':
      const p = await chrome.storage.local.get('portfolio');
      return p.portfolio || [];
    case 'addToPortfolio':
      const portfolio = (await chrome.storage.local.get('portfolio')).portfolio || [];
      portfolio.push({ ...msg.item, dateAdded: new Date().toISOString() });
      await chrome.storage.local.set({ portfolio });
      updateStats('add');
      return { success: true };
    case 'removeFromPortfolio':
      const items = (await chrome.storage.local.get('portfolio')).portfolio || [];
      const filtered = items.filter(i => i.id !== msg.id);
      await chrome.storage.local.set({ portfolio: filtered });
      return { success: true };
    case 'getAlerts':
      const a = await chrome.storage.local.get('alerts');
      return a.alerts || [];
    case 'addAlert':
      const alerts = (await chrome.storage.local.get('alerts')).alerts || [];
      alerts.push({ ...msg.alert, id: Date.now(), active: true });
      await chrome.storage.local.set({ alerts });
      return { success: true };
    case 'removeAlert':
      const al = (await chrome.storage.local.get('alerts')).alerts || [];
      await chrome.storage.local.set({ alerts: al.filter(a => a.id !== msg.id) });
      return { success: true };
    case 'updatePageState':
      const states = (await chrome.storage.local.get('pageStates')).pageStates || {};
      states[sender.tab.id] = msg.state;
      await chrome.storage.local.set({ pageStates: states });
      return { success: true };
    case 'updateCaptchaInbox':
      const inbox = (await chrome.storage.local.get('captchaInbox')).captchaInbox || [];
      const existing = inbox.find(i => i.tabId === msg.tabId);
      if (msg.present) {
        if (!existing) inbox.push({ tabId: msg.tabId, ...msg.data });
      } else if (existing) {
        inbox.splice(inbox.indexOf(existing), 1);
      }
      await chrome.storage.local.set({ captchaInbox: inbox });
      return { success: true };
    case 'openTab':
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(t => t.id === msg.tabId);
      if (tab) await chrome.tabs.update(tab.id, { active: true });
      return { success: true };
    case 'getStats':
      const stats = (await chrome.storage.local.get('stats')).stats || {};
      return stats;
    case 'getWatchlist':
      const w = await chrome.storage.local.get('watchlist');
      return w.watchlist || [];
    case 'addToWatchlist':
      const watchlist = (await chrome.storage.local.get('watchlist')).watchlist || [];
      watchlist.push({ ...msg.item, dateAdded: new Date().toISOString() });
      await chrome.storage.local.set({ watchlist });
      return { success: true };
    case 'removeFromWatchlist':
      const wl = (await chrome.storage.local.get('watchlist')).watchlist || [];
      await chrome.storage.local.set({ watchlist: wl.filter(i => i.id !== msg.id) });
      return { success: true };
    case 'updateRolandGarrosChecklist':
      await chrome.storage.local.set({ rolandGarrosChecklist: msg.checklist });
      return { success: true };
    case 'getRolandGarrosChecklist':
      const rg = await chrome.storage.local.get('rolandGarrosChecklist');
      return rg.rolandGarrosChecklist || [];
    default:
      return { error: 'Unknown action' };
  }
}

async function updateStats(action) {
  const stats = (await chrome.storage.local.get('stats')).stats || { totalAdded: 0, totalProfit: 0 };
  if (action === 'add') stats.totalAdded++;
  await chrome.storage.local.set({ stats });
}

async function checkAlerts() {
  const alerts = (await chrome.storage.local.get('alerts')).alerts || [];
  for (const alert of alerts.filter(a => a.active)) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'checkAlert', alert });
      } catch (e) {}
    }
  }
}

async function updateWatchlistPrices() {
  const watchlist = (await chrome.storage.local.get('watchlist')).watchlist || [];
  for (const item of watchlist) {
    const tabs = await chrome.tabs.query({ url: item.url + '*' });
    for (const tab of tabs) {
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'checkWatchlist', item });
      } catch (e) {}
    }
  }
}
