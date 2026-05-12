import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def calculate_rsi(data, periods=14):
    close_delta = data.diff()
    up = close_delta.clip(lower=0)
    down = -1 * close_delta.clip(upper=0)
    ma_up = up.rolling(window=periods, min_periods=1).mean()
    ma_down = down.rolling(window=periods, min_periods=1).mean()
    rsi = ma_up / (ma_down + 1e-10) # avoid division by zero
    rsi = 100 - (100/(1 + rsi))
    return rsi

def calculate_macd(data, slow=26, fast=12, signal=9):
    ema_fast = data.ewm(span=fast, adjust=False).mean()
    ema_slow = data.ewm(span=slow, adjust=False).mean()
    macd = ema_fast - ema_slow
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd, signal_line

def predict_future_prices(hist_prices, days_ahead):
    """
    Advanced prediction logic combining Linear Regression with
    momentum/volatility dampening to avoid negative or absurd prices.
    """
    if len(hist_prices) < 5:
        # Not enough data
        return [hist_prices[-1]] * days_ahead

    y = np.array(hist_prices).reshape(-1, 1)
    x = np.arange(len(y)).reshape(-1, 1)
    
    # Recent trend (last 30 days or available) to weight recent movement
    recent_period = min(30, len(y))
    y_recent = y[-recent_period:]
    x_recent = x[-recent_period:]
    
    model = LinearRegression().fit(x, y)
    model_recent = LinearRegression().fit(x_recent, y_recent)
    
    future_idx = np.arange(len(y), len(y) + days_ahead).reshape(-1, 1)
    pred_global = model.predict(future_idx).flatten()
    pred_recent = model_recent.predict(future_idx).flatten()
    
    # Blend global and recent models
    pred_blended = (pred_global * 0.3) + (pred_recent * 0.7)
    
    # Volatility and clamping
    current_price = hist_prices[-1]
    std_dev = np.std(hist_prices)
    max_reasonable_up = current_price + (std_dev * (days_ahead / 10))
    min_reasonable_down = max(current_price * 0.1, current_price - (std_dev * (days_ahead / 10)))
    
    final_preds = []
    for p in pred_blended:
        clamped_p = max(min(p, max_reasonable_up), min_reasonable_down)
        final_preds.append(round(float(clamped_p), 2))
        
    return final_preds

def generate_insights(df):
    """
    Generates confidence scores, technical indicators, and sentiment based on historical data.
    """
    if df.empty or len(df) < 30:
        return {"confidence": 50, "sentiment": "Neutral", "volatility": "Medium"}
        
    close_prices = df['Close']
    current_price = close_prices.iloc[-1]
    
    # Calculate indicators
    rsi = calculate_rsi(close_prices).iloc[-1]
    macd, signal = calculate_macd(close_prices)
    macd_val = macd.iloc[-1]
    sig_val = signal.iloc[-1]
    
    # Moving Averages
    ma20 = close_prices.rolling(window=20, min_periods=1).mean().iloc[-1]
    ma50 = close_prices.rolling(window=50, min_periods=1).mean().iloc[-1]
    
    # Confidence and Sentiment Logic
    score = 50
    sentiment = "Neutral"
    
    # Trend Analysis
    if current_price > ma20 and ma20 > ma50: 
        score += 15
    elif current_price < ma20 and ma20 < ma50:
        score -= 15
        
    # Overbought / Oversold
    if rsi < 30: score += 15
    elif rsi > 70: score -= 15
    
    # Momentum
    if macd_val > sig_val and macd_val > 0: score += 10
    elif macd_val < sig_val and macd_val < 0: score -= 10
    
    score = max(10, min(95, score)) # Clamp between 10 and 95
    
    if score >= 80: sentiment = "Strong Bullish"
    elif score >= 65: sentiment = "Bullish"
    elif score <= 20: sentiment = "Strong Bearish"
    elif score <= 35: sentiment = "Bearish"
    else: sentiment = "Neutral"
    
    volatility = np.std(close_prices.tail(20)) / current_price
    vol_label = "High" if volatility > 0.05 else "Low" if volatility < 0.02 else "Medium"
    
    return {
        "confidence": score,
        "sentiment": sentiment,
        "volatility": vol_label,
        "rsi": round(rsi, 2),
        "ma20": round(ma20, 2),
        "ma50": round(ma50, 2)
    }
