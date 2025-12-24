#!/usr/bin/env node
import { createHash } from 'crypto';

const BASE_URL = 'http://localhost:3000';
const colors = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m' };

function log(emoji, msg, color = colors.reset) { console.log(`${color}${emoji} ${msg}${colors.reset}`); }
function success(msg) { log('✅', msg, colors.green); results.passed++; }
function error(msg) { log('❌', msg, colors.red); results.failed++; }
function info(msg) { log('ℹ️', msg, colors.blue); }
function warn(msg) { log('⚠️', msg, colors.yellow); }
function section(title) { console.log(`\n${colors.cyan}${'='.repeat(60)}\n${title}\n${'='.repeat(60)}${colors.reset}\n`); }

const results = { passed: 0, failed: 0, tests: [] };
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function generateFingerprint(seed) {
  return createHash('sha256').update(`visitor_${seed}`).digest('hex').substring(0, 32);
}

function generateMask(fingerprint) {
  return `device_${createHash('sha256').update(fingerprint).digest('hex').substring(0, 10)}`;
}

const state = {
  visitor1: { fp: null, mask: null, sessionId: null, messages: [] },
  visitor2: { fp: null, mask: null, sessionId: null, messages: [] },
};

async function testSessionCreation() {
  section('TEST 1: Session Creation with Turnstile Bypass');
  
  state.visitor1.fp = generateFingerprint(Date.now());
  state.visitor1.mask = generateMask(state.visitor1.fp);
  
  info(`Fingerprint: ${state.visitor1.fp.substring(0, 16)}...`);
  info(`Mask: ${state.visitor1.mask}`);
  
  // Step 1: Register visitor identity via UUID-sync
  info('Registering visitor identity...');
  const identityRes = await fetch(`${BASE_URL}/api/visitor-analytics/identify-enhanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
    body: JSON.stringify({
      fingerprint: state.visitor1.fp,
      visitorData: {
        userAgent: 'TestBot/1.0',
        language: 'en-US',
        platform: 'Linux',
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        canvas: 'test-canvas-hash',
        webgl: 'test-webgl-hash'
      }
    }),
  });
  
  const identityData = await identityRes.json();
  
  if (identityRes.ok && identityData.mask) {
    state.visitor1.mask = identityData.mask;
    success('Visitor identity registered');
    info(`UUID-sync mask: ${state.visitor1.mask}`);
  } else {
    error('Failed to register visitor identity');
    info(`Response: ${JSON.stringify(identityData)}`);
  }
  
  await delay(500);
  
  // Step 2: Create bubble session
  info('Creating bubble session...');
  const res = await fetch(`${BASE_URL}/api/bubble/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
    body: JSON.stringify({
      mask: state.visitor1.mask,
      fingerprint: state.visitor1.fp,
      turnstileToken: 'TEST_TOKEN'
    }),
  });
  
  const data = await res.json();
  
  if (res.ok && data.success && data.session?.id) {
    state.visitor1.sessionId = data.session.id;
    success('Session created successfully');
    success('Turnstile bypass working (x-test-mode header)');
    info(`Session ID: ${state.visitor1.sessionId}`);
  } else {
    error('Session creation failed');
    error(`Status: ${res.status}, Error: ${data.error || 'Unknown'}`);
    if (data.code === 'CAPTCHA_REQUIRED') {
      error('Turnstile bypass NOT working!');
    }
  }
  
  results.tests.push('Session Creation');
}

