"""Test the backend API directly to check if it returns data for 2025-11-19."""

import requests
import os
from dotenv import load_dotenv

load_dotenv('../server/.env')

# Get JWT token (you'll need a valid token from the frontend)
# For now, let's just test with the user's actual token
# You can get this from localStorage in the browser console

print("\n🔍 Testing Backend API Endpoint")
print("=" * 60)

api_url = "http://localhost:5000/api/metrics/2025-11-19"

# You'll need to provide a valid JWT token
# Get it from browser localStorage: localStorage.getItem('health_metrics_token')
token = input("\nEnter your JWT token (from browser localStorage): ").strip()

if not token:
    print("❌ No token provided. Exiting.")
    exit(1)

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

print(f"\n📡 Making request to: {api_url}")
print(f"🔑 Using token: {token[:20]}...")

try:
    response = requests.get(api_url, headers=headers)
    
    print(f"\n📊 Response Status: {response.status_code}")
    print(f"📦 Response Body:")
    print(response.json())
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    if hasattr(e, 'response'):
        print(f"Response: {e.response.text}")
