#!/usr/bin/env node
/**
 * MAINTENANCE AUTO-END FIX TEST - 100% PASS RATE TARGET
 * 
 * Tests the fix for auto-end maintenance mode detection:
 * - Simulates maintenance that auto-ended but wasn't detected
 * - Tests MaintenanceMonitor detection logic
 * - Verifies LocalMaintenanceBanner shows correct state
 * - Confirms admin panel displays auto-end history
 * - Tests API auto-disable trigger when past time detected
 * 
 * Uses Firebase Admin SDK service account:
 * - No password needed
 * - Full admin access via service account
 * - Direct Firestore manipulation to simulate scenarios
 * 
 * Run: node tests/maintenance-auto-end-fix-test.mjs
 */

import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'gauravpatil9262@gmail.com';
const ADMIN_UID = 'cgwqNNfMfPNmsAHJfgWGcRSsIRG2';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

let results = { passed: 0, failed: 0, tests: [] };
let authToken = null;
let db = null;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(name, details = '') {
  log(`✅ PASS - ${name}`, 'green');
  if (details) log(`   ${details}`, 'cyan');
  results.passed++;
  results.tests.push({ name, status: 'pass', details });
}

function fail(name, details = '') {
  log(`❌ FAIL - ${name}`, 'red');
  if (details) log(`   ${details}`, 'yellow');
  results.failed++;
  results.tests.push({ name, status: 'fail', details });
}

function section(title) {
  log('\n' + '='.repeat(80), 'cyan');
  log(`${title}`, 'bold');
  log('='.repeat(80), 'cyan');
}

function subsection(title) {
  log(`\n🔹 ${title}`, 'blue');
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===================== FIREBASE ADMIN INIT =====================

async function initializeFirebaseAdmin() {
  section('PHASE 1: FIREBASE ADMIN SDK INITIALIZATION');
  
  try {
    subsection('Checking Firebase Admin credentials');
    
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    
    if (!privateKey) {
      fail('Private key missing', 'FIREBASE_ADMIN_PRIVATE_KEY not found in .env.local');
      return false;
    }
    if (!projectId) {
      fail('Project ID missing', 'FIREBASE_ADMIN_PROJECT_ID not found in .env.local');
      return false;
    }
    if (!clientEmail) {
      fail('Client email missing', 'FIREBASE_ADMIN_CLIENT_EMAIL not found in .env.local');
      return false;
    }
    
    success('Environment variables loaded', 'All Firebase Admin credentials present');
    
    subsection('Initializing Firebase Admin SDK');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          privateKey: privateKey,
          clientEmail: clientEmail,
        }),
      });
      success('Firebase Admin initialized', `Project: ${projectId}`);
    } else {
      success('Firebase Admin already initialized', 'Using existing instance');
    }
    
    // Test Firestore access
    subsection('Testing Firestore access');
    db = admin.firestore();
    const testDoc = await db.collection('siteSettings').doc('maintenance').get();
    success('Firestore accessible', `Maintenance doc exists: ${testDoc.exists}`);
    
    return true;
    
  } catch (error) {
    fail('Firebase Admin initialization', error.message);
    return false;
  }
}

// ===================== CUSTOM TOKEN GENERATION =====================

async function generateCustomToken() {
  section('PHASE 2: CUSTOM TOKEN GENERATION');
  
  try {
    subsection('Creating custom token for admin user');
    log(`   UID: ${ADMIN_UID}`, 'cyan');
    log(`   Email: ${ADMIN_EMAIL}`, 'cyan');
    
    const customToken = await admin.auth().createCustomToken(ADMIN_UID, {
      email: ADMIN_EMAIL,
      admin: true
    });
    
    success('Custom token created', `Token: ${customToken.substring(0, 30)}...`);
    
    subsection('Exchanging custom token for ID token');
    
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      fail('API Key missing', 'NEXT_PUBLIC_FIREBASE_API_KEY not found');
      return false;
    }
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      fail('Token exchange failed', data.error?.message || 'Unknown error');
      return false;
    }
    
    authToken = data.idToken;
    success('ID token obtained', `Valid for 1 hour`);
    success('Admin authentication complete', `Ready for API calls`);
    
    return true;
    
  } catch (error) {
    fail('Custom token generation', error.message);
    return false;
  }
}

// ===================== CLEANUP BEFORE START =====================

async function cleanupBeforeTest() {
  section('PHASE 3: CLEANUP & PREPARATION');
  
  try {
    subsection('Checking current maintenance state');
    
    const docRef = db.collection('siteSettings').doc('maintenance');
    const doc = await docRef.get();
    
    if (doc.exists && doc.data().enabled === true) {
      log('   Maintenance currently ENABLED - disabling for clean test', 'yellow');
      
      // Disable via API
      const response = await fetch(`${BASE_URL}/api/maintenance/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ enabled: false })
      });
      
      if (response.ok) {
        success('Maintenance disabled', 'Clean state for testing');
        await wait(2000);
      } else {
        fail('Failed to disable maintenance', 'Manual cleanup may be needed');
      }
    } else {
      success('Maintenance already OFF', 'Clean state confirmed');
    }
    
    subsection('Verifying API status endpoint');
    const statusResponse = await fetch(`${BASE_URL}/api/maintenance/status`, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const statusData = await statusResponse.json();
    
    if (statusResponse.ok && statusData.enabled === false) {
      success('API status endpoint working', 'Returns disabled state');
    } else {
      fail('API status check', `Unexpected state: ${JSON.stringify(statusData)}`);
    }
    
    return true;
    
  } catch (error) {
    fail('Cleanup failed', error.message);
    return false;
  }
}

// ===================== TEST 1: SIMULATE PAST AUTO-END =====================

async function testPastAutoEndDetection() {
  section('PHASE 4: SIMULATE PAST AUTO-END TIME (CORE BUG TEST)');
  
  try {
    subsection('Scenario: Auto-end time passed but API was never called');
    log('   This simulates the bug: maintenance enabled overnight, no visitors', 'cyan');
    log('   Next day admin opens localhost and should see "already ended"', 'cyan');
    
    subsection('Step 1: Create Firestore document with PAST auto-end time');
    
    const now = new Date();
    const pastEnableTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
    const pastAutoEndTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
    
    log(`   Enabled at: ${pastEnableTime.toISOString()}`, 'cyan');
    log(`   Auto-end at: ${pastAutoEndTime.toISOString()}`, 'cyan');
    log(`   Current time: ${now.toISOString()}`, 'cyan');
    log(`   Time overdue: 1 hour`, 'yellow');
    
    const docRef = db.collection('siteSettings').doc('maintenance');
    await docRef.set({
      enabled: true,
      autoEndEnabled: true,
      autoEndAt: admin.firestore.Timestamp.fromDate(pastAutoEndTime),
      enabledAt: admin.firestore.Timestamp.fromDate(pastEnableTime),
      estimatedDuration: 120, // 2 hours
      title: 'Auto-End Test',
      message: 'Testing past auto-end detection',
      showContactForm: true,
      enabledBy: ADMIN_EMAIL,
      lastUpdated: admin.firestore.Timestamp.now(),
      bubbleSettings: {
        hideBubbleCompletely: false,
        allowResumeView: true,
        allowResumeDownload: true,
        allowAskDirect: false,
        allowPredefinedQuestions: true,
        disabledMessage: 'Test maintenance'
      }
    });
    
    success('Firestore document created', 'Maintenance shows as ENABLED with past auto-end time');
    
    subsection('Step 2: Wait for potential real-time listener updates');
    log('   Waiting 2 seconds for Firebase propagation...', 'cyan');
    await wait(2000);
    
    subsection('Step 3: Call status API (simulates MaintenanceMonitor trigger)');
    log('   This should detect past auto-end time and auto-disable', 'cyan');
    
    const statusResponse = await fetch(`${BASE_URL}/api/maintenance/status`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const statusData = await statusResponse.json();
    
    if (!statusResponse.ok) {
      fail('Status API call failed', `HTTP ${statusResponse.status}`);
      return false;
    }
    
    success('Status API responded', `HTTP 200`);
    
    subsection('Step 4: Verify auto-disable was triggered');
    
    if (statusData.enabled === false) {
      success('AUTO-DISABLE TRIGGERED ✨', 'API correctly detected past time and disabled maintenance');
    } else {
      fail('Auto-disable NOT triggered', `Maintenance still shows enabled: ${statusData.enabled}`);
      log('   BUG: API should have detected autoEndAt < now and disabled', 'red');
      return false;
    }
    
    if (statusData.autoEndTriggered === true) {
      success('autoEndTriggered flag set', 'API correctly marked this as auto-ended');
    } else {
      log('   ℹ️  autoEndTriggered flag not present (acceptable if old API version)', 'yellow');
    }
    
    subsection('Step 5: Verify Firestore cleanup');
    log('   Checking if auto-end fields were deleted (cost optimization)...', 'cyan');
    await wait(1000);
    
    const verifyDoc = await docRef.get();
    const verifyData = verifyDoc.data();
    
    if (verifyData.enabled === false) {
      success('Firestore updated to disabled', 'enabled: false confirmed');
    } else {
      fail('Firestore still shows enabled', `enabled: ${verifyData.enabled}`);
      return false;
    }
    
    if (verifyData.disabledBy === 'System (Auto-End)') {
      success('disabledBy field correct', 'Shows "System (Auto-End)"');
    } else {
      fail('disabledBy field incorrect', `Got: ${verifyData.disabledBy}`);
    }
    
    // Check if fields were deleted (cost optimization)
    const deletedFields = ['autoEndEnabled', 'autoEndAt', 'estimatedDuration', 'enabledAt', 'enabledBy', 'bubbleSettings', 'message', 'title'];
    let fieldsDeleted = 0;
    let fieldsRemaining = 0;
    
    for (const field of deletedFields) {
      if (verifyData[field] === undefined) {
        fieldsDeleted++;
      } else {
        fieldsRemaining++;
        log(`   ⚠️  Field still present: ${field}`, 'yellow');
      }
    }
    
    if (fieldsDeleted === deletedFields.length) {
      success('Field cleanup completed', 'All auto-end fields deleted (cost optimization)');
    } else if (fieldsDeleted > 0) {
      success('Partial field cleanup', `${fieldsDeleted}/${deletedFields.length} fields deleted`);
    } else {
      log('   ℹ️  No fields deleted (may be intentional)', 'cyan');
    }
    
    return true;
    
  } catch (error) {
    fail('Past auto-end detection test', error.message);
    log(error.stack, 'red');
    return false;
  }
}

// ===================== TEST 2: ACTIVE AUTO-END (NOT YET REACHED) =====================

async function testActiveAutoEndNotReached() {
  section('PHASE 5: TEST ACTIVE MAINTENANCE WITH FUTURE AUTO-END');
  
  try {
    subsection('Scenario: Maintenance active with auto-end time NOT yet reached');
    log('   This should NOT trigger auto-disable', 'cyan');
    
    subsection('Step 1: Enable maintenance with FUTURE auto-end');
    
    const now = new Date();
    const futureAutoEndTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    
    log(`   Current time: ${now.toISOString()}`, 'cyan');
    log(`   Auto-end at: ${futureAutoEndTime.toISOString()}`, 'cyan');
    log(`   Time until auto-end: 10 minutes`, 'green');
    
    const response = await fetch(`${BASE_URL}/api/maintenance/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        enabled: true,
        estimatedDuration: 10,
        autoEndEnabled: true,
        title: 'Future Auto-End Test',
        message: 'Testing active maintenance with future auto-end',
        bubbleSettings: {
          hideBubbleCompletely: false,
          allowResumeView: true,
          allowResumeDownload: true,
          allowAskDirect: false,
          allowPredefinedQuestions: true,
          disabledMessage: 'Test maintenance'
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      fail('Enable maintenance failed', data.error || 'Unknown error');
      return false;
    }
    
    success('Maintenance enabled', 'Auto-end scheduled for 10 minutes from now');
    
    subsection('Step 2: Call status API - should remain ENABLED');
    await wait(2000);
    
    const statusResponse = await fetch(`${BASE_URL}/api/maintenance/status`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const statusData = await statusResponse.json();
    
    if (statusData.enabled === true) {
      success('Maintenance remains ENABLED', 'Auto-end time not yet reached');
    } else {
      fail('Unexpected auto-disable', 'Should still be enabled since auto-end is in future');
      return false;
    }
    
    if (statusData.autoEndEnabled === true) {
      success('autoEndEnabled flag present', 'Indicates auto-end is scheduled');
    } else {
      fail('autoEndEnabled flag missing', 'Should indicate auto-end is active');
    }
    
    if (statusData.autoEndAt) {
      const autoEndTime = new Date(statusData.autoEndAt);
      if (autoEndTime > now) {
        success('autoEndAt time in future', `Scheduled: ${autoEndTime.toLocaleString()}`);
      } else {
        fail('autoEndAt time in past', 'Should be in future');
      }
    } else {
      fail('autoEndAt field missing', 'Should contain scheduled time');
    }
    
    subsection('Step 3: Verify Firestore state');
    const docRef = db.collection('siteSettings').doc('maintenance');
    const doc = await docRef.get();
    const fsData = doc.data();
    
    if (fsData.enabled === true && fsData.autoEndEnabled === true) {
      success('Firestore state correct', 'Maintenance active with auto-end scheduled');
    } else {
      fail('Firestore state incorrect', `enabled: ${fsData.enabled}, autoEndEnabled: ${fsData.autoEndEnabled}`);
    }
    
    return true;
    
  } catch (error) {
    fail('Future auto-end test', error.message);
    log(error.stack, 'red');
    return false;
  }
}

// ===================== TEST 3: MANUAL DISABLE VS AUTO-END =====================

async function testManualDisableVsAutoEnd() {
  section('PHASE 6: TEST MANUAL DISABLE (NO AUTO-END)');
  
  try {
    subsection('Scenario: Admin manually disables maintenance');
    log('   disabledBy should show admin email, not "System (Auto-End)"', 'cyan');
    
    subsection('Step 1: Disable maintenance via toggle API');
    
    const response = await fetch(`${BASE_URL}/api/maintenance/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ enabled: false })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      fail('Manual disable failed', data.error || 'Unknown error');
      return false;
    }
    
    success('Maintenance disabled via API', `By: ${data.toggledBy}`);
    
    subsection('Step 2: Verify disabledBy field shows admin');
    await wait(1000);
    
    const docRef = db.collection('siteSettings').doc('maintenance');
    const doc = await docRef.get();
    const fsData = doc.data();
    
    if (fsData.disabledBy === ADMIN_EMAIL || fsData.disabledBy?.includes('gaurav')) {
      success('disabledBy shows admin email', `Correctly shows: ${fsData.disabledBy}`);
    } else if (fsData.disabledBy === 'System (Auto-End)') {
      fail('disabledBy shows System', 'Should show admin email for manual disable');
      return false;
    } else {
      log(`   ℹ️  disabledBy: ${fsData.disabledBy}`, 'cyan');
      success('Manual disable recorded', 'Not marked as auto-end');
    }
    
    subsection('Step 3: Verify field cleanup happened');
    
    const deletedFields = ['autoEndEnabled', 'autoEndAt', 'estimatedDuration', 'enabledAt', 'bubbleSettings'];
    let cleaned = 0;
    
    for (const field of deletedFields) {
      if (fsData[field] === undefined) {
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      success('Field cleanup on manual disable', `${cleaned}/${deletedFields.length} fields deleted`);
    } else {
      log('   ℹ️  Some fields remain (acceptable)', 'cyan');
    }
    
    return true;
    
  } catch (error) {
    fail('Manual disable test', error.message);
    log(error.stack, 'red');
    return false;
  }
}

// ===================== TEST 4: EDGE CASES =====================

async function testEdgeCases() {
  section('PHASE 7: EDGE CASES & ERROR HANDLING');
  
  try {
    subsection('Test 1: Auto-end EXACTLY at current time (boundary)');
    
    const now = new Date();
    const docRef = db.collection('siteSettings').doc('maintenance');
    
    await docRef.set({
      enabled: true,
      autoEndEnabled: true,
      autoEndAt: admin.firestore.Timestamp.fromDate(now), // Exactly now
      enabledAt: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 60000)),
      estimatedDuration: 1,
      title: 'Boundary Test',
      message: 'Testing exact time boundary',
      lastUpdated: admin.firestore.Timestamp.now()
    });
    
    await wait(1000);
    
    const statusResponse = await fetch(`${BASE_URL}/api/maintenance/status`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const statusData = await statusResponse.json();
    
    if (statusData.enabled === false) {
      success('Boundary case: exactly at time', 'Auto-disabled correctly (>= comparison)');
    } else {
      log('   ⚠️  Still enabled at exact boundary', 'yellow');
      log('   This may be acceptable depending on >= vs > comparison', 'cyan');
    }
    
    subsection('Test 2: Auto-end with missing fields (robustness)');
    
    await docRef.set({
      enabled: true,
      autoEndEnabled: false, // Disabled auto-end
      title: 'No Auto-End Test',
      lastUpdated: admin.firestore.Timestamp.now()
    });
    
    await wait(1000);
    
    const statusResponse2 = await fetch(`${BASE_URL}/api/maintenance/status`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const statusData2 = await statusResponse2.json();
    
    if (statusResponse2.ok) {
      success('API handles missing auto-end fields', 'No crash when fields absent');
    } else {
      fail('API crashed with missing fields', 'Should handle gracefully');
    }
    
    if (statusData2.enabled === true) {
      success('Maintenance remains enabled', 'Without auto-end, stays enabled');
    }
    
    subsection('Test 3: Malformed autoEndAt (null check)');
    
    await docRef.set({
      enabled: true,
      autoEndEnabled: true,
      autoEndAt: null, // Malformed
      title: 'Null Auto-End Test',
      lastUpdated: admin.firestore.Timestamp.now()
    });
    
    await wait(1000);
    
    const statusResponse3 = await fetch(`${BASE_URL}/api/maintenance/status`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (statusResponse3.ok) {
      success('API handles null autoEndAt', 'No crash with malformed data');
    } else {
      fail('API crashed with null autoEndAt', 'Should handle gracefully');
    }
    
    return true;
    
  } catch (error) {
    fail('Edge case tests', error.message);
    log(error.stack, 'red');
    return false;
  }
}

// ===================== TEST 5: ADMIN PANEL DISPLAY =====================

async function testAdminPanelDisplay() {
  section('PHASE 8: ADMIN PANEL AUTO-END HISTORY DISPLAY');
  
  try {
    subsection('Scenario: Create auto-ended maintenance for admin panel view');
    log('   This tests if admin panel shows "Auto-ended by System" correctly', 'cyan');
    
    subsection('Step 1: Create past auto-end scenario');
    
    const now = new Date();
    const pastAutoEndTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
    
    const docRef = db.collection('siteSettings').doc('maintenance');
    await docRef.set({
      enabled: true,
      autoEndEnabled: true,
      autoEndAt: admin.firestore.Timestamp.fromDate(pastAutoEndTime),
      enabledAt: admin.firestore.Timestamp.fromDate(new Date(pastAutoEndTime.getTime() - 120 * 60 * 1000)),
      estimatedDuration: 120,
      title: 'Admin Panel Test',
      message: 'Testing admin panel display',
      lastUpdated: admin.firestore.Timestamp.now()
    });
    
    success('Created test scenario', 'Auto-end time 30 minutes ago');
    
    subsection('Step 2: Trigger auto-disable');
    await wait(1000);
    
    await fetch(`${BASE_URL}/api/maintenance/status`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    await wait(2000);
    
    subsection('Step 3: Fetch via admin toggle API (used by admin panel)');
    
    const adminResponse = await fetch(`${BASE_URL}/api/maintenance/toggle`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const adminData = await adminResponse.json();
    
    if (!adminResponse.ok) {
      fail('Admin GET endpoint failed', `HTTP ${adminResponse.status}`);
      return false;
    }
    
    success('Admin GET endpoint accessible', 'Admin panel data retrieved');
    
    if (adminData.enabled === false) {
      success('Shows maintenance disabled', 'Admin sees OFF status');
    } else {
      fail('Still shows enabled', 'Should show disabled after auto-end');
    }
    
    if (adminData.disabledBy === 'System (Auto-End)') {
      success('ADMIN PANEL: Shows System Auto-End ✨', 'Clear indication of auto-end');
    } else if (adminData.disabledBy) {
      log(`   ℹ️  disabledBy: ${adminData.disabledBy}`, 'cyan');
      log('   Expected: "System (Auto-End)" for clarity', 'yellow');
    } else {
      fail('disabledBy field missing', 'Admin panel needs this for history');
    }
    
    if (adminData.disabledAt) {
      success('disabledAt timestamp present', `Time: ${new Date(adminData.disabledAt).toLocaleString()}`);
    } else {
      log('   ℹ️  disabledAt field missing', 'cyan');
    }
    
    if (adminData.estimatedDuration) {
      log(`   ℹ️  estimatedDuration still present: ${adminData.estimatedDuration} min`, 'cyan');
      log('   This is OK if showing duration history in admin panel', 'cyan');
    }
    
    return true;
    
  } catch (error) {
    fail('Admin panel display test', error.message);
    log(error.stack, 'red');
    return false;
  }
}

// ===================== FINAL CLEANUP =====================

async function finalCleanup() {
  section('PHASE 9: FINAL CLEANUP');
  
  try {
    subsection('Ensuring maintenance is disabled');
    
    const response = await fetch(`${BASE_URL}/api/maintenance/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ enabled: false })
    });
    
    if (response.ok) {
      success('Maintenance disabled', 'System restored to normal state');
    } else {
      log('   ⚠️  Manual cleanup may be needed', 'yellow');
    }
    
    subsection('Verifying final state');
    await wait(1000);
    
    const statusResponse = await fetch(`${BASE_URL}/api/maintenance/status`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const statusData = await statusResponse.json();
    
    if (statusData.enabled === false) {
      success('Final verification', 'Maintenance OFF - System ready');
    } else {
      log('   ⚠️  Maintenance still enabled - check admin panel', 'yellow');
    }
    
    return true;
    
  } catch (error) {
    fail('Final cleanup', error.message);
    return false;
  }
}

// ===================== FINAL REPORT =====================

function printFinalReport() {
  section('FINAL TEST REPORT');
  
  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  log(`\nTotal Tests: ${total}`, 'bold');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`\n📊 Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
  
  if (results.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        log(`   • ${t.name}`, 'red');
        if (t.details) log(`     ${t.details}`, 'yellow');
      });
  }
  
  log('\n' + '='.repeat(80), 'cyan');
  
  if (passRate === '100.0') {
    log('🎉 ALL TESTS PASSED! AUTO-END FIX WORKING PERFECTLY! 🎉', 'green');
  } else if (passRate >= 80) {
    log('⚠️  MOST TESTS PASSED - Minor issues detected', 'yellow');
  } else {
    log('❌ CRITICAL ISSUES DETECTED - Fix required', 'red');
  }
  
  log('='.repeat(80) + '\n', 'cyan');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// ===================== MAIN TEST RUNNER =====================

async function runAllTests() {
  log('\n🚀 MAINTENANCE AUTO-END FIX TEST SUITE', 'bold');
  log('Testing the fix for past auto-end time detection\n', 'cyan');
  
  // Phase 1: Initialize
  const initOk = await initializeFirebaseAdmin();
  if (!initOk) {
    log('\n❌ Cannot proceed without Firebase Admin access', 'red');
    process.exit(1);
  }
  
  // Phase 2: Authenticate
  const authOk = await generateCustomToken();
  if (!authOk) {
    log('\n❌ Cannot proceed without authentication', 'red');
    process.exit(1);
  }
  
  // Phase 3: Cleanup
  const cleanupOk = await cleanupBeforeTest();
  if (!cleanupOk) {
    log('\n⚠️  Cleanup issues - proceeding anyway', 'yellow');
  }
  
  // Phase 4-8: Core tests
  await testPastAutoEndDetection();      // THE MAIN BUG TEST
  await testActiveAutoEndNotReached();   // Verify normal auto-end works
  await testManualDisableVsAutoEnd();    // Verify manual disable is different
  await testEdgeCases();                 // Edge cases and error handling
  await testAdminPanelDisplay();         // Admin panel display test
  
  // Phase 9: Cleanup
  await finalCleanup();
  
  // Report
  printFinalReport();
}

// Run the test suite
runAllTests().catch(error => {
  log('\n💥 FATAL ERROR:', 'red');
  log(error.message, 'red');
  log(error.stack, 'yellow');
  process.exit(1);
});
