// ResellKit Bot v3.0 - Aggressive Stock Monitor
'use strict';

const CONFIG = {pollInterval: 20000, maxTargets: 100, timeout: 12000, userAgents: ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36']};

let state = {running: false, targets: [], checks: 0, alerts: 0, errors: 0, lastCheck: null};

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Bot] v3.0 installed');
  const {settings} = await chrome.storage.local.get('settings');
  if (!settings) await chrome.storage.local.set({settings: {interval: 20, notifications: true, sound: true}});
  const {targets} = await chrome.storage.local.get('targets');
  if (!targets) await chrome.storage.local.set({targets: []});
});

async function startBot() {
  if (state.running) return;
  state.running = true;
  state.checks = 0;
  state.alerts = 0;
  state.errors = 0;
  await saveState();
  const {settings} = await chrome.storage.local.get('settings');
  const interval = (settings?.interval || 20) * 1000;
  chrome.alarms.create('poll', {periodInMinutes: interval / 60000});
  console.log(`[Bot] Started - ${interval/1000}s poll`);
  await runCheck();
}

async function stopBot() {
  state.running = false;
  await saveState();
  chrome.alarms.clear('poll');
  console.log('[Bot] Stopped');
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'poll' && state.running) await runCheck();
});

async function runCheck() {
  if (!state.running) return;
  const {targets} = await chrome.storage.local.get('targets');
  if (!targets || targets.length === 0) return;
  state.lastCheck = Date.now();
  state.checks++;
  await saveState();
  console.log(`[Bot] Check #${state.checks} on ${targets.length} targets`);
  const promises = targets.map(t => checkTarget(t).catch(err => {state.errors++; console.error(`[Bot] ${t.url}:`, err.message);}));
  await Promise.allSettled(promises);
  await saveState();
}

async function checkTarget(target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.timeout);
  try {
    const ua = CONFIG.userAgents[Math.floor(Math.random() * CONFIG.userAgents.length)];
    const response = await fetch(target.url, {signal: controller.signal, headers: {'User-Agent': ua, 'Accept': 'text/html', 'Cache-Control': 'no-cache'}, cache: 'no-store'});
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const result = parseStock(html, target);
    const wasOut = !target.lastStatus || !target.lastStatus.inStock;
    if (result.inStock && wasOut) {await sendAlert(target, result); state.alerts++;}
    target.lastStatus = result;
    target.lastCheck = Date.now();
    await updateTarget(target);
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Timeout');
    throw err;
  }
}

function parseStock(html, target) {
  const lower = html.toLowerCase();
  const outPatterns = [/out of stock/i, /sold out/i, /épuisé/i, /rupture/i, /not available/i, /non disponible/i, /indisponible/i];
  const inPatterns = [/in stock/i, /available now/i, /en stock/i, /disponible/i, /add to cart/i, /ajouter au panier/i, /acheter/i, /buy now/i];
  let inStock = false;
  for (const p of outPatterns) if (p.test(lower)) {inStock = false; break;}
  if (!inStock) for (const p of inPatterns) if (p.test(lower)) {inStock = true; break;}
  let price = null;
  const priceMatch = html.match(/([0-9]{1,4}[,.]?[0-9]{0,2})\s*€/);
  if (priceMatch) price = parseFloat(priceMatch[1].replace(',', '.'));
  return {inStock, price, timestamp: Date.now()};
}

async function sendAlert(target, result) {
  const {settings} = await chrome.storage.local.get('settings');
  if (settings?.notifications !== false) {
    await chrome.notifications.create(target.id, {type: 'basic', iconUrl: 'icons/icon128.png', title: '🚀 STOCK DISPO!', message: `${target.name}\n${result.price ? result.price + ' €' : ''}`, priority: 2, requireInteraction: true, buttons: [{title: 'OUVRIR'}]});
  }
  console.log(`[Bot] 🚨 ALERT: ${target.name}`);
}

chrome.notifications.onButtonClicked.addListener(async (notifId) => {
  const {targets} = await chrome.storage.local.get('targets');
  const target = targets.find(t => t.id === notifId);
  if (target) await chrome.tabs.create({url: target.url, active: true});
});

async function saveState() {await chrome.storage.local.set({botState: state});}

async function updateTarget(target) {
  const {targets} = await chrome.storage.local.get('targets');
  const idx = targets.findIndex(t => t.id === target.id);
  if (idx !== -1) {targets[idx] = target; await chrome.storage.local.set({targets});}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.action === 'startBot') {await startBot(); sendResponse({success: true, state});}
      else if (msg.action === 'stopBot') {await stopBot(); sendResponse({success: true, state});}
      else if (msg.action === 'getState') sendResponse({success: true, state});
      else if (msg.action === 'addTarget') {await addTarget(msg.target); sendResponse({success: true});}
      else if (msg.action === 'removeTarget') {await removeTarget(msg.id); sendResponse({success: true});}
      else if (msg.action === 'getTargets') {const {targets} = await chrome.storage.local.get('targets'); sendResponse({success: true, targets: targets || []});}
      else if (msg.action === 'forceCheck') {await runCheck(); sendResponse({success: true});}
    } catch (err) {sendResponse({success: false, error: err.message});}
  })();
  return true;
});

async function addTarget(target) {
  const {targets = []} = await chrome.storage.local.get('targets');
  target.id = Date.now().toString();
  target.addedAt = Date.now();
  targets.push(target);
  await chrome.storage.local.set({targets});
  console.log(`[Bot] Added: ${target.name}`);
}

async function removeTarget(id) {
  const {targets = []} = await chrome.storage.local.get('targets');
  await chrome.storage.local.set({targets: targets.filter(t => t.id !== id)});
}

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd === 'toggle-bot') state.running ? await stopBot() : await startBot();
});

console.log('[Bot] SW v3.0 loaded');
