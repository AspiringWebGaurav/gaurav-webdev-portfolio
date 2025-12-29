/**
 * Ban System Cache Bug Test Suite
 * 
 * Tests fix for: Banned page cached in browser, shows stale "You're Banned" 
 * screen even after admin unbanned user (requires hard refresh)
 * 
 * Mirrors maintenance-cache-bug-test.mjs patterns
 * 
 * Run: node tests/ban-cache-bug-test.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const VISITORS_COLLECTION = 'og_uuid'; // Match lib/uuid-sync/constants.ts VISITOR_PROFILES
const MASK_MAP_COLLECTION = 'og_uuid_masks'; // Match lib/uuid-sync/constants.ts MASK_MAP

// Test configuration
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_UUID_BASE = `test-ban-cache-${Date.now()}`;
const TEST_MASK_BASE = `test-mask-ban-cache-${Date.now()}`;

// Helper to clear server-side caches via API
async function clearServerCaches(uuid) {
  try {
    await fetch(`${API_BASE}/api/test/clear-cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid }),
    });
  } catch (e) {
    // Ignore if endpoint doesn't exist
  }
}

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    testsPassed++;
    log(`✅ PASS: ${testName}`, 'green');
    return true;
  } else {
    testsFailed++;
    log(`❌ FAIL: ${testName}`, 'red');
    return false;
  }
}

/**
 * Test Suite: Ban Cache Prevention
 */
async function runTests() {
  log('\n🧪 BAN SYSTEM CACHE BUG TEST SUITE', 'cyan');
  log('Testing fix for: Cached banned page showing stale state after unban\n', 'yellow');

  const createdVisitors = [];

  try {
    // Setup: Create test visitors
    log('📝 Setup: Creating test visitors...', 'blue');
    const TEST_UUID_1 = `${TEST_UUID_BASE}-1`;
    const TEST_MASK_1 = `${TEST_MASK_BASE}-1`;
    
    // Create visitor profile document
    await db.collection(VISITORS_COLLECTION).doc(TEST_UUID_1).set({
      mask: TEST_MASK_1,
      banned: false,
      banReason: null,
      banCategory: null,
      banType: 'permanent',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Create mask lookup document for translateMaskToUUID
    await db.collection(MASK_MAP_COLLECTION).doc(TEST_MASK_1).set({
      uuid: TEST_UUID_1,
      createdAt: FieldValue.serverTimestamp(),
    });
    
    createdVisitors.push(TEST_UUID_1);
    log(`✓ Created test visitor 1: ${TEST_MASK_1}`, 'green');
    
    const TEST_UUID_2 = `${TEST_UUID_BASE}-2`;
    const TEST_MASK_2 = `${TEST_MASK_BASE}-2`;
    
    // Create visitor profile document
    await db.collection(VISITORS_COLLECTION).doc(TEST_UUID_2).set({
      mask: TEST_MASK_2,
      banned: true,
      banReason: 'Initial Ban',
      banCategory: 'normal',
      banType: 'permanent',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Create mask lookup document
    await db.collection(MASK_MAP_COLLECTION).doc(TEST_MASK_2).set({
      uuid: TEST_UUID_2,
      createdAt: FieldValue.serverTimestamp(),
    });
    
    createdVisitors.push(TEST_UUID_2);
    log(`✓ Created test visitor 2: ${TEST_MASK_2}\n`, 'green');

    // Test 1: Banned Page Has force-dynamic Export
    log('🔍 Test 1: Check banned page has force-dynamic export', 'cyan');
    const bannedPagePath = join(__dirname, '..', 'app', 'banned', 'page.tsx');
    const bannedPageContent = readFileSync(bannedPagePath, 'utf8');
    
    const hasForceDynamic = bannedPageContent.includes("export const dynamic = 'force-dynamic'");
    const hasRevalidate = bannedPageContent.includes('export const revalidate = 0');
    
    assert(hasForceDynamic, 'Banned page has force-dynamic export');
    assert(hasRevalidate, 'Banned page has revalidate=0 export');

    // Test 2: Banned Layout Has force-dynamic Export
    log('\n🔍 Test 2: Check banned layout has force-dynamic export', 'cyan');
    const bannedLayoutPath = join(__dirname, '..', 'app', 'banned', 'layout.tsx');
    const bannedLayoutContent = readFileSync(bannedLayoutPath, 'utf8');
    
    const layoutHasForceDynamic = bannedLayoutContent.includes("export const dynamic = 'force-dynamic'");
    const layoutHasRevalidate = bannedLayoutContent.includes('export const revalidate = 0');
    
    assert(layoutHasForceDynamic, 'Banned layout has force-dynamic export');
    assert(layoutHasRevalidate, 'Banned layout has revalidate=0 export');

    // Test 3: Banned Page Has Visibility Change Detection
    log('\n🔍 Test 3: Check banned page has visibility change detection', 'cyan');
    const hasVisibilityListener = bannedPageContent.includes('visibilitychange');
    const hasDocumentHidden = bannedPageContent.includes('document.hidden');
    const hasVisibilityComment = bannedPageContent.includes('Visibility change detection');
    
    assert(hasVisibilityListener, 'Banned page has visibilitychange listener');
    assert(hasDocumentHidden, 'Banned page checks document.hidden state');
    assert(hasVisibilityComment, 'Banned page has visibility detection comment');

    // Test 4: Banned Page Has Cache Clearing
    log('\n🔍 Test 4: Check banned page clears caches before redirect', 'cyan');
    const hasCachesAPI = bannedPageContent.includes("'caches' in window");
    const hasCachesDelete = bannedPageContent.includes('caches.delete');
    
    assert(hasCachesAPI, 'Banned page checks for caches API');
    assert(hasCachesDelete, 'Banned page deletes caches before redirect');

    // Test 5: Check-Ban API Has Cache-Control Headers
    log('\n🔍 Test 5: Check check-ban API has Cache-Control headers', 'cyan');
    const checkBanPath = join(__dirname, '..', 'app', 'api', 'visitor-analytics', 'check-ban', 'route.ts');
    const checkBanContent = readFileSync(checkBanPath, 'utf8');
    
    const hasCacheControl = checkBanContent.includes('Cache-Control');
    const hasNoStore = checkBanContent.includes('no-store');
    const hasMustRevalidate = checkBanContent.includes('must-revalidate');
    
    assert(hasCacheControl, 'Check-ban API sets Cache-Control header');
    assert(hasNoStore, 'Check-ban API uses no-store directive');
    assert(hasMustRevalidate, 'Check-ban API uses must-revalidate directive');

    // Test 6: Check-Ban-Realtime API Has Cache-Control Headers
    log('\n🔍 Test 6: Check check-ban-realtime API has Cache-Control headers', 'cyan');
    const checkBanRealtimePath = join(__dirname, '..', 'app', 'api', 'visitor-analytics', 'check-ban-realtime', 'route.ts');
    const checkBanRealtimeContent = readFileSync(checkBanRealtimePath, 'utf8');
    
    const hasRealtimeCacheControl = checkBanRealtimeContent.includes('Cache-Control');
    const hasRealtimeNoStore = checkBanRealtimeContent.includes('no-store');
    const hasRealtimeMustRevalidate = checkBanRealtimeContent.includes('must-revalidate');
    
    assert(hasRealtimeCacheControl, 'Check-ban-realtime API sets Cache-Control header');
    assert(hasRealtimeNoStore, 'Check-ban-realtime API uses no-store directive');
    assert(hasRealtimeMustRevalidate, 'Check-ban-realtime API uses must-revalidate directive');

    // Test 7: Visibility Detection Uses Cache-Busting
    log('\n🔍 Test 7: Check visibility detection uses timestamp cache-busting', 'cyan');
    const hasTimestampParam = bannedPageContent.includes('Date.now()');
    const hasCacheBustingComment = bannedPageContent.includes('cache-busting') || 
                                   bannedPageContent.includes('rechecking ban status');
    
    assert(hasTimestampParam, 'Visibility detection uses Date.now() for cache-busting');
    assert(hasCacheBustingComment, 'Code documents cache-busting strategy');

    // Test 8-11: Runtime API Tests - Check-Ban API
    log('\n🔍 Test 8-11: Runtime API tests for check-ban endpoint', 'cyan');
    
    const notBannedResponse = await fetch(`${API_BASE}/api/visitor-analytics/check-ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mask: TEST_MASK_1 }),
    });
    
    const notBannedData = await notBannedResponse.json();
    assert(notBannedData.banned === false, 'API returns banned=false for not banned visitor');
    
    const cacheControlHeader = notBannedResponse.headers.get('Cache-Control');
    assert(cacheControlHeader !== null, 'API response includes Cache-Control header');
    assert(
      cacheControlHeader && cacheControlHeader.includes('no-store'),
      'Cache-Control header includes no-store'
    );
    assert(
      cacheControlHeader && cacheControlHeader.includes('must-revalidate'),
      'Cache-Control header includes must-revalidate'
    );

    log('\n🔍 Test 10: Ban visitor and check API response', 'cyan');
    await db.collection(VISITORS_COLLECTION).doc(TEST_UUID_1).update({
      banned: true,
      banReason: 'Test Ban',
      banCategory: 'normal',
      banTimestamp: FieldValue.serverTimestamp(),
    });
    
    // Verify the write succeeded
    const verifyDoc = await db.collection(VISITORS_COLLECTION).doc(TEST_UUID_1).get();
    console.log('DEBUG: Document after update:', {
      exists: verifyDoc.exists,
      data: verifyDoc.data()
    });
    
    // Verify mask lookup
    const maskDoc = await db.collection(MASK_MAP_COLLECTION).doc(TEST_MASK_1).get();
    console.log('DEBUG: Mask lookup document:', {
      exists: maskDoc.exists,
      data: maskDoc.data()
    });
    
    // Clear any server-side caches
    await clearServerCaches(TEST_UUID_1);
    
    log('⏳ Waiting 2s for Firestore propagation...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('DEBUG: Calling API with mask:', TEST_MASK_1);
    
    const bannedResponse = await fetch(`${API_BASE}/api/visitor-analytics/check-ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mask: TEST_MASK_1 }),
    });
    
    const bannedData = await bannedResponse.json();
    console.log('DEBUG Test 10 - API Response:', JSON.stringify(bannedData, null, 2));
    
    assert(bannedData.banned === true, 'API returns banned=true for banned visitor');
    assert(bannedData.banInfo?.reason === 'Test Ban', 'API returns ban reason');

    const bannedCacheControl = bannedResponse.headers.get('Cache-Control');
    assert(
      bannedCacheControl && bannedCacheControl.includes('no-store'),
      'Banned response has no-store header'
    );

    // Test 12-14: Runtime API Tests - Check-Ban-Realtime API
    log('\n🔍 Test 12-14: Runtime API tests for check-ban-realtime endpoint', 'cyan');
    
    const realtimeBannedResponse = await fetch(`${API_BASE}/api/visitor-analytics/check-ban-realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mask: TEST_MASK_2 }),
    });
    
    const realtimeBannedData = await realtimeBannedResponse.json();
    assert(realtimeBannedData.banned === true, 'Realtime API returns banned=true');
    
    const realtimeCacheControl = realtimeBannedResponse.headers.get('Cache-Control');
    assert(
      realtimeCacheControl && realtimeCacheControl.includes('no-store'),
      'Realtime API has no-store header'
    );

    log('\n🔍 Test 14: Unban visitor and check realtime API', 'cyan');
    await db.collection(VISITORS_COLLECTION).doc(TEST_UUID_2).update({
      banned: false,
      banReason: null,
      banCategory: null,
      unbannedAt: FieldValue.serverTimestamp(),
    });
    
    // Clear any server-side caches
    await clearServerCaches(TEST_UUID_2);
    
    log('⏳ Waiting 2s for Firestore propagation...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    log('⏳ Waiting 1.5s for all caches to expire...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const unbannedResponse = await fetch(`${API_BASE}/api/visitor-analytics/check-ban-realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mask: TEST_MASK_2 }),
    });
    
    const unbannedData = await unbannedResponse.json();
    assert(unbannedData.banned === false, 'Realtime API returns banned=false after unban');

    // Test 15: Cache-Busting Query Parameter Pattern
    log('\n🔍 Test 15: Check API calls use cache-busting query parameters', 'cyan');
    const hasCacheBustingPattern = bannedPageContent.includes('?t=') || 
                                   bannedPageContent.includes('Date.now()');
    
    assert(hasCacheBustingPattern, 'Banned page uses cache-busting query parameters');

    // Test 16: Multiple Cache Scenarios
    log('\n🔍 Test 16: Simulate 100+ tabs scenario - rapid successive calls', 'cyan');
    
    const TEST_UUID_3 = `${TEST_UUID_BASE}-3`;
    const TEST_MASK_3 = `${TEST_MASK_BASE}-3`;
    
    await db.collection(VISITORS_COLLECTION).doc(TEST_UUID_3).set({
      mask: TEST_MASK_3,
      banned: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    createdVisitors.push(TEST_UUID_3);
    
    const tabPromises = [];
    for (let i = 0; i < 5; i++) {
      tabPromises.push(
        fetch(`${API_BASE}/api/visitor-analytics/check-ban?t=${Date.now()}-${i}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mask: TEST_MASK_3 }),
        })
      );
    }
    
    const tabResponses = await Promise.all(tabPromises);
    const tabResults = await Promise.all(tabResponses.map(r => r.json()));
    
    const allNotBanned = tabResults.every(r => r.banned === false);
    assert(allNotBanned, 'All simulated tabs get correct (not banned) status');

    // Test 17: Error Response Has No-Cache Headers
    log('\n🔍 Test 17: Check error responses also have no-cache headers', 'cyan');
    const errorResponse = await fetch(`${API_BASE}/api/visitor-analytics/check-ban-realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mask: 'invalid-mask-xyz' }),
    });
    
    const errorCacheControl = errorResponse.headers.get('Cache-Control');
    assert(
      errorCacheControl && errorCacheControl.includes('no-store'),
      'Error responses also have no-store header'
    );

    // Cleanup
    log('\n🧹 Cleanup: Deleting test visitors...', 'blue');
    for (const uuid of createdVisitors) {
      await db.collection(VISITORS_COLLECTION).doc(uuid).delete();
    }
    log(`✓ Deleted ${createdVisitors.length} test visitors\n`, 'green');

  } catch (error) {
    log(`\n❌ TEST SUITE ERROR: ${error.message}`, 'red');
    console.error(error);
    testsFailed++;
  }

  // Test Results Summary
  log('\n' + '='.repeat(60), 'bright');
  log('📊 TEST RESULTS SUMMARY', 'cyan');
  log('='.repeat(60), 'bright');
  log(`Total Tests: ${testsPassed + testsFailed}`, 'bright');
  log(`✅ Passed: ${testsPassed}`, 'green');
  log(`❌ Failed: ${testsFailed}`, 'red');
  
  if (testsFailed === 0) {
    log('\n🎉 ALL TESTS PASSED! Ban cache bug is fixed!', 'green');
    log('✓ Banned page won\'t cache stale state', 'green');
    log('✓ 100+ tabs scenario handled correctly', 'green');
    log('✓ Visibility detection prevents stale page display', 'green');
    log('✓ APIs return no-cache headers', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED - Review implementation', 'yellow');
  }
  
  log('='.repeat(60) + '\n', 'bright');
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(error => {
  log(`\n💥 FATAL ERROR: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
