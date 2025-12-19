#!/bin/bash

# Finopt Setup Test Script
# Tests if your Finopt setup is working correctly

set -e

echo "🧪 Finopt Setup Test"
echo "===================="
echo ""

BASE_URL="http://localhost:8000"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3

    echo -n "Testing $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $response)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check if Docker is running
echo "Checking Docker..."
if ! docker ps &> /dev/null; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if containers are running
echo "Checking containers..."
api_running=$(docker-compose ps -q api 2>/dev/null)
if [ -z "$api_running" ]; then
    echo -e "${RED}✗ API container is not running${NC}"
    echo "Run: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ API container is running${NC}"

worker_running=$(docker-compose ps -q worker 2>/dev/null)
if [ -z "$worker_running" ]; then
    echo -e "${YELLOW}⚠ Worker container is not running${NC}"
else
    echo -e "${GREEN}✓ Worker container is running${NC}"
fi

redis_running=$(docker-compose ps -q redis 2>/dev/null)
if [ -z "$redis_running" ]; then
    echo -e "${RED}✗ Redis container is not running${NC}"
else
    echo -e "${GREEN}✓ Redis container is running${NC}"
fi
echo ""

# Wait for API to be ready
echo "Waiting for API to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}✗ API did not start in time${NC}"
        echo "Check logs: docker-compose logs api"
        exit 1
    fi
    sleep 1
done
echo ""

# Run tests
echo "Running API tests..."
echo ""

test_endpoint "Health check" "$BASE_URL/health" "200"
test_endpoint "Root endpoint" "$BASE_URL/" "200"
test_endpoint "API docs" "$BASE_URL/docs" "200"
test_endpoint "OpenAPI spec" "$BASE_URL/openapi.json" "200"

echo ""
echo "Testing authentication endpoints..."
test_endpoint "Auth endpoints exist" "$BASE_URL/api/v1/auth/signup" "422"  # 422 because no body provided

echo ""
echo "===================="
echo "Test Results:"
echo -e "${GREEN}✓ Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}✗ Failed: $TESTS_FAILED${NC}"
else
    echo -e "${GREEN}✓ Failed: 0${NC}"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your setup is working correctly.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create a user: curl -X POST $BASE_URL/api/v1/auth/signup ..."
    echo "2. Visit API docs: $BASE_URL/docs"
    echo "3. Start mobile app: cd apps/mobile && npm start"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "- Check logs: docker-compose logs -f"
    echo "- Verify .env file: cat apps/api/.env"
    echo "- Restart services: docker-compose restart"
    echo ""
    exit 1
fi
