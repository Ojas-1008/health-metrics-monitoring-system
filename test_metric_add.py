import requests
import json
import sys

API_URL = "http://localhost:5000/api"

def login(email, password):
    response = None
    try:
        response = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
        if response.status_code == 401:
            print("Login failed, trying to register...")
            reg_response = requests.post(f"{API_URL}/auth/register", json={
                "name": "Test User",
                "email": email,
                "password": password,
                "confirmPassword": password
            })
            if reg_response.status_code == 201 or reg_response.status_code == 200:
                print("Registration successful, logging in...")
                response = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
            else:
                print(f"Registration failed: {reg_response.text}")
                sys.exit(1)
        
        response.raise_for_status()
        return response.json()['token']
    except Exception as e:
        print(f"Login failed: {e}")
        if response:
            print(response.text)
        sys.exit(1)

def add_metric(token, steps, calories):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "date": "2025-11-21", # Use a fixed date for testing or today
        "metrics": {
            "steps": steps,
            "calories": calories,
            "distance": 5.5,
            "sleepHours": 7.5,
            "weight": 70.5
        }
    }
    # Use today's date
    from datetime import date
    data['date'] = date.today().isoformat()
    
    try:
        response = requests.post(f"{API_URL}/metrics", json=data, headers=headers)
        response.raise_for_status()
        print(f"Metric added: {response.json()}")
    except Exception as e:
        print(f"Add metric failed: {e}")
        if response:
            print(response.text)
        sys.exit(1)

if __name__ == "__main__":
    token = login("test_analytics_v2@example.com", "password123")
    add_metric(token, 9000, 2300)
