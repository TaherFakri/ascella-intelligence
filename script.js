const API = "https://ascella-intelligence.onrender.com";
let isLogin = true;
let currentStockData = null; 
let myChart = null;

/**
 * App Initialization
 */
function initApp() {
    console.log("Ascella Intelligence System Online...");

    const token = localStorage.getItem("token");

    if (token) {
        // User already authenticated
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('main-nav').style.display = 'flex';
        switchTab('market');
    } else {
        // Not authenticated
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('section-market').style.display = 'none';
        document.getElementById('section-portfolio').style.display = 'none';
    }

    applyReveal();
}

/**
 * Scroll Reveal Effect
 * Makes cards fade and slide up as the user scrolls
 */
function applyReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .stock-card, .column').forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(40px)";
        el.style.transition = "all 0.6s ease-out";
        observer.observe(el);
    });
}

/**
 * UI Navigation & Tab Switching
 */
function switchTab(tab) {
    const marketSection = document.getElementById('section-market');
    const portfolioSection = document.getElementById('section-portfolio');
    const marketNav = document.getElementById('nav-market');
    const portfolioNav = document.getElementById('nav-portfolio');

    marketSection.style.display = tab === 'market' ? 'block' : 'none';
    portfolioSection.style.display = tab === 'portfolio' ? 'block' : 'none';
    
    marketNav.className = tab === 'market' ? 'active' : '';
    portfolioNav.className = tab === 'portfolio' ? 'active' : '';
    
    if (tab === 'market') loadDashboard();
    if (tab === 'portfolio') loadPortfolio();
    
    // Re-apply reveal to new elements
    setTimeout(applyReveal, 100);
}

/**
 * Authentication Logic
 */
function toggleAuth() {
    isLogin = !isLogin;
    document.getElementById('auth-title').innerText = isLogin ? "Access Ascella System" : "Establish New Link";
    document.getElementById('toggle-link').innerText = isLogin ? "New here? Establish Link" : "Already linked? Secure Access";
}

async function handleAuth() {
    const username = document.getElementById('user').value;
    const password = document.getElementById('pass').value;
    const path = isLogin ? '/login' : '/signup';

    if(!username || !password) return alert("Credentials required.");

    try {
        const res = await fetch(`${API}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username, password})
        });

        const data = await res.json();
        if (res.ok) {
            if (isLogin) {
                if (!data.token) {
            alert("Authentication failed.");
            return;
        }
                localStorage.setItem("token", data.token);

                document.getElementById('auth-overlay').style.display = 'none';
                document.getElementById('main-nav').style.display = 'flex';
                switchTab('market');
            } else {
                alert("Link established successfully!");
                toggleAuth();
            }
        } else {
            alert(data.error || "Access Denied");
        }
    } catch (e) {
        console.error("Auth Failure:", e);
        alert("Subspace connection failed.");
    }
}

/**
 * Market Dashboard
 */
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/market-overview`);
        const stocks = await res.json();

        const shortTermContainer = document.getElementById('short-term-list');
        const longTermContainer = document.getElementById('long-term-list');

        shortTermContainer.innerHTML = '';
        longTermContainer.innerHTML = '';

        stocks.forEach(stock => {
            const card = `
                <div class="stock-card">
                    <div class="badge ${stock.status.replace(/\s+/g, '-')}">${stock.status}</div>
                    <span class="cat-tag">${stock.cat}</span>
                    <h3>${stock.symbol}</h3>
                    <p>Price: $${stock.price} | Target: $${stock.pred}</p>
                    <p class="small-desc">${stock.desc}</p>
                </div>
            `;

            if (stock.cat === 'Short-Term') {
                shortTermContainer.innerHTML += card;
            } else {
                longTermContainer.innerHTML += card;
            }
        });
        applyReveal();
    } catch (e) {
        console.error("Dashboard failed to load", e);
    }
}

/**
 * Stock Analysis (Chart.js)
 */
async function analyzeStock() {
    const symbolInput = document.getElementById('symbol');
    const symbol = symbolInput.value.toUpperCase();
    if (!symbol) return alert("Ticker symbol required.");

    try {
        const res = await fetch(`${API}/analyze`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ symbol })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Analysis failed");
        }

        currentStockData = await res.json(); // Safely define data
        updateView('short'); 
    } catch (e) {
        console.error("Analysis Failure:", e);
        alert(e.message);
    }
}

