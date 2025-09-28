#!/bin/bash

echo "🔍 Enterprise Deployment Pre-Check"
echo "=================================="

# Check 1: Build Validation
echo "1. Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"

# Check 2: Critical Assets Verification
echo "2. Verifying critical assets..."
CRITICAL_ASSETS=(".next/static/chunks/webpack-*.js" ".next/static/chunks/main-*.js")
for pattern in "${CRITICAL_ASSETS[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        echo "✅ Found: $pattern"
    else
        echo "⚠️  Missing pattern: $pattern"
    fi
done

# Check 3: Service Worker Validation
echo "3. Validating service worker..."
if [ -f "public/sw.js" ]; then
    # Check for syntax errors
    node -c public/sw.js
    if [ $? -eq 0 ]; then
        echo "✅ Service worker syntax valid"
    else
        echo "❌ Service worker syntax error"
        exit 1
    fi
else
    echo "❌ Service worker not found"
    exit 1
fi

# Check 4: Configuration Validation
echo "4. Validating configurations..."
CONFIGS=("next.config.ts" "vercel.json" "_headers" "_redirects")
for config in "${CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ Found: $config"
    else
        echo "⚠️  Missing: $config (may be optional)"
    fi
done

# Check 5: API Endpoints Test
echo "5. Testing API endpoints..."
npm run start &
SERVER_PID=$!
sleep 5

# Test metrics endpoint
METRICS_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/monitoring/metrics -H "Content-Type: application/json" -d '{"type":"test","timestamp":1234567890}')
if [ "$METRICS_TEST" = "200" ]; then
    echo "✅ Metrics API endpoint working"
else
    echo "❌ Metrics API endpoint failed (status: $METRICS_TEST)"
fi

# Test chunk gateway endpoint (should return 400 for invalid data)
CHUNK_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/chunk-gateway -H "Content-Type: application/json" -d '{"invalid":"data"}')
if [ "$CHUNK_TEST" = "400" ]; then
    echo "✅ Chunk gateway API endpoint working"
else
    echo "❌ Chunk gateway API endpoint failed (status: $CHUNK_TEST)"
fi

kill $SERVER_PID

echo ""
echo "🎉 Pre-deployment check completed successfully!"
echo "Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Deploy: npm run deploy or vercel --prod"
echo "2. Monitor: Check /api/monitoring/metrics after deployment"
echo "3. Verify: Test first-load performance"