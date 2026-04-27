// ResellKit Pro - Dashboard Application

// State management
const state = {
    items: [],
    alerts: [],
    captchaDetected: 0,
    lastCaptcha: null,
    rgMonitoring: false,
    darkMode: false
};

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const contentAreas = document.querySelectorAll('.content-area');
const modal = document.getElementById('addItemModal');
const addItemBtn = document.getElementById('addItemBtn');
const addNewItemBtn = document.getElementById('addNewItemBtn');
const modalCancel = document.getElementById('modalCancel');
const addItemForm = document.getElementById('addItemForm');
const calculateBtn = document.getElementById('calculateBtn');
const calculatorResults = document.getElementById('calculatorResults');
const resultGrossProfit = document.getElementById('resultGrossProfit');
const resultTotalFees = document.getElementById('resultTotalFees');
const resultNetProfit = document.getElementById('resultNetProfit');
const resultMargin = document.getElementById('resultMargin');
const rgMonitorToggle = document.getElementById('rgMonitorToggle');
const startRgMonitor = document.getElementById('startRgMonitor');
const rgStatusText = document.getElementById('rgStatusText');
const rgLogs = document.getElementById('rgLogs');
const darkModeToggle = document.getElementById('darkModeToggle');

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        
        // Update nav active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update content visibility
        contentAreas.forEach(area => area.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');
        
        // Update header title
        document.querySelector('.header h2').textContent = item.textContent.trim().replace(/\s+/g, ' ');
    });
});

// Modal functionality
function openModal() {
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    addItemForm.reset();
}

if (addItemBtn) addItemBtn.addEventListener('click', openModal);
if (addNewItemBtn) addNewItemBtn.addEventListener('click', openModal);
if (modalCancel) modalCancel.addEventListener('click', closeModal);

// Add item form
if (addItemForm) {
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('modalItemName').value;
        const platform = document.getElementById('modalItemPlatform').value;
        const cost = parseFloat(document.getElementById('modalItemCost').value) || 0;
        const price = parseFloat(document.getElementById('modalItemPrice').value) || 0;
        
        if (name) {
            const item = {
                id: Date.now(),
                name,
                platform,
                cost,
                price,
                addedAt: new Date().toLocaleString('fr-FR')
            };
            
            state.items.push(item);
            saveState();
            updateDashboard();
            closeModal();
        }
    });
}

// Calculator
if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
        const cost = parseFloat(document.getElementById('calcCost').value) || 0;
        const price = parseFloat(document.getElementById('calcPrice').value) || 0;
        const feePercent = parseFloat(document.getElementById('calcFeePercent').value) || 0;
        const shipping = parseFloat(document.getElementById('calcShipping').value) || 0;
        const fixedFees = parseFloat(document.getElementById('calcFixedFees').value) || 0;
        
        const grossProfit = price - cost;
        const platformFees = price * (feePercent / 100);
        const totalFees = platformFees + shipping + fixedFees;
        const netProfit = grossProfit - totalFees;
        const margin = price > 0 ? (netProfit / price) * 100 : 0;
        
        resultGrossProfit.textContent = `${grossProfit.toFixed(2)} €`;
        resultTotalFees.textContent = `${totalFees.toFixed(2)} €`;
        resultNetProfit.textContent = `${netProfit.toFixed(2)} €`;
        resultMargin.textContent = `${margin.toFixed(2)}%`;
        
        // Color code based on profit
        resultNetProfit.className = 'result-value ' + (netProfit >= 0 ? 'net-profit' : '');
        
        calculatorResults.style.display = 'block';
    });
}

// Roland-Garros Monitoring
if (startRgMonitor) {
    startRgMonitor.addEventListener('click', () => {
        const interval = parseInt(document.getElementById('rgCheckInterval').value) || 60;
        const budget = parseFloat(document.getElementById('rgBudget').value) || 500;
        
        if (!state.rgMonitoring) {
            state.rgMonitoring = true;
            rgStatusText.textContent = 'Actif';
            document.querySelector('.status-dot').className = 'status-dot active';
            addLog('Surveillance démarrée');
            addLog(`Intervalle: ${interval}s | Budget: ${budget}€`);
            
            // Simulate monitoring
            setInterval(() => {
                if (state.rgMonitoring) {
                    const random = Math.random();
                    if (random < 0.1) {
                        addLog('Aucun billet disponible pour le moment');
                    } else if (random < 0.15) {
                        addLog('Surveillance en cours...');
                    }
                }
            }, interval * 1000);
        } else {
            state.rgMonitoring = false;
            rgStatusText.textContent = 'Inactif';
            document.querySelector('.status-dot').className = 'status-dot inactive';
            addLog('Surveillance arrêtée');
        }
    });
}

function addLog(message) {
    const log = document.createElement('p');
    log.className = 'log-entry';
    log.textContent = `${new Date().toLocaleTimeString('fr-FR')} - ${message}`;
    rgLogs.insertBefore(log, rgLogs.firstChild);
}

// Dark Mode
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
        state.darkMode = darkModeToggle.checked;
    });
}

// State persistence
function saveState() {
    localStorage.setItem('resellkit_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('resellkit_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
        updateDashboard();
    }
}

// Update dashboard stats
function updateDashboard() {
    const totalItems = state.items.length;
    const totalProfit = state.items.reduce((sum, item) => sum + (item.price - item.cost), 0);
    const activeAlerts = state.alerts.length;
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    if (statCards.length >= 3) {
        statCards[0].textContent = totalItems;
        statCards[1].textContent = `${totalProfit.toFixed(2)} €`;
        statCards[2].textContent = activeAlerts;
    }
    
    // Update items list
    const itemsList = document.querySelector('.items-list');
    if (itemsList && totalItems > 0) {
        itemsList.innerHTML = state.items.map(item => `
            <div class="card">
                <h3>${item.name}</h3>
                <p>Plateforme: ${item.platform || 'N/A'}</p>
                <p>Prix d'achat: ${item.cost.toFixed(2)} €</p>
                <p>Prix de vente: ${item.price.toFixed(2)} €</p>
                <p>Ajouté le: ${item.addedAt}</p>
            </div>
        `).join('');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    console.log('ResellKit Pro v3.0 initialized');
});
