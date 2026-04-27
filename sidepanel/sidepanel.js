// ============================================
// ResellKit Pro - Sidepanel Script
// ============================================

(function() {
  'use strict';

  const SIDEPANEL = document.getElementById('rk-sidepanel');
  if (!SIDEPANEL) return;

  // ===================
  // State
  // ===================
  let items = [];
  let activeTab = 'items';
  let settings = {};

  // ===================
  // Init
  // ===================
  async function init() {
    await loadSettings();
    await loadItems();
    await updateDashboard();
    setupTabs();
    setupForms();
    setupKeyboard();
    SIDEPANEL.classList.add('rk-sp-ready');
  }

  // ===================
  // Settings
  // ===================
  async function loadSettings() {
    try {
      const res = await chrome.storage.local.get(['rkSettings']);
      settings = res.rkSettings || {};
    } catch (e) { settings = {}; }
  }

  async function saveSettings() {
    try {
      await chrome.storage.local.set({ rkSettings: settings });
    } catch (e) {}
  }

  // ===================
  // Items
  // ===================
  async function loadItems() {
    try {
      const res = await chrome.storage.local.get(['rkItems']);
      items = res.rkItems || [];
      renderItemsList();
      updateCount();
    } catch (e) { items = []; renderItemsList(); }
  }

  async function saveItems() {
    await chrome.storage.local.set({ rkItems: items });
    updateCount();
  }

  function addItem(item) {
    item.id = Date.now().toString(36);
    item.createdAt = new Date().toISOString();
    items.unshift(item);
    saveItems();
    renderItemsList();
  }

  function removeItem(id) {
    items = items.filter(i => i.id !== id);
    saveItems();
    renderItemsList();
  }

  function updateItem(id, data) {
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
      items[idx] = { ...items[idx], ...data };
      saveItems();
      renderItemsList();
    }
  }

  function renderItemsList() {
    const list = SIDEPANEL.querySelector('.rk-sp-list');
    const empty = SIDEPANEL.querySelector('.rk-sp-empty');
    if (!list || !empty) return;

    if (items.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = items.map(item => {
      const typeClass = `rk-sp-item-${item.type}`;
      const statusClass = item.sold ? 'rk-sp-item-sold' : (item.archived ? 'rk-sp-item-archived' : '');
      return `
        <div class="rk-sp-item ${typeClass} ${statusClass}" data-id="${item.id}">
          <div class="rk-sp-item-main">
            <div class="rk-sp-item-title">${escapeHtml(item.name || 'Sans nom')}</div>
            <div class="rk-sp-item-meta">
              <span class="rk-sp-type-badge rk-sp-type-${item.type}">${getTypeLabel(item.type)}</span>
              <span class="rk-sp-price">${formatPrice(item.price)}</span>
            </div>
          </div>
          <div class="rk-sp-item-actions">
            <button class="rk-sp-btn-icon" data-action="edit" title="Modifier">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="rk-sp-btn-icon" data-action="sell" title="Marquer comme vendu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <button class="rk-sp-btn-icon rk-sp-btn-danger" data-action="delete" title="Supprimer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemEl = e.target.closest('.rk-sp-item');
        const id = itemEl?.dataset.id;
        if (!id) return;
        handleItemAction(id, btn.dataset.action);
      });
    });
  }

  function handleItemAction(id, action) {
    switch (action) {
      case 'delete':
        if (confirm('Supprimer cet article ?')) removeItem(id);
        break;
      case 'sell':
        updateItem(id, { sold: true, soldAt: new Date().toISOString() });
        break;
      case 'edit':
        openEditModal(id);
        break;
    }
  }

  function openEditModal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const form = SIDEPANEL.querySelector('.rk-sp-form');
    const section = SIDEPANEL.querySelector('.rk-sp-section-form');
    if (!form || !section) return;
    form.dataset.editId = id;
    form.querySelector('[name="name"]').value = item.name || '';
    form.querySelector('[name="type"]').value = item.type || 'concert';
    form.querySelector('[name="price"]').value = item.price || '';
    form.querySelector('[name="cost"]').value = item.cost || '';
    form.querySelector('[name="url"]').value = item.url || '';
    form.querySelector('[name="notes"]').value = item.notes || '';
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
  }

  // ===================
  // Dashboard
  // ===================
  async function updateDashboard() {
    const total = items.length;
    const sold = items.filter(i => i.sold).length;
    const active = total - sold;
    const totalCost = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    const totalRev = items.filter(i => i.sold).reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
    const profit = totalRev - totalCost;

    setText('.rk-sp-count-value', total);
    setText('.rk-sp-sold-value', sold);
    setText('.rk-sp-profit-value', formatPrice(profit));
    setText('.rk-sp-revenue-value', formatPrice(totalRev));
  }

  // ===================
  // Quick Add Form
  // ===================
  function setupForms() {
    const form = SIDEPANEL.querySelector('.rk-sp-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {
        name: fd.get('name'),
        type: fd.get('type'),
        price: parseFloat(fd.get('price')) || 0,
        cost: parseFloat(fd.get('cost')) || 0,
        url: fd.get('url'),
        notes: fd.get('notes'),
      };
      const editId = form.dataset.editId;
      if (editId) {
        updateItem(editId, data);
        form.dataset.editId = '';
      } else {
        addItem(data);
      }
      form.reset();
      SIDEPANEL.querySelector('.rk-sp-section-form').style.display = 'none';
      await updateDashboard();
      showNotification(editId ? 'Article modifié' : 'Article ajouté');
    });
  }

  // ===================
  // Tabs
  // ===================
  function setupTabs() {
    SIDEPANEL.querySelectorAll('.rk-sp-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
  }

  function switchTab(tabId) {
    activeTab = tabId;
    SIDEPANEL.querySelectorAll('.rk-sp-tab').forEach(t => {
      t.classList.toggle('rk-sp-tab-active', t.dataset.tab === tabId);
    });
    SIDEPANEL.querySelectorAll('.rk-sp-section').forEach(s => {
      s.classList.toggle('rk-sp-section-active', s.dataset.section === tabId);
    });
  }

  // ===================
  // Roland-Garros
  // ===================
  function updateRolandGarros(data) {
    const section = SIDEPANEL.querySelector('[data-section="rg"]');
    if (!section) return;
    if (!data || !data.matches) {
      section.querySelector('.rk-sp-rg-list').innerHTML = '<p class="rk-sp-rg-empty">Aucun match en cours</p>';
      return;
    }
    section.querySelector('.rk-sp-rg-list').innerHTML = data.matches.map(m => `
      <div class="rk-sp-rg-match">
        <div class="rk-sp-rg-header">
          <span>${m.court}</span>
          <span class="rk-sp-rg-dates">${m.time}</span>
        </div>
        <div class="rk-sp-rg-players">
          <div class="rk-sp-rg-player">${m.player1}</div>
          <div class="rk-sp-rg-vs">vs</div>
          <div class="rk-sp-rg-player">${m.player2}</div>
        </div>
        <div class="rk-sp-checklist">
          ${['Arrivée sur site', 'Billets', 'Place', 'Photo', 'Vérif prix'].map((label, i) => `
            <label class="rk-sp-check-item">
              <input type="checkbox" data-match="${m.id}" data-step="${i}">
              <span>${label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // ===================
  // Captcha Inbox
  // ===================
  function addCaptcha(captcha) {
    const section = SIDEPANEL.querySelector('[data-section="captcha"]');
    if (!section) return;
    const list = section.querySelector('.rk-sp-captcha-list');
    if (!list) return;

    const entry = {
      id: Date.now().toString(36),
      site: captcha.site || 'Site inconnu',
      type: captcha.type || 'unknown',
      createdAt: new Date(),
    };

    const html = `
      <div class="rk-sp-captcha-item" data-id="${entry.id}">
        <div class="rk-sp-captcha-info">
          <span class="rk-sp-captcha-site">${escapeHtml(entry.site)}</span>
          <span class="rk-sp-captcha-type rk-sp-type-${entry.type}">${entry.type}</span>
        </div>
        <span class="rk-sp-captcha-time">${entry.createdAt.toLocaleTimeString('fr-FR')}</span>
      </div>
    `;
    list.insertAdjacentHTML('afterbegin', html);
    updateCaptchaCount();
  }

  function updateCaptchaCount() {
    const count = SIDEPANEL.querySelectorAll('.rk-sp-captcha-item').length;
    setText('.rk-sp-captcha-count', count);
  }

  // ===================
  // Utils
  // ===================
  function setText(selector, value) {
    const el = SIDEPANEL.querySelector(selector);
    if (el) el.textContent = value;
  }

  function updateCount() {
    setText('.rk-sp-item-count', items.length);
  }

  function formatPrice(num) {
    if (!num && num !== 0) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]);
  }

  function getTypeLabel(type) {
    return { concert: 'Concert', sport: 'Sport', article: 'Article', rg: 'Roland-Garros' }[type] || type;
  }

  function showNotification(msg) {
    const el = SIDEPANEL.querySelector('.rk-sp-notification');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('rk-sp-notify-show');
    setTimeout(() => el.classList.remove('rk-sp-notify-show'), 2000);
  }

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        SIDEPANEL.querySelector('[name="name"]')?.focus();
      }
    });
  }

  // Expose API
  window.RKSidepanel = { addItem, updateRolandGarros, addCaptcha, loadItems, updateDashboard };

  init();
})();
