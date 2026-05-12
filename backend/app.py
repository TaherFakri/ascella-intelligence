from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import yfinance as yf
import numpy as np
from sklearn.linear_model import LinearRegression
import sqlite3
import os
import certifi
os.environ['SSL_CERT_FILE'] = certifi.where()
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')

from prediction_service import predict_future_prices, generate_insights

app.config['JWT_SECRET'] = "super_jwt_secret_2026"
app.config['JWT_EXPIRATION_HOURS'] = 24



# Replace with your actual GitHub Pages URL
# In backend/app.py
CORS(
    app,
    resources={r"/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://taherfakri.github.io"
        ]
    }}
)
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
                hist = stock.history(period="6mo")
                if hist.empty: continue
                prices = hist["Close"].tolist()
                
                days_ahead = 5 if category == "Short-Term" else 180
                preds = predict_future_prices(prices, days_ahead)
                cur_p = prices[-1]
                pred_p = preds[-1]
                
                profit_pct = ((pred_p - cur_p) / cur_p) * 100
                insights = generate_insights(hist)
                
                status = insights['sentiment']
                hold_time = "5-10 Days" if category == "Short-Term" else "6-12 Months"
                desc = f"AI Target: ${round(pred_p, 2)}. Risk: {insights['volatility']}. Confidence: {insights['confidence']}/100"
                c.execute("INSERT OR REPLACE INTO stocks VALUES (?, ?, ?, ?, ?, ?)", 
                          (symbol, round(cur_p, 2), round(pred_p, 2), status, desc, category))
            except Exception as e:
                print(f"Error scanning {symbol}: {e}")
                continue
    conn.commit()
    conn.close()

init_db()
scan_market()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Token missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != "Bearer":
            return jsonify({"error": "Invalid token format"}), 401

        token = parts[1]

        try:
            data = jwt.decode(
                token,
                app.config['JWT_SECRET'],
                algorithms=["HS256"]
            )
            current_user = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated

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
    user = conn.execute(
        "SELECT * FROM users WHERE username=?",
        (data['username'],)
    ).fetchone()
    conn.close()

    if user and check_password_hash(user[2], data['password']):
        payload = {
            "username": user[1],
            "exp": datetime.utcnow() + timedelta(
                hours=app.config['JWT_EXPIRATION_HOURS']
            )
        }

        token = jwt.encode(
            payload,
            app.config['JWT_SECRET'],
            algorithm="HS256"
        )

        return jsonify({
            "username": user[1],
            "token": token
        }), 200

    return jsonify({"error": "Failed"}), 401

@app.route("/analyze", methods=["POST"])
def analyze():
    symbol = request.json.get('symbol', '').upper()
    try:
        stock = yf.Ticker(symbol)
        hist_1y = stock.history(period="1y")
        if hist_1y.empty: return jsonify({"error": "No data"}), 400

        # 1. Monthly View (Last 30 days) + 5 Day Prediction
        short_hist = hist_1y['Close'].tail(30).tolist()
        short_dates = hist_1y.index[-30:].strftime('%Y-%m-%d').tolist()
        short_pred = predict_future_prices(short_hist, 5)
        
        # 2. Yearly View + 1 Year Prediction
        long_hist = hist_1y['Close'].tolist()
        long_dates = hist_1y.index.strftime('%Y-%m-%d').tolist()
        long_pred = predict_future_prices(long_hist, 252)
        
        # 3. AI Insights
        insights = generate_insights(hist_1y)

        return jsonify({
            "symbol": symbol,
            "short": {"history": short_hist, "dates": short_dates, "prediction": short_pred},
            "long": {"history": long_hist, "dates": long_dates, "prediction": long_pred},
            "insights": insights
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
@token_required
def manage_portfolio(user):
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
@token_required
def delete_position(user, symbol):
    conn = sqlite3.connect('market.db')
    conn.execute(
        "DELETE FROM portfolio WHERE username=? AND symbol=?",
        (user, symbol.upper())
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Deleted successfully"}), 200

# Catch-all route to serve the React SPA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        if os.path.exists(app.static_folder + '/index.html'):
            return send_from_directory(app.static_folder, 'index.html')
        return "Frontend build not found.", 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host='0.0.0.0', port=port, debug=True)