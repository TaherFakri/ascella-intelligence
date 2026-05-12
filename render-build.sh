#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing frontend dependencies..."
npm install --prefix frontend

echo "Building frontend..."
npm run build --prefix frontend

echo "Installing backend dependencies..."
pip install -r backend/requirements.txt