function updateView(mode) {
    if (!currentStockData || !currentStockData[mode]) return;
    
    const data = currentStockData[mode];
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    document.getElementById('btn-short').classList.toggle('active', mode === 'short');
    document.getElementById('btn-long').classList.toggle('active', mode === 'long');

    if (myChart) myChart.destroy();

    let lastDate = new Date(data.dates[data.dates.length - 1]);
    let futureDates = data.prediction.map((_, i) => {
        let d = new Date(lastDate);
        d.setDate(d.getDate() + i + 1);
        return d.toISOString().split('T')[0];
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...data.dates, ...futureDates],
            datasets: [{
                label: 'Market Price',
                data: data.history,
                borderColor: '#00d2ff',
                backgroundColor: 'rgba(0, 210, 255, 0.1)',
                fill: true,
                pointRadius: mode === 'short' ? 4 : 0,
                tension: 0.3
            }, {
                label: 'AI Forecast',
                data: Array(data.history.length).fill(null).concat(data.prediction),
                borderColor: '#9d50bb',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e2e8f0' } }
            },
            scales: {
                x: { ticks: { maxTicksLimit: 10, color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

/**
 * Portfolio Management
 */
async function loadPortfolio() {
    try {
        const res = await fetch(`${API}/portfolio`, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
    }
});
if (res.status === 401) {
    localStorage.removeItem("token");
    alert("Session expired. Please login again.");
    location.reload();
    return;
}

if (!res.ok) {
    throw new Error("Failed to load portfolio");
}
        const data = await res.json();
        
        let totalInvested = 0;
        let totalCurrentValue = 0;

        const portfolioList = document.getElementById('portfolio-list');
        portfolioList.innerHTML = data.map(s => {
            const qty = parseFloat(s.quantity) || 1; // Assuming your API returns quantity
            const buyTotal = qty * s.buy;
            const currentTotal = qty * s.current;
            const profitLoss = currentTotal - buyTotal;
            const plClass = profitLoss >= 0 ? 'profit' : 'loss';

            totalInvested += buyTotal;
            totalCurrentValue += currentTotal;

            return `
                <div class="stock-card">
                    <div class="card-header">
                        <h3>${s.symbol} <small>x${qty}</small></h3>
                        <button class="icon-btn" onclick="quickAnalyze('${s.symbol}')">🔍 Analyse</button>
                    </div>
                    <h3>${s.symbol} <span class="qty-pill">x${qty}</span></h3>
            <div class="card-actions">
                <button class="icon-btn" onclick="quickAnalyze('${s.symbol}')">🔍</button>
                <button class="icon-btn delete-btn" onclick="deleteStock('${s.symbol}')">🗑️</button>
            </div>
                    <div class="price-info">
                        <p>Total Cost: <span>$${buyTotal.toFixed(2)}</span></p>
                        <p>Market Value: <span>$${currentTotal.toFixed(2)}</span></p>
                    </div>
                    <div class="pl-tag ${plClass}">
                        ${plClass.toUpperCase()}: $${Math.abs(profitLoss).toFixed(2)}
                    </div>
                    <div class="badge ${s.guidance === 'SELL NOW' ? 'Sell' : 'Hold'}">
                        AI Advice: ${s.guidance}
                    </div>
                </div>`;
        }).join('');

        // Update Summary Card
        document.getElementById('total-invested').innerText = `$${totalInvested.toFixed(2)}`;
        const netPL = totalCurrentValue - totalInvested;
        const netElement = document.getElementById('net-pl');
        netElement.innerText = `${netPL >= 0 ? '+' : '-'}$${Math.abs(netPL).toFixed(2)}`;
        netElement.className = `value ${netPL >= 0 ? 'profit' : 'loss'}`;

        applyReveal();
    } catch (e) { console.error("Portfolio load failed", e); }
}

async function addToPortfolio() {
    const symbol = document.getElementById('port-symbol').value.toUpperCase();
    const quantity = document.getElementById('port-qty').value;
    const buy_price = document.getElementById('port-buy').value;
    
    if(!symbol || !quantity || !buy_price) return alert("Fill all fields");

   await fetch(`${API}/portfolio`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
    },
        body: JSON.stringify({symbol, quantity, buy_price}) // Sending quantity to backend
    });
    
    // Clear inputs
    document.getElementById('port-symbol').value = '';
    document.getElementById('port-qty').value = '';
    document.getElementById('port-buy').value = '';
    
    loadPortfolio();
}
function quickAnalyze(symbol) {
    document.getElementById('symbol').value = symbol;
    switchTab('market');
    analyzeStock(); // Triggers the chart for that specific stock
}
window.onload = initApp;

async function deleteStock(symbol) {
    if (!confirm(`Are you sure you want to remove ${symbol} from your portfolio?`)) return;

    try {
        const res = await fetch(`${API}/portfolio/${symbol}`, {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
    }
});

        if (res.ok) {
            // Smoothly remove from UI
            const card = document.getElementById(`card-${symbol}`);
            card.style.transform = "scale(0.8)";
            card.style.opacity = "0";
            setTimeout(() => {
                loadPortfolio(); // Refresh totals and list
            }, 300);
        } else {
            const err = await res.json();
            alert(err.error || "Failed to delete.");
        }
    } catch (e) {
        console.error("Delete failed", e);
    }
}