// popup/popup.js
const PLATFORM_FEES = {
  stockx: 0.125, goat: 0.124, grailed: 0.119, vinted: 0.05,
  leboncoin: 0.029, ebay: 0.158, stubhub: 0.15, viagogo: 0.15
};

// ========== TABS ==========
const tabs = document.querySelectorAll('.rk-tab');
const panels = document.querySelectorAll('.rk-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ========== LOAD DATA ==========
async function loadData() {
  const portfolio = await chrome.runtime.sendMessage({ action: 'getPortfolio' });
  const alerts = await chrome.runtime.sendMessage({ action: 'getAlerts' });
  const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  renderDashboard(portfolio, alerts, stats, settings);
  renderPortfolio(portfolio);
  renderAlerts(alerts);
}

// ========== DASHBOARD ==========
function renderDashboard(portfolio, alerts, stats, settings) {
  document.getElementById('rk-total-profit').textContent = (stats?.totalProfit || 0).toFixed(2) + ' €';
  document.getElementById('rk-total-items').textContent = portfolio?.length || 0;
  document.getElementById('rk-alert-count').textContent = alerts?.length || 0;
  const roi = portfolio?.length > 0 ? 30 : 0;
  document.getElementById('rk-avg-roi').textContent = roi + '%';
  document.getElementById('rk-plan-badge').textContent = (settings?.plan || 'free').charAt(0).toUpperCase() + (settings?.plan || 'free').slice(1);
}

// ========== PORTFOLIO ==========
function renderPortfolio(items) {
  const list = document.getElementById('rk-portfolio-list');
  document.getElementById('rk-portfolio-count').textContent = (items?.length || 0) + ' items';
  if (!items || items.length === 0) {
    list.innerHTML = '<div class="rk-empty"><div class="rk-empty-icon">📦</div><p>Aucun item dans le portfolio</p></div>';
    return;
  }
  list.innerHTML = items.slice().reverse().map(item => {
    const date = new Date(item.dateAdded).toLocaleDateString('fr-FR');
    return '<div class="rk-list-item">' +
      '<div class="rk-list-item-info">' +
      '<div class="rk-list-item-name">' + (item.name || 'Produit inconnu') + '</div>' +
      '<div class="rk-list-item-meta">' + (item.platform || '?') + ' - ' + (item.price || 0) + ' € - ' + date + '</div>' +
      '</div>' +
      '<div class="rk-list-item-actions">' +
      '<button class="rk-icon-btn" title="Supprimer" data-id="' + (item.id || '') + '">&times;</button>' +
      '</div></div>';
  }).join('');
  list.querySelectorAll('.rk-icon-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'removeFromPortfolio', id: btn.dataset.id });
      loadData();
    });
  });
}

// ========== ALERTS ==========
function renderAlerts(items) {
  const list = document.getElementById('rk-alerts-list');
  if (!items || items.length === 0) {
    list.innerHTML = '<div class="rk-empty"><div class="rk-empty-icon">🔔</div><p>Aucune alerte active</p></div>';
    return;
  }
  list.innerHTML = items.slice().reverse().map(a => {
    return '<div class="rk-list-item">' +
      '<div class="rk-list-item-info">' +
      '<div class="rk-list-item-name">' + (a.platform || '?') + '</div>' +
      '<div class="rk-list-item-meta">Cible: ' + (a.targetPrice || '-') + ' € - ' + (a.active ? '<span class="rk-green">Active</span>' : '<span class="rk-red">Inactive</span>') + '</div>' +
      '</div>' +
      '<div class="rk-list-item-actions">' +
      '<button class="rk-icon-btn" title="Supprimer" data-id="' + (a.id || '') + '">&times;</button>' +
      '</div></div>';
  }).join('');
  list.querySelectorAll('.rk-icon-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'removeAlert', id: btn.dataset.id });
      loadData();
    });
  });
}

// ========== CALCULATOR ==========
document.getElementById('calc-btn').addEventListener('click', () => {
  const buy = parseFloat(document.getElementById('calc-buy').value) || 0;
  const sell = parseFloat(document.getElementById('calc-sell').value) || 0;
  const platform = document.getElementById('calc-platform').value;
  const fees = PLATFORM_FEES[platform] || 0.1;
  const feesAmt = sell * fees;
  const profit = sell - buy - feesAmt;
  const roi = buy > 0 ? (profit / buy) * 100 : 0;
  document.getElementById('calc-fees').textContent = feesAmt.toFixed(2) + ' € (' + (fees * 100).toFixed(1) + '%)';
  const profitEl = document.getElementById('calc-profit');
  profitEl.textContent = profit.toFixed(2) + ' €';
  profitEl.className = profit >= 0 ? 'rk-green' : 'rk-red';
  const roiEl = document.getElementById('calc-roi');
  roiEl.textContent = roi.toFixed(1) + '%';
  roiEl.className = roi >= 0 ? 'rk-blue' : 'rk-red';
  document.getElementById('calc-result').style.display = 'block';
});

// ========== ALERTS FORM ==========
document.getElementById('alert-btn').addEventListener('click', async () => {
  const platform = document.getElementById('alert-platform').value;
  const price = parseFloat(document.getElementById('alert-price').value);
  if (!price) { alert('Entrez un prix cible'); return; }
  await chrome.runtime.sendMessage({
    action: 'addAlert',
    alert: { type: 'price', platform, targetPrice: price, active: true }
  });
  alert('Alerte creee !');
  document.getElementById('alert-price').value = '';
  loadData();
});

// ========== EXPORT ==========
document.getElementById('rk-export-btn').addEventListener('click', async () => {
  const items = await chrome.runtime.sendMessage({ action: 'getPortfolio' });
  const csv = 'Nom,Plateforme,Prix,Date\n' + items.map(i =>
    '"' + (i.name || '') + '","' + (i.platform || '') + '","' + (i.price || 0) + '","' + (i.dateAdded || '') + '"'
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'portfolio-resellkit.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// ========== FOOTER LINKS ==========
document.getElementById('rk-settings-link').addEventListener('click', () => chrome.runtime.openOptionsPage());
document.getElementById('rk-sidepanel-link').addEventListener('click', () => chrome.runtime.sendMessage({ action: 'openSidepanel' }));

// ========== INIT ==========
loadData();
