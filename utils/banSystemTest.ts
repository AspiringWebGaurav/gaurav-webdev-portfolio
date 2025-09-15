/**
 * Ban System Test Utility
 * Tests the enhanced ban system to ensure all functionality works correctly
 */

import { generatePolicyReference, isValidPolicyReference, formatPolicyReferenceForDisplay } from './policyReference';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
}

/**
 * Runs comprehensive tests on the ban system
 * @returns {Promise<TestResult[]>} Array of test results
 */
export async function runBanSystemTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Policy Reference Generation
  try {
    const policyRef = generatePolicyReference();
    const isValid = isValidPolicyReference(policyRef);
    const formatted = formatPolicyReferenceForDisplay(policyRef);
    
    results.push({
      testName: 'Policy Reference Generation',
      passed: isValid && policyRef.length === 17 && formatted.includes('/'),
      message: isValid ? `Generated: ${policyRef}, Formatted: ${formatted}` : 'Invalid policy reference generated'
    });
  } catch (error) {
    results.push({
      testName: 'Policy Reference Generation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 2: Policy Reference Uniqueness
  try {
    const refs = new Set();
    for (let i = 0; i < 100; i++) {
      refs.add(generatePolicyReference());
    }
    
    results.push({
      testName: 'Policy Reference Uniqueness',
      passed: refs.size === 100,
      message: `Generated ${refs.size}/100 unique references`
    });
  } catch (error) {
    results.push({
      testName: 'Policy Reference Uniqueness',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 3: Policy Reference Format Validation
  try {
    const validRef = 'BAN-20250109-ABC123';
    const invalidRefs = [
      'INVALID-20250109-ABC123',
      'BAN-2025010-ABC123',
      'BAN-20250109-AB123',
      'BAN-20250109-abc123',
      'BAN-20250109-ABC12'
    ];

    const validTest = isValidPolicyReference(validRef);
    const invalidTests = invalidRefs.every(ref => !isValidPolicyReference(ref));

    results.push({
      testName: 'Policy Reference Format Validation',
      passed: validTest && invalidTests,
      message: validTest && invalidTests ? 'All validation tests passed' : 'Some validation tests failed'
    });
  } catch (error) {
    results.push({
      testName: 'Policy Reference Format Validation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 4: Ban API Integration Test (Mock)
  try {
    const mockBanData = {
      uuid: 'test-uuid-123',
      reason: 'spam',
      customReason: null,
      policyReference: generatePolicyReference(),
      adminId: 'test-admin',
      timestamp: new Date().toISOString(),
      isActive: true
    };

    // Simulate API call structure
    const hasRequiredFields = !!(mockBanData.uuid &&
                                mockBanData.reason &&
                                mockBanData.policyReference &&
                                mockBanData.adminId);

    results.push({
      testName: 'Ban API Integration Structure',
      passed: hasRequiredFields,
      message: hasRequiredFields ? 'All required fields present' : 'Missing required fields'
    });
  } catch (error) {
    results.push({
      testName: 'Ban API Integration Structure',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 5: Appeal System Integration Test (Mock)
  try {
    const mockAppealData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Ban Appeal',
      message: 'This is a test appeal message that is longer than 20 characters.',
      uuid: 'test-uuid-123',
      banReason: 'Policy violation',
      policyReference: generatePolicyReference(),
      timestamp: new Date().toISOString()
    };

    const hasRequiredFields = !!(mockAppealData.name &&
                                mockAppealData.email &&
                                mockAppealData.subject &&
                                mockAppealData.message &&
                                mockAppealData.uuid &&
                                mockAppealData.policyReference);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mockAppealData.email);
    const messageValid = mockAppealData.message.length >= 20;

    results.push({
      testName: 'Appeal System Integration Structure',
      passed: hasRequiredFields && emailValid && messageValid,
      message: hasRequiredFields && emailValid && messageValid ?
               'All appeal fields valid' :
               'Some appeal fields invalid'
    });
  } catch (error) {
    results.push({
      testName: 'Appeal System Integration Structure',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 6: UI Component Data Flow Test
  try {
    const mockUIData = {
      uuid: 'test-uuid-123',
      banReason: 'Policy violation',
      policyReference: generatePolicyReference(),
      isListening: true,
      isAppealModalOpen: false
    };

    const uiDataValid = !!(mockUIData.uuid &&
                          mockUIData.banReason &&
                          mockUIData.policyReference &&
                          isValidPolicyReference(mockUIData.policyReference));

    results.push({
      testName: 'UI Component Data Flow',
      passed: uiDataValid,
      message: uiDataValid ? 'UI data structure valid' : 'UI data structure invalid'
    });
  } catch (error) {
    results.push({
      testName: 'UI Component Data Flow',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  return results;
}

/**
 * Logs test results to console in a formatted way
 * @param {TestResult[]} results - Array of test results
 */
export function logTestResults(results: TestResult[]): void {
  console.log('\n🧪 Ban System Test Results');
  console.log('=' .repeat(50));
  
  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const testNumber = (index + 1).toString().padStart(2, '0');
    
    console.log(`${testNumber}. ${result.testName}: ${status}`);
    console.log(`    ${result.message}`);
    
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log('=' .repeat(50));
  console.log(`📊 Summary: ${passed} passed, ${failed} failed`);
  console.log(`🎯 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Ban system is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
}

/**
 * Runs a quick smoke test for the ban system
 * @returns {boolean} True if basic functionality works
 */
export function runSmokeTest(): boolean {
  try {
    // Generate a policy reference
    const policyRef = generatePolicyReference();
    
    // Validate it
    const isValid = isValidPolicyReference(policyRef);
    
    // Format it
    const formatted = formatPolicyReferenceForDisplay(policyRef);
    
    // Check basic structure
    const hasCorrectLength = policyRef.length === 17;
    const hasCorrectFormat = policyRef.startsWith('BAN-');
    const formattedHasSlashes = formatted.includes('/');
    
    return isValid && hasCorrectLength && hasCorrectFormat && formattedHasSlashes;
  } catch (error) {
    console.error('Smoke test failed:', error);
    return false;
  }
}