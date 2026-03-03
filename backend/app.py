from flask import Flask, request, jsonify, session
from flask_cors import CORS
import yfinance as yf
import numpy as np
from sklearn.linear_model import LinearRegression
import sqlite3
import os
import datetime
from datetime import timedelta
import certifi
os.environ['SSL_CERT_FILE'] = certifi.where()
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "alpha_secret_2026" 
# Update this line in app.py
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000"])
# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect('market.db')
    c = conn.cursor()

    # Stocks table
    c.execute('''
    CREATE TABLE IF NOT EXISTS stocks (
        symbol TEXT PRIMARY KEY,
        price REAL,
        prediction REAL,
        status TEXT,
        desc TEXT,
        category TEXT
    )
    ''')

    # Users table
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        is_premium INTEGER DEFAULT 0
    )
    ''')

    # Portfolio table (UPDATED with quantity)
    c.execute('''
    CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        symbol TEXT,
        quantity REAL,
        buy_price REAL
    )
    ''')

    conn.commit()
    conn.close()


def scan_market():
    market_map = {
        'Short-Term': ['TSLA', 'NVDA', 'AMD', 'META'],
        'Long-Term': ['AAPL', 'MSFT', 'AMZN', 'GOOGL']
    }
    conn = sqlite3.connect('market.db')
    c = conn.cursor()
    for category, tickers in market_map.items():
        for symbol in tickers:
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(period="1mo")
                if hist.empty: continue
                prices = hist["Close"].values.reshape(-1, 1)
                days = np.arange(len(prices)).reshape(-1, 1)
                model = LinearRegression().fit(days, prices)
                cur_p = float(prices[-1][0])
                pred_p = float(model.predict([[len(prices) + 5]])[0][0])
                profit_pct = ((pred_p - cur_p) / cur_p) * 100
                status = "Strong Buy" if (pred_p > cur_p * 1.05) else "Buy" if (pred_p > cur_p) else "Hold"
                hold_time = "5-10 Days" if category == "Short-Term" else "6-12 Months"
                desc = f"AI Target: ${round(pred_p, 2)}. Hold: {hold_time}. Return: {round(profit_pct, 1)}%"
                c.execute("INSERT OR REPLACE INTO stocks VALUES (?, ?, ?, ?, ?, ?)", 
                          (symbol, round(cur_p, 2), round(pred_p, 2), status, desc, category))
            except: continue
    conn.commit()
    conn.close()

init_db()
scan_market()

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    hpw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    try:
        conn = sqlite3.connect('market.db')
        conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", (data['username'], hpw))
        conn.commit()
        return jsonify({"message": "Success"}), 201
    except:
        return jsonify({"error": "Exists"}), 400

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    conn = sqlite3.connect('market.db')
    user = conn.execute("SELECT * FROM users WHERE username=?", (data['username'],)).fetchone()
    if user and check_password_hash(user[2], data['password']):
        session['user'] = user[1]
        return jsonify({"username": user[1]}), 200
    return jsonify({"error": "Failed"}), 401


@app.route("/analyze", methods=["POST"])
def analyze():
    symbol = request.json.get('symbol', '').upper()
    try:
        stock = yf.Ticker(symbol)
        hist_1y = stock.history(period="1y")
        if hist_1y.empty: return jsonify({"error": "No data"}), 400

        # Helper function for regression
        def get_pred(prices_list, days_ahead):
            y = np.array(prices_list).reshape(-1, 1)
            x = np.arange(len(y)).reshape(-1, 1)
            model = LinearRegression().fit(x, y)
            future_idx = np.arange(len(y), len(y) + days_ahead).reshape(-1, 1)
            return model.predict(future_idx).flatten().tolist()

        # 1. Monthly View (Last 30 days) + 5 Day Prediction
        short_hist = hist_1y['Close'].tail(30).tolist()
        short_dates = hist_1y.index[-30:].strftime('%Y-%m-%d').tolist()
        short_pred = get_pred(short_hist, 5)
        
        # 2. Yearly View + 1 Year Prediction
        long_hist = hist_1y['Close'].tolist()
        long_dates = hist_1y.index.strftime('%Y-%m-%d').tolist()
        long_pred = get_pred(long_hist, 252)

        return jsonify({
            "symbol": symbol,
            "short": {"history": short_hist, "dates": short_dates, "prediction": short_pred},
            "long": {"history": long_hist, "dates": long_dates, "prediction": long_pred}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/market-overview")
def overview():
    conn = sqlite3.connect('market.db')
    data = conn.execute("SELECT * FROM stocks").fetchall()
    conn.close()
    return jsonify([{"symbol":r[0],"price":r[1],"pred":r[2],"status":r[3],"desc":r[4],"cat":r[5]} for r in data])

@app.route("/portfolio", methods=["GET", "POST"])

@app.route("/portfolio", methods=["GET", "POST"])
def manage_portfolio():
    user = session.get('user')
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect('market.db')

    # ---- ADD STOCK ----
    if request.method == "POST":
        data = request.get_json()

        symbol = data.get("symbol", "").upper()
        quantity = float(data.get("quantity", 0))
        buy_price = float(data.get("buy_price", 0))

        if not symbol or quantity <= 0 or buy_price <= 0:
            return jsonify({"error": "Invalid input"}), 400

        try:
            # If stock already exists → update quantity
            existing = conn.execute(
                "SELECT quantity FROM portfolio WHERE username=? AND symbol=?",
                (user, symbol)
            ).fetchone()

            if existing:
                new_qty = existing[0] + quantity
                conn.execute(
                    "UPDATE portfolio SET quantity=? WHERE username=? AND symbol=?",
                    (new_qty, user, symbol)
                )
            else:
                conn.execute(
                    "INSERT INTO portfolio (username, symbol, quantity, buy_price) VALUES (?, ?, ?, ?)",
                    (user, symbol, quantity, buy_price)
                )

            conn.commit()
            return jsonify({"msg": "Added"}), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ---- GET PORTFOLIO ----
    rows = conn.execute(
        "SELECT symbol, quantity, buy_price FROM portfolio WHERE username=?",
        (user,)
    ).fetchall()

    results = []
    for r in rows:
        t = yf.Ticker(r[0])
        current = round(t.history(period="1d")['Close'].iloc[-1], 2)

        target = round(r[2] * 1.10, 2)

        results.append({
            "symbol": r[0],
            "quantity": r[1],
            "buy": r[2],
            "current": current,
            "target": target,
            "guidance": "SELL NOW" if current >= target else "HOLD"
        })

    conn.close()
    return jsonify(results)


@app.route('/portfolio/<symbol>', methods=['DELETE'])
def delete_position(symbol):
    user = session.get('user')
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    conn = sqlite3.connect('market.db')
    conn.execute(
        "DELETE FROM portfolio WHERE username=? AND symbol=?",
        (user, symbol.upper())
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Deleted successfully"}), 200

if __name__ == "__main__":
    app.run(port=5050, debug=True)

    