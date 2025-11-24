#!/bin/bash

# Test validator.js comprehensively
echo "===== VALIDATOR.JS TESTING ====="
echo ""

# Pre-authenticated token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGE2NzYwNjI5ZDEyMDAxZjhjY2MwMSIsImlhdCI6MTczMjM4NjY0MCwiZXhwIjoxNzMzMDEwNjQwfQ.xODgGiuJFVTNr6JQKuZNFGcqWLPJW7xBv8r_CKhK8cQ"
PASSED=0
TOTAL=0

test_validator() {
    local name=$1
    local method=$2
    local endpoint=$3
    local body=$4
    local expected=$5
    
    TOTAL=$((TOTAL + 1))
    
    if [ -z "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "http://localhost:5000$endpoint" -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "http://localhost:5000$endpoint" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$body")
    fi
    
    code=$(echo "$response" | tail -1)
    
    if [ "$code" = "$expected" ]; then
        echo "[PASS] $name (HTTP $code)"
        PASSED=$((PASSED + 1))
    else
        echo "[FAIL] $name (got $code, expected $expected)"
    fi
}

echo "Testing Profile Name Validation:"
test_validator "Valid name" "PUT" "/api/auth/profile" '{"name":"John Smith"}' "200"
test_validator "Name too short" "PUT" "/api/auth/profile" '{"name":"J"}' "400"
test_validator "Name with numbers" "PUT" "/api/auth/profile" '{"name":"John123"}' "400"

echo ""
echo "Testing Goals Validation:"
test_validator "Valid goals" "PUT" "/api/auth/profile" '{"goals":{"stepGoal":10000}}' "200"
test_validator "Step goal too high" "PUT" "/api/auth/profile" '{"goals":{"stepGoal":60000}}' "400"
test_validator "Sleep goal too low" "PUT" "/api/auth/profile" '{"goals":{"sleepGoal":2}}' "400"

echo ""
echo "Testing Metrics Validation:"
TODAY=$(date +%Y-%m-%d)
test_validator "Valid metrics" "POST" "/api/metrics" "{\"date\":\"$TODAY\",\"metrics\":{\"steps\":8000}}" "200"
test_validator "Invalid date format" "POST" "/api/metrics" '{"date":"13-11-2025","metrics":{"steps":8000}}' "400"
test_validator "Empty metrics" "POST" "/api/metrics" "{\"date\":\"$TODAY\",\"metrics\":{}}" "400"

echo ""
echo "===== SUMMARY ====="
echo "Total: $TOTAL | Passed: $PASSED | Failed: $((TOTAL - PASSED))"