async function testSendMessages() {
  section('TEST 2: Send Multiple Messages');
  
  if (!state.visitor1.sessionId) {
    warn('Skipping - no session');
    return;
  }
  
  const messages = ['Hello!', 'Testing bubble chat', 'Is this working?'];
  
  for (const content of messages) {
    const payload = {
      sessionId: state.visitor1.sessionId,
      role: 'visitor',
      content,
      fingerprint: state.visitor1.fingerprint,
      mask: state.visitor1.mask
    };
    
    info(`Sending: ${content}`);
    info(`Payload: ${JSON.stringify(payload)}`);
    
    const res = await fetch(`${BASE_URL}/api/bubble/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    
    if (res.ok && (data.success || data.message?.id || data.id)) {
      success(`Message sent: "${content}"`);
      state.visitor1.messages.push(data.message || data);
    } else {
      error(`Failed to send: "${content}" - ${data.error || 'Unknown error'}`);
      info(`Status: ${res.status}`);
      info(`Response: ${JSON.stringify(data)}`);
      info(`Request payload: ${JSON.stringify(payload)}`);
    }
    
    await delay(300);
  }
  
  results.tests.push('Send Messages');
}

async function testFetchMessages() {
  section('TEST 3: Fetch Messages');
  
  if (!state.visitor1.sessionId) {
    warn('Skipping - no session');
    return;
  }
  
  const res = await fetch(
    `${BASE_URL}/api/bubble/messages?sessionId=${state.visitor1.sessionId}&role=visitor`
  );
  
  const data = await res.json();
  
  if (res.ok && (data.success || Array.isArray(data.messages))) {
    success(`Fetched ${data.messages?.length || 0} messages`);
    info(`Admin online: ${data.adminOnline || false}`);
    info(`Unread count: ${data.visitorUnread || 0}`);
  } else {
    error(`Failed to fetch messages - Status: ${res.status}`);
    info(`Response: ${JSON.stringify(data).substring(0, 150)}`);
  }
  
  results.tests.push('Fetch Messages');
}

async function testTypingIndicator() {
  section('TEST 4: Typing Indicator');
  
  if (!state.visitor1.sessionId) {
    warn('Skipping - no session');
    return;
  }
  
  const res1 = await fetch(`${BASE_URL}/api/bubble/messages/typing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
    body: JSON.stringify({
      sessionId: state.visitor1.sessionId,
      isTyping: true,
      role: 'visitor'
    }),
  });
  
  if (res1.ok) {
    success('Typing indicator ON sent');
  } else {
    const err1 = await res1.json();
    error(`Failed to send typing ON - ${err1.error || 'Unknown'}`);
    info(`Status: ${res1.status}`);
  }
  
  await delay(1000);
  
  const res2 = await fetch(`${BASE_URL}/api/bubble/messages/typing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
    body: JSON.stringify({
      sessionId: state.visitor1.sessionId,
      isTyping: false,
      role: 'visitor'
    }),
  });
  
  if (res2.ok) {
    success('Typing indicator OFF sent');
  } else {
    const err2 = await res2.json();
    error(`Failed to send typing OFF - ${err2.error || 'Unknown'}`);
    info(`Status: ${res2.status}`);
  }
  
  results.tests.push('Typing Indicator');
}

async function testSecondVisitor() {
  section('TEST 5: Multiple Concurrent Sessions');
  
  state.visitor2.fp = generateFingerprint(Date.now() + 1000);
  state.visitor2.mask = generateMask(state.visitor2.fp);
  
  // Register identity first
  const identityRes = await fetch(`${BASE_URL}/api/visitor-analytics/identify-enhanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
    body: JSON.stringify({
      fingerprint: state.visitor2.fp,
      visitorData: {
        userAgent: 'TestBot/2.0',
        language: 'en-US',
        platform: 'Linux',
        screenResolution: '1920x1080',
        timezone: 'America/New_York'
      }
    }),
  });
  
  const identityData = await identityRes.json();
  
  if (identityRes.ok && identityData.mask) {
    state.visitor2.mask = identityData.mask;
  }
  
  await delay(300);
  
  const res = await fetch(`${BASE_URL}/api/bubble/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
    body: JSON.stringify({
      mask: state.visitor2.mask,
      fingerprint: state.visitor2.fp,
      turnstileToken: 'TEST_TOKEN'
    }),
  });
  
  const data = await res.json();
  
  if (res.ok && data.success) {
    state.visitor2.sessionId = data.session.id;
    success('Second visitor session created');
    
    const msgRes = await fetch(`${BASE_URL}/api/bubble/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
      body: JSON.stringify({
        sessionId: state.visitor2.sessionId,
        role: 'visitor',
        content: 'Hi from visitor 2!'
      }),
    });
    
    if (msgRes.ok) {
      success('Second visitor sent message');
    }
  } else {
    error('Failed to create second session');
  }
  
  results.tests.push('Multiple Sessions');
}

async function testStats() {
  section('TEST 6: Chat Statistics');
  
  const res = await fetch(`${BASE_URL}/api/bubble/stats`, {
    headers: { 'x-test-mode': 'true' }
  });
  
  const data = await res.json();
  
  if (res.ok && (data.success || data.totalVisitors !== undefined)) {
    success('Stats fetched successfully');
    info(`Total visitors: ${data.totalVisitors || 0}`);
    info(`Active sessions: ${data.activeSessions || 0}`);
    info(`Total messages: ${data.messagesThisWeek || 0}`);
  } else {
    error(`Failed to fetch stats - Status: ${res.status}`);
    info(`Response: ${JSON.stringify(data).substring(0, 100)}`);
  }
  
  results.tests.push('Statistics');
}

async function testErrorHandling() {
  section('TEST 7: Error Handling');
  
  const res = await fetch(`${BASE_URL}/api/bubble/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
    body: JSON.stringify({
      sessionId: 'invalid_session_id',
      role: 'visitor',
      content: 'This should fail'
    }),
  });
  
  const data = await res.json();
  
  if (!res.ok && !data.success) {
    success('Invalid session properly rejected');
    info(`Error: ${data.error}`);
  } else {
    error('Should have rejected invalid session');
  }
  
  results.tests.push('Error Handling');
}

async function runTests() {
  console.log('\n');
  log('🚀', 'Bubble Chat Live Integration Tests', colors.cyan);
  log('🌐', `Target: ${BASE_URL}`, colors.cyan);
  console.log('\n');
  
  const start = Date.now();
  
  await testSessionCreation();
  await testSendMessages();
  await testFetchMessages();
  await testTypingIndicator();
  await testSecondVisitor();
  await testStats();
  await testErrorHandling();
  
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  
  section('TEST RESULTS');
  console.log(`\nDuration: ${duration}s\n`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`📊 Total: ${results.passed + results.failed}\n`);
  
  console.log('Tests Completed:');
  results.tests.forEach((test, i) => console.log(`  ${i + 1}. ${test}`));
  
  console.log('\n');
  
  const rate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  
  if (results.failed === 0) {
    log('🎉', `ALL TESTS PASSED! (${rate}% success)`, colors.green);
  } else if (rate >= 70) {
    log('⚠️', `MOSTLY PASSED (${rate}% success)`, colors.yellow);
  } else {
    log('💥', `TESTS FAILED (${rate}% success)`, colors.red);
  }
  
  console.log('\n');
  
  if (state.visitor1.sessionId) {
    info('Test Session Info:');
    console.log(`  Visitor 1: ${state.visitor1.sessionId}`);
    console.log(`  Mask: ${state.visitor1.mask}`);
    if (state.visitor2.sessionId) {
      console.log(`  Visitor 2: ${state.visitor2.sessionId}`);
    }
    console.log('\n');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('\n');
  error(`Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
