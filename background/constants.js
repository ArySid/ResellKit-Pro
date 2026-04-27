// background/constants.js
// Toutes les données centralisées

export const PLATFORMS = {
  stockx: {
    id: 'stockx', name: 'StockX', url: 'stockx.com', category: 'sneakers',
    fees: { transaction: 0.095, processing: 0.03, shipping: 13.95, authentication: 0, currency: 'USD' },
    colors: { primary: '#006340', secondary: '#00d09c' }, supported: true
  },
  goat: {
    id: 'goat', name: 'GOAT', url: 'goat.com', category: 'sneakers',
    fees: { transaction: 0.095, processing: 0.029, shipping: 15, authentication: 0, currency: 'USD' },
    colors: { primary: '#000000', secondary: '#ffffff' }, supported: true
  },
  grailed: {
    id: 'grailed', name: 'Grailed', url: 'grailed.com', category: 'streetwear',
    fees: { transaction: 0.09, processing: 0.029, shipping: 0, authentication: 0, currency: 'USD' },
    colors: { primary: '#ff4444', secondary: '#ffffff' }, supported: true
  },
  vinted: {
    id: 'vinted', name: 'Vinted', url: 'vinted.fr', category: 'general',
    fees: { transaction: 0.05, processing: 0, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#129861', secondary: '#ffffff' }, supported: true
  },
  leboncoin: {
    id: 'leboncoin', name: 'LeBonCoin', url: 'leboncoin.fr', category: 'general',
    fees: { transaction: 0, processing: 0.029, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#f08d00', secondary: '#ffffff' }, supported: true
  },
  ebay: {
    id: 'ebay', name: 'eBay', url: 'ebay.fr', category: 'general',
    fees: { transaction: 0.129, processing: 0.029, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#e53238', secondary: '#0064d2' }, supported: true
  },
  ticketmaster: {
    id: 'ticketmaster', name: 'Ticketmaster', url: 'ticketmaster.fr', category: 'tickets',
    fees: { transaction: 0, processing: 0, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#0078d4', secondary: '#ffffff' }, supported: true, apiAvailable: true
  },
  rolandgarros: {
    id: 'rolandgarros', name: 'Roland-Garros / FFT', url: 'rolandgarros.com', category: 'sport',
    fees: { transaction: 0, processing: 0, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#004d25', secondary: '#e35205' }, supported: true,
    resaleNote: 'Revente uniquement via billetterie.fft.fr'
  },
  fnac: {
    id: 'fnac', name: 'Fnac Spectacles', url: 'fnac.com', category: 'tickets',
    fees: { transaction: 0, processing: 0, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#ff6600', secondary: '#000000' }, supported: true
  },
  stubhub: {
    id: 'stubhub', name: 'StubHub', url: 'stubhub.com', category: 'tickets',
    fees: { transaction: 0.15, processing: 0, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#0047bb', secondary: '#ffc107' }, supported: true
  },
  viagogo: {
    id: 'viagogo', name: 'Viagogo', url: 'viagogo.com', category: 'tickets',
    fees: { transaction: 0.15, processing: 0, shipping: 0, authentication: 0, currency: 'EUR' },
    colors: { primary: '#22b8cf', secondary: '#ffffff' }, supported: true
  },
  seatgeek: {
    id: 'seatgeek', name: 'SeatGeek', url: 'seatgeek.com', category: 'tickets',
    fees: { transaction: 0.15, processing: 0, shipping: 0, authentication: 0, currency: 'USD' },
    colors: { primary: '#ff4081', secondary: '#ffffff' }, supported: true
  }
};

export const CATEGORIES = {
  sneakers: { label: 'Sneakers', icon: '👟', platforms: ['stockx', 'goat', 'grailed'] },
  streetwear: { label: 'Streetwear', icon: '👕', platforms: ['stockx', 'goat', 'grailed', 'vinted'] },
  watches: { label: 'Montres', icon: '⌚', platforms: ['ebay', 'leboncoin'] },
  tickets: { label: 'Billets', icon: '🎫', platforms: ['ticketmaster', 'fnac', 'stubhub', 'viagogo'] },
  sport: { label: 'Sport', icon: '🏆', platforms: ['rolandgarros', 'stubhub', 'viagogo', 'seatgeek'] },
  general: { label: 'Général', icon: '🛒', platforms: ['vinted', 'leboncoin', 'ebay'] }
};

export const ROLAND_GARROS_INFO = {
  eventName: 'Roland-Garros 2026',
  dates: { qualifs: '19-23 mai 2026', tournament: '25 mai - 7 juin 2026' },
  courts: [
    { id: 'phillipe-chatrier', name: 'Court Philippe-Chatrier', tier: 1 },
    { id: 'suzanne-lenglen', name: 'Court Suzanne-Lenglen', tier: 1 },
    { id: 'simonne-mathieu', name: 'Court Simonne-Mathieu', tier: 2 },
    { id: 'courts-14-18', name: 'Courts 14-18', tier: 3 },
    { id: 'autres-courts', name: 'Autres courts', tier: 3 }
  ],
  sessions: [
    { id: 'morning', name: 'Session Matin (11h)', time: '11:00' },
    { id: 'afternoon', name: 'Session Après-midi (14h)', time: '14:00' },
    { id: 'evening', name: 'Session Soirée (18h)', time: '18:00' }
  ],
  officialLinks: {
    tickets: 'https://billetterie.fft.fr',
    main: 'https://www.rolandgarros.com',
    resale: 'https://billetterie.fft.fr/revente',
    travel: 'https://travel.rolandgarros.com'
  },
  tips: [
    'Prepare ton compte FFT a l avance (email valide, paiement enregistre)',
    'La file d attente est aleatoire - ne rafraichis pas',
    'Prevois 2-3 choix de sessions/courts en backup',
    'Utilise un seul onglet pour eviter les erreurs',
    'La revente legale passe uniquement par la plateforme officielle FFT',
    'Les sessions du matin sont souvent moins cheres'
  ]
};

export const CAPTCHA_TYPES = {
  hcaptcha: {
    selectors: ['iframe[src*="hcaptcha.com"]', '[data-hcaptcha-sitekey]'],
    label: 'hCaptcha',
    description: 'Challenge visuel - cliquez sur les images correspondantes'
  },
  recaptcha: {
    selectors: ['iframe[src*="google.com/recaptcha"]', '.g-recaptcha'],
    label: 'reCAPTCHA',
    description: 'Verification Google - "Je ne suis pas un robot"'
  },
  turnstile: {
    selectors: ['iframe[src*="challenges.cloudflare.com/turnstile"]'],
    label: 'Cloudflare Turnstile',
    description: 'Challenge invisible Cloudflare'
  },
  unknown: {
    selectors: [],
    label: 'CAPTCHA non identifie',
    description: 'Verification humaine detectee'
  }
};

export const PLANS = {
  free: {
    id: 'free', name: 'Gratuit', price: 0, currency: 'EUR',
    features: ['Calculateur de profit basique', 'Portfolio 20 items', 'Alertes basiques (5 max)', 'Overlay sur 5 sites'],
    limits: { portfolioItems: 20, alerts: 5, sites: 5, exports: false, cloudSync: false, aiInsights: false }
  },
  pro: {
    id: 'pro', name: 'Pro', price: 9.99, currency: 'EUR',
    features: ['Tout du plan Gratuit', 'Portfolio illimité', 'Alertes illimitées', 'Overlay tous sites', 'Roland-Garros Mode', 'Captcha Inbox', 'Export CSV', 'Stats avancées'],
    limits: { portfolioItems: -1, alerts: -1, sites: -1, exports: true, cloudSync: false, aiInsights: false }
  },
  premium: {
    id: 'premium', name: 'Premium', price: 24.99, currency: 'EUR',
    features: ['Tout du plan Pro', 'IA Insights', 'Sync cloud', 'API temps reel', 'Watchlist intelligente', 'Analytics avancées', 'Exports Google Sheets'],
    limits: { portfolioItems: -1, alerts: -1, sites: -1, exports: true, cloudSync: true, aiInsights: true }
  }
};

export const DEFAULT_SETTINGS = {
  currency: 'EUR', overlayEnabled: true, notificationsEnabled: true,
  autoDetectPrices: true, plan: 'free', favoritePlatforms: [],
  customFees: {}, language: 'fr', theme: 'dark',
  showProfitInOverlay: true, captchaInboxEnabled: true, rolandGarrosMode: true
};
