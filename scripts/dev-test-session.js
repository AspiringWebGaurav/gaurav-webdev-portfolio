#!/usr/bin/env node

/**
 * Development Testing Script
 * Tests the session API endpoints and provides debugging information
 */

const { exec } = require('child_process');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 'ERROR', data: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', data: 'Request timed out' });
    });

    req.end();
  });
}

async function runTests() {
  log('\n🔧 Development Session API Testing\n', 'blue');
  
  const endpoints = [
    { path: '/api/session/generate', name: 'Session Generate' },
    { path: '/api/session/validate', name: 'Session Validate' },
    { path: '/api/session/simple', name: 'Simple Session' }
  ];

  for (const endpoint of endpoints) {
    log(`Testing ${endpoint.name}...`, 'yellow');
    
    const result = await testEndpoint(endpoint.path);
    
    if (result.status === 200) {
      log(`✅ ${endpoint.name}: Status ${result.status} - OK`, 'green');
      if (result.data.service) {
        log(`   Service: ${result.data.service}`, 'blue');
        log(`   Description: ${result.data.description}`, 'blue');
      }
    } else if (result.status === 405) {
      log(`❌ ${endpoint.name}: Still returning 405 - GET endpoint not working`, 'red');
    } else {
      log(`⚠️  ${endpoint.name}: Status ${result.status}`, 'yellow');
      log(`   Response: ${JSON.stringify(result.data)}`, 'yellow');
    }
    
    console.log('');
  }

  // Test main page
  log('Testing main page...', 'yellow');
  const mainPage = await testEndpoint('/');
  if (mainPage.status === 200) {
    log('✅ Main page: Status 200 - OK', 'green');
  } else {
    log(`⚠️  Main page: Status ${mainPage.status}`, 'yellow');
  }

  log('\n🎯 Testing Summary:', 'blue');
  log('- All endpoints should return 200 for GET requests in development', 'blue');
  log('- Session generation should be faster and more reliable', 'blue');
  log('- Hard refresh should no longer be required on first load', 'blue');
  log('\n💡 To test the full functionality:', 'yellow');
  log('1. Start your dev server: npm run dev', 'yellow');
  log('2. Open http://localhost:3000 in your browser', 'yellow');
  log('3. Check browser console for session generation logs', 'yellow');
  log('4. Verify no hard refresh is needed\n', 'yellow');
}

// Check if dev server is running
function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/session/generate`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const isRunning = await checkDevServer();
  
  if (!isRunning) {
    log('⚠️  Development server is not running on localhost:3000', 'red');
    log('Please start your dev server first: npm run dev\n', 'yellow');
    return;
  }
  
  await runTests();
}

main().catch(console.error);