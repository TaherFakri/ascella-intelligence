# 🌌 ASCELLA INTELLIGENCE

### Autonomous Market Signal Engine

<p align="center">
  <img src="https://img.shields.io/badge/System-Operational-00ffcc?style=for-the-badge">
  <img src="https://img.shields.io/badge/AI-Regression%20Model-9d50bb?style=for-the-badge">
  <img src="https://img.shields.io/badge/Auth-JWT%20Secured-0066ff?style=for-the-badge">
  <img src="https://img.shields.io/badge/Deployment-Render-black?style=for-the-badge">
</p>

---

> *Precision-driven market intelligence powered by algorithmic forecasting.*

Ascella Intelligence is a full-stack AI-powered investment analysis platform engineered for:

* Real-time market evaluation
* Predictive modeling
* Portfolio performance intelligence
* Secure stateless authentication

Built for cross-domain scalability. Designed for modern web architecture.

---

# 🧠 SYSTEM ARCHITECTURE

```mermaid
flowchart LR
    A[Client Interface<br>GitHub Pages] -->|Secure REST| B[Ascella Core API<br>Render]
    B --> C[(SQLite Storage)]
    B --> D[yFinance Data Stream]
    B --> E[Regression Engine]
```

---

# 🔐 AUTHENTICATION PROTOCOL

Ascella uses **stateless JWT authentication**.

No cookies.
No session storage.
No browser compatibility issues.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API

    User->>Frontend: Credentials
    Frontend->>API: POST /login
    API-->>Frontend: JWT Token
    Frontend->>API: Authorization: Bearer TOKEN
    API-->>Frontend: Protected Data
```

---

# 📡 LIVE SYSTEM

### 🌍 Interface

https://taherfakri.github.io/ascella-intelligence/

### ⚙ Core API

https://ascella-intelligence.onrender.com

> All protected endpoints require valid JWT authorization.

---

# 📊 MARKET SIGNAL ENGINE

Ascella performs:

1. 1-Year historical data acquisition
2. Regression model fitting
3. Short-term and long-term projection
4. AI-driven BUY / HOLD / SELL evaluation

```mermaid
flowchart TD
    A[Fetch Historical Data]
    B[Transform Price Series]
    C[Train Linear Model]
    D[Generate Forecast]
    E[Return Structured Signal]

    A --> B --> C --> D --> E
```

---

# 💼 PORTFOLIO INTELLIGENCE

For each position:

* Live market valuation
* Unrealized P/L calculation
* Target price estimation
* AI exit guidance

System output:

```
SYMBOL | QUANTITY | CURRENT | TARGET | GUIDANCE
```

---

# ⚙ TECHNOLOGY STACK

**Core Engine**

* Flask
* PyJWT
* scikit-learn
* yfinance
* SQLite

**Interface**

* Vanilla JS
* Chart.js
* Intersection Observer animations

**Infrastructure**

* Render (API hosting)
* GitHub Pages (Frontend delivery)
* Gunicorn (WSGI)

---

# 🛰 DEPLOYMENT CONFIGURATION

Backend start command:

```
gunicorn app:app
```

Root directory:

```
backend
```

---

# 🧩 PROJECT STRUCTURE

```
ascella-intelligence/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── market.db
│
├── index.html
├── script.js
└── styles.css
```

---

# 🔒 SECURITY MODEL

* JWT-based stateless verification
* Header-based authorization
* Token expiration (24h)
* Cross-origin compatible architecture

Built to avoid:

* Third-party cookie issues
* Safari ITP conflicts
* Session persistence complexity

---

# 🌠 FUTURE EVOLUTION

* Deep Learning forecasting (LSTM / Transformers)
* Real-time WebSocket streaming
* Portfolio risk scoring
* Multi-user scaling (PostgreSQL migration)
* Cloud-native microservice architecture

---

# 🧑‍🚀 AUTHOR

**Taher Fakhri**
AI Systems Engineer • Full-Stack Developer

---

<p align="center">
  <em>Engineered for signal clarity. Built for autonomous precision.</em>
</p>
