// content/content.js
(function() {
  'use strict';
  let settings = { overlayEnabled: true, showProfitInOverlay: true, autoDetectPrices: true };
  let detectedPrice = null, detectedPlatform = null, detectedProductName = null;
  let fab = null, captchaDetected = false, captchaType = null;

  chrome.storage.local.get('settings').then(res => { settings = { ...settings, ...res.settings }; init(); });
  chrome.storage.onChanged.addListener((c) => { if (c.settings) settings = { ...settings, ...c.settings.newValue }; });
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => { handleMessage(msg).then(sendResponse); return true; });

  function detectPlatform() {
    const h = window.location.hostname;
    if (h.includes('stockx')) return 'stockx'; if (h.includes('goat')) return 'goat';
    if (h.includes('grailed')) return 'grailed'; if (h.includes('vinted')) return 'vinted';
    if (h.includes('leboncoin')) return 'leboncoin'; if (h.includes('ebay')) return 'ebay';
    if (h.includes('ticketmaster')) return 'ticketmaster'; if (h.includes('rolandgarros') || h.includes('fft')) return 'rolandgarros';
    if (h.includes('fnac')) return 'fnac'; if (h.includes('stubhub')) return 'stubhub';
    if (h.includes('viagogo')) return 'viagogo'; if (h.includes('seatgeek')) return 'seatgeek';
    return null;
  }

  function detectPrice() {
    const sels = ['span[class*="price"]','.price','[class*="price"]','[data-testid="product-price"]',
      '.product-price','.price-current','[class*="Price"]','[class*="amount"]','.money','.currency',
      'span[data-automation-id*="price"]','.sale-price','.regular-price'];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) { const t = el.textContent || el.innerText;
        const m = t.match(/[\d,.]+[\s]?[\$€£]/i) || t.match(/[\$€£][\s]?[\d,.]+/i);
        if (m) return parseFloat(m[0].replace(/[\$€£\s,]/g,''));
      }
    }
    return null;
  }

  function detectProductName() {
    const sels = ['h1','[class*="title"]','.product-name','.product-title','[data-testid="product-title"]',
      '.item-title','[class*="product-name"]','.sh-title','.item-name','.goods-name'];
    for (const sel of sels) { const el = document.querySelector(sel); if (el) return el.textContent.trim().substring(0,100); }
    return document.title.substring(0,100);
  }

  function isRolandGarrosMode() {
    return window.location.hostname.includes('rolandgarros') || window.location.hostname.includes('fft');
  }

  function detectRolandGarrosState() {
    const t = document.body.innerText.toLowerCase(); const u = window.location.href;
    if (t.includes('file d attente')||t.includes('queue')||t.includes('patientez')) return {state:'queue',msg:'File d attente en cours'};
    if (t.includes('captcha')||t.includes('verification')||document.querySelector('iframe[src*="captcha"]')) return {state:'captcha',msg:'CAPTCHA detecte'};
    if (t.includes('sold out')||t.includes('epuise')||t.includes('complet')) return {state:'soldout',msg:'Sold out'};
    if (u.includes('billetterie')) return {state:'ready',msg:'Billetterie chargee'};
    return {state:'loading',msg:'Chargement'};
  }

  function detectCaptcha() {
    const cfgs = [
      {t:'hcaptcha',s:'iframe[src*="hcaptcha.com"]'},{t:'recaptcha',s:'iframe[src*="google.com/recaptcha"]'},
      {t:'recaptcha',s:'.g-recaptcha'},{t:'turnstile',s:'iframe[src*="challenges.cloudflare.com/turnstile"]'},
      {t:'friendly',s:'iframe[src*="friendlycaptcha.com"]'}
    ];
    for (const c of cfgs) if (document.querySelector(c.s)) return c.t;
    return null;
  }

  function createFab() {
    if (fab) return;
    fab = document.createElement('div'); fab.id = 'resellkit-fab';
    fab.innerHTML = '<div class="rk-fab-main" title="ResellKit Pro"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>'+
      '<div class="rk-fab-panel"><div class="rk-fab-header"><span>ResellKit Pro</span><button class="rk-fab-close">&times;</button></div>'+
      '<div class="rk-fab-section"><div class="rk-label">Plateforme</div><div class="rk-value" id="rk-platform">--</div></div>'+
      '<div class="rk-fab-section"><div class="rk-label">Prix detecte</div><div class="rk-value" id="rk-price">--</div></div>'+
      '<div class="rk-fab-section"><div class="rk-label">Profit estime</div><div class="rk-value rk-profit" id="rk-profit">--</div></div>'+
      '<div class="rk-fab-actions"><button class="rk-btn rk-btn-primary" id="rk-add-portfolio">+ Portfolio</button>'+
      '<button class="rk-btn rk-btn-secondary" id="rk-create-alert">Alerte</button>'+
      '<button class="rk-btn rk-btn-tertiary" id="rk-open-sidepanel">Panel</button></div>'+
      '<div class="rk-fab-footer" id="rk-rg-status"></div></div>';
    document.body.appendChild(fab); setupFabEvents();
  }

  function setupFabEvents() {
    const main = fab.querySelector('.rk-fab-main'), panel = fab.querySelector('.rk-fab-panel'), close = fab.querySelector('.rk-fab-close');
    main.addEventListener('click',() => panel.classList.toggle('rk-hidden'));
    close.addEventListener('click',() => panel.classList.add('rk-hidden'));
    fab.querySelector('#rk-add-portfolio').addEventListener('click',() => {
      chrome.runtime.sendMessage({action:'addToPortfolio',item:{platform:detectedPlatform,price:detectedPrice,name:detectedProductName,url:window.location.href}});
      alert('Ajoute au portfolio !');
    });
    fab.querySelector('#rk-create-alert').addEventListener('click',() => {
      chrome.runtime.sendMessage({action:'addAlert',alert:{type:'price',platform:detectedPlatform,product:detectedProductName,url:window.location.href}});
      alert('Alerte creee !');
    });
    fab.querySelector('#rk-open-sidepanel').addEventListener('click',() => chrome.runtime.sendMessage({action:'openSidepanel'}));
  }

  function updateFab() {
    if (!fab) return;
    fab.querySelector('#rk-platform').textContent = detectedPlatform || 'Inconnue';
    fab.querySelector('#rk-price').textContent = detectedPrice ? detectedPrice + ' €' : '--';
    if (detectedPrice && settings.showProfitInOverlay) {
      const p = detectedPrice * 1.3 - detectedPrice;
      fab.querySelector('#rk-profit').textContent = '+' + p.toFixed(2) + ' €';
    }
  }

  function createRGPanel() {
    if (document.getElementById('rk-rg-panel')) return;
    const p = document.createElement('div'); p.id = 'rk-rg-panel';
    p.innerHTML = '<div class="rk-rg-header"><span>🎾 Roland-Garros Mode</span><button class="rk-rg-close">&times;</button></div>'+
      '<div class="rk-rg-status" id="rk-rg-state">Chargement...</div>'+
      '<div class="rk-rg-tips"><strong>Conseils:</strong><ul id="rk-rg-tips-list"></ul></div>'+
      '<div class="rk-rg-actions"><a href="https://billetterie.fft.fr" target="_blank" class="rk-btn rk-btn-primary">Billetterie FFT</a>'+
      '<a href="https://billetterie.fft.fr/revente" target="_blank" class="rk-btn rk-btn-secondary">Revente Officielle</a></div>';
    document.body.appendChild(p);
    p.querySelector('.rk-rg-close').addEventListener('click',() => p.remove());
    updateRGStatus();
    const tl = p.querySelector('#rk-rg-tips-list');
    ['Prepare ton compte FFT','Ne rafraichis pas la file','Prevois des choix backup','Revente via FFT uniquement']
      .forEach(t => tl.innerHTML += '<li>'+t+'</li>');
  }

  function updateRGStatus() {
    const el = document.getElementById('rk-rg-state'); if (!el) return;
    const s = detectRolandGarrosState(); el.textContent = s.msg; el.className = 'rk-rg-status rk-state-'+s.state;
  }

  function init() {
    if (!settings.overlayEnabled) return;
    detectedPlatform = detectPlatform(); detectedPrice = detectPrice(); detectedProductName = detectProductName();
    createFab(); updateFab();
    if (isRolandGarrosMode()) { createRGPanel(); setInterval(updateRGStatus,3000); }
    setInterval(() => {
      const c = detectCaptcha();
      if (c && !captchaDetected) {
        captchaDetected = true; captchaType = c;
        chrome.runtime.sendMessage({action:'updateCaptchaInbox',tabId:chrome.runtime.id,present:true,
          data:{type:c,platform:detectedPlatform,url:window.location.href,title:document.title}});
      } else if (!c && captchaDetected) {
        captchaDetected = false;
        chrome.runtime.sendMessage({action:'updateCaptchaInbox',tabId:chrome.runtime.id,present:false});
      }
    }, 2000);
    chrome.runtime.sendMessage({action:'updatePageState',state:{platform:detectedPlatform,price:detectedPrice,name:detectedProductName,url:window.location.href,title:document.title}});
  }

  async function handleMessage(msg) {
    switch (msg.action) {
      case 'addToPortfolio': detectedPrice = detectPrice(); detectedProductName = detectProductName();
        chrome.runtime.sendMessage({action:'addToPortfolio',item:{platform:detectedPlatform,price:detectedPrice,name:detectedProductName,url:window.location.href}}); return {success:true};
      case 'createAlert': chrome.runtime.sendMessage({action:'addAlert',alert:{type:'price',platform:detectedPlatform,product:detectedProductName,url:window.location.href,selection:msg.selection}}); return {success:true};
      case 'toggleOverlay': if (fab) fab.classList.toggle('rk-hidden'); return {success:true};
      case 'checkAlert': if (msg.alert && detectedPlatform === msg.alert.platform) {
        const np = detectPrice(); if (np && msg.alert.targetPrice && np <= msg.alert.targetPrice) new Notification('ResellKit',{body:msg.alert.product+' est a '+np+' € !'});
      } return {success:true};
      default: return {error:'Unknown'};
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
