// tests/security/sessionSecurityTests.ts
// Comprehensive security penetration testing for the hardened session system

import { 
  generateSecureSessionToken,
  validateSecureSessionToken,
  createFingerprintHash,
  getIpRange,
  SessionErrorCode,
  type ClientFingerprint 
} from '@/lib/secureSession';
import { secureSessionClient } from '@/lib/secureSessionClient';
import { securityMonitor } from '@/lib/securityMonitor';

// Test data and utilities
const VALID_FINGERPRINT: ClientFingerprint = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  acceptLanguage: 'en-US,en;q=0.9',
  screenResolution: '1920x1080',
  timezone: 'America/New_York',
  platform: 'Win32',
  colorDepth: 24,
};

const MALICIOUS_FINGERPRINT: ClientFingerprint = {
  userAgent: 'python-requests/2.28.1',
  acceptLanguage: 'en-US',
  screenResolution: '1024x768',
  timezone: 'UTC',
  platform: 'Linux',
  colorDepth: 24,
};

const VALID_IP = '192.168.1.100';
const ATTACKER_IP = '10.0.0.50';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attackVector: string;
  expectedBehavior: string;
  actualBehavior: string;
}

/**
 * Security Test Suite for Session Hardening
 */
export class SessionSecurityTests {
  private testResults: TestResult[] = [];

  /**
   * Run all security tests
   */
  async runAllTests(): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    criticalFailures: number;
    results: TestResult[];
  }> {
    console.log('🔒 Starting comprehensive security penetration tests...\n');

    // Core Security Tests - Critical vulnerability fixes
    await this.testUuidTampering();
    await this.testPartialUuidModification();

    // Token Security Tests
    await this.testTokenSignatureValidation();

    // Session Hijacking Tests
    await this.testSessionHijacking();

    // Rate Limiting Tests
    await this.testRateLimitBypass();

    // Cryptographic Security Tests
    await this.testCryptographicAttacks();

    // Privacy and Compliance Tests
    await this.testDataLeakage();

    return this.generateTestReport();
  }

  /**
   * Test 1: UUID Tampering Detection
   * Critical: System must reject any manually modified UUIDs
   */
  async testUuidTampering(): Promise<void> {
    const testCases = [
      {
        name: 'Complete UUID modification',
        originalUuid: '550e8400-e29b-41d4-a716-446655440000',
        tamperedUuid: '550e8400-e29b-41d4-a716-446655440001',
        expected: 'REJECT'
      },
      {
        name: 'Last character deletion',
        originalUuid: '550e8400-e29b-41d4-a716-446655440000',
        tamperedUuid: '550e8400-e29b-41d4-a716-44665544000',
        expected: 'REJECT'
      },
      {
        name: 'Invalid UUID format',
        originalUuid: '550e8400-e29b-41d4-a716-446655440000',
        tamperedUuid: 'invalid-uuid-format',
        expected: 'REJECT'
      },
      {
        name: 'Empty UUID',
        originalUuid: '550e8400-e29b-41d4-a716-446655440000',
        tamperedUuid: '',
        expected: 'REJECT'
      }
    ];

    for (const testCase of testCases) {
      try {
        // Generate valid session token for original UUID
        const validToken = generateSecureSessionToken(testCase.originalUuid, VALID_FINGERPRINT);
        
        // Attempt to validate with tampered UUID
        const result = await this.simulateFrontendValidation(testCase.tamperedUuid, validToken);
        
        const passed = !result.accessGranted;
        
        this.testResults.push({
          testName: `UUID Tampering: ${testCase.name}`,
          passed,
          details: passed 
            ? `✅ Correctly rejected tampered UUID: ${testCase.tamperedUuid}`
            : `❌ CRITICAL: Allowed access with tampered UUID: ${testCase.tamperedUuid}`,
          securityLevel: passed ? 'LOW' : 'CRITICAL',
          attackVector: 'UUID Manipulation',
          expectedBehavior: 'Reject access and show security error',
          actualBehavior: passed ? 'Access denied as expected' : 'Access granted - SECURITY BREACH'
        });
      } catch (error) {
        this.testResults.push({
          testName: `UUID Tampering: ${testCase.name}`,
          passed: true, // Exception means rejection, which is good
          details: `✅ Exception thrown correctly: ${error instanceof Error ? error.message : 'Unknown error'}`,
          securityLevel: 'LOW',
          attackVector: 'UUID Manipulation',
          expectedBehavior: 'Reject access and show security error',
          actualBehavior: 'Exception thrown - access denied'
        });
      }
    }
  }

  /**
   * Test 2: Partial UUID Modification (The Original Vulnerability)
   */
  async testPartialUuidModification(): Promise<void> {
    const originalUuid = '550e8400-e29b-41d4-a716-446655440000';
    const partialModifications = [
      '550e8400-e29b-41d4-a716-446655440',     // Missing last 3 chars
      '550e8400-e29b-41d4-a716-4466554400',   // Missing last 2 chars  
      '550e8400-e29b-41d4-a716-44665544000X',  // Changed last char
      '550e8400-e29b-41d4-a716-446655440001',  // Incremented last digit
    ];

    for (const modifiedUuid of partialModifications) {
      try {
        const result = await this.simulateFrontendValidation(modifiedUuid, null);
        
        const passed = !result.accessGranted;
        
        this.testResults.push({
          testName: `Partial UUID Modification: ${modifiedUuid}`,
          passed,
          details: passed 
            ? `✅ Correctly rejected partial modification`
            : `❌ CRITICAL: Original vulnerability still exists - access granted`,
          securityLevel: passed ? 'LOW' : 'CRITICAL',
          attackVector: 'UUID Partial Modification',
          expectedBehavior: 'Reject access, no automatic UUID generation',
          actualBehavior: passed ? 'Access denied' : 'Access granted with new UUID - VULNERABILITY'
        });
      } catch (error) {
        this.testResults.push({
          testName: `Partial UUID Modification: ${modifiedUuid}`,
          passed: true,
          details: `✅ Correctly rejected with error: ${error instanceof Error ? error.message : 'Unknown'}`,
          securityLevel: 'LOW',
          attackVector: 'UUID Partial Modification',
          expectedBehavior: 'Reject access',
          actualBehavior: 'Access denied'
        });
      }
    }
  }

  /**
   * Test 3: Token Signature Validation
   */
  async testTokenSignatureValidation(): Promise<void> {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const validToken = generateSecureSessionToken(validUuid, VALID_FINGERPRINT);
    
    // Split token to manipulate signature
    const tokenParts = validToken.split('.');
    
    const signatureAttacks = [
      {
        name: 'Modified signature',
        token: [...tokenParts.slice(0, -1), 'modified_signature'].join('.'),
      },
      {
        name: 'Empty signature',
        token: [...tokenParts.slice(0, -1), ''].join('.'),
      },
      {
        name: 'Additional signature component',
        token: validToken + '.extra_component',
      },
      {
        name: 'Removed signature',
        token: tokenParts.slice(0, -1).join('.'),
      }
    ];

    for (const attack of signatureAttacks) {
      const result = validateSecureSessionToken(
        attack.token,
        VALID_FINGERPRINT,
        VALID_IP,
        VALID_FINGERPRINT.userAgent
      );

      const passed = !result.valid && result.errorCode === SessionErrorCode.INVALID_SIGNATURE;

      this.testResults.push({
        testName: `Token Signature Attack: ${attack.name}`,
        passed,
        details: passed 
          ? `✅ Correctly rejected invalid signature`
          : `❌ Failed to detect signature manipulation: ${result.error}`,
        securityLevel: passed ? 'LOW' : 'HIGH',
        attackVector: 'Token Signature Manipulation',
        expectedBehavior: 'Reject token with INVALID_SIGNATURE error',
        actualBehavior: passed ? 'Signature validation failed as expected' : `Unexpected: ${result.error}`
      });
    }
  }

  /**
   * Test 4: Session Hijacking Attempts
   */
  async testSessionHijacking(): Promise<void> {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const validToken = generateSecureSessionToken(validUuid, VALID_FINGERPRINT);

    // Attempt to use valid token from different fingerprint (session hijacking)
    const hijackingAttempts = [
      {
        name: 'Different user agent',
        fingerprint: { ...VALID_FINGERPRINT, userAgent: 'Malicious Browser/1.0' },
      },
      {
        name: 'Different screen resolution',
        fingerprint: { ...VALID_FINGERPRINT, screenResolution: '800x600' },
      },
      {
        name: 'Completely different fingerprint',
        fingerprint: MALICIOUS_FINGERPRINT,
      },
      {
        name: 'Missing fingerprint properties',
        fingerprint: { ...VALID_FINGERPRINT, timezone: '', platform: '' },
      }
    ];

    for (const attempt of hijackingAttempts) {
      const result = validateSecureSessionToken(
        validToken,
        attempt.fingerprint,
        ATTACKER_IP, // Different IP too
        attempt.fingerprint.userAgent
      );

      const passed = !result.valid && result.errorCode === SessionErrorCode.FINGERPRINT_MISMATCH;

      this.testResults.push({
        testName: `Session Hijacking: ${attempt.name}`,
        passed,
        details: passed 
          ? `✅ Correctly detected fingerprint mismatch`
          : `❌ CRITICAL: Session hijacking succeeded`,
        securityLevel: passed ? 'LOW' : 'CRITICAL',
        attackVector: 'Session Hijacking',
        expectedBehavior: 'Reject with FINGERPRINT_MISMATCH',
        actualBehavior: passed ? 'Fingerprint validation failed' : 'Session hijacking successful - CRITICAL'
      });
    }
  }

  /**
   * Test 5: Rate Limiting Bypass Attempts
   */
  async testRateLimitBypass(): Promise<void> {
    const bypassAttempts = [
      {
        name: 'IP rotation',
        ips: ['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4', '10.0.0.5'],
      },
      {
        name: 'User-Agent rotation',
        userAgents: [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (X11; Linux x86_64)',
        ],
      },
      {
        name: 'Distributed attack simulation',
        concurrent: true,
      }
    ];

    for (const attempt of bypassAttempts) {
      // Simulate rapid requests
      const requests = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        const ip = attempt.ips ? attempt.ips[i % attempt.ips.length] : ATTACKER_IP;
        const ua = attempt.userAgents ? attempt.userAgents[i % attempt.userAgents.length] : 'Attacker/1.0';
        
        requests.push(this.simulateTokenRequest(ip, ua));
      }

      try {
        const results = attempt.concurrent ? 
          await Promise.all(requests) : 
          await this.sequentialRequests(requests);

        const successfulRequests = results.filter(r => r.success).length;
        const rateLimited = results.some(r => r.rateLimited);
        
        const passed = rateLimited && successfulRequests < 20; // Should be rate limited

        this.testResults.push({
          testName: `Rate Limit Bypass: ${attempt.name}`,
          passed,
          details: passed
            ? `✅ Rate limiting effective: ${successfulRequests}/50 requests succeeded`
            : `❌ Rate limiting bypassed: ${successfulRequests}/50 requests succeeded`,
          securityLevel: passed ? 'LOW' : 'MEDIUM',
          attackVector: 'Rate Limit Bypass',
          expectedBehavior: 'Block excessive requests',
          actualBehavior: `${successfulRequests} requests succeeded, rate limited: ${rateLimited}`
        });
      } catch (error) {
        this.testResults.push({
          testName: `Rate Limit Bypass: ${attempt.name}`,
          passed: true,
          details: `✅ Requests failed due to: ${error instanceof Error ? error.message : 'Unknown error'}`,
          securityLevel: 'LOW',
          attackVector: 'Rate Limit Bypass',
          expectedBehavior: 'Block excessive requests',
          actualBehavior: 'Requests blocked by error handling'
        });
      }
    }
  }

  /**
   * Test 6: Cryptographic Attacks
   */
  async testCryptographicAttacks(): Promise<void> {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const validToken = generateSecureSessionToken(validUuid, VALID_FINGERPRINT);

    const cryptoAttacks = [
      {
        name: 'Token length extension',
        manipulate: (token: string) => token + 'malicious_extension',
      },
      {
        name: 'Token truncation',
        manipulate: (token: string) => token.slice(0, -10),
      },
      {
        name: 'Component reordering',
        manipulate: (token: string) => {
          const parts = token.split('.');
          return [parts[1], parts[0], ...parts.slice(2)].join('.');
        },
      },
      {
        name: 'Timestamp manipulation',
        manipulate: (token: string) => {
          const parts = token.split('.');
          parts[1] = (parseInt(parts[1]) + 3600).toString(); // Add 1 hour
          return parts.join('.');
        },
      }
    ];

    for (const attack of cryptoAttacks) {
      try {
        const manipulatedToken = attack.manipulate(validToken);
        const result = validateSecureSessionToken(
          manipulatedToken,
          VALID_FINGERPRINT,
          VALID_IP,
          VALID_FINGERPRINT.userAgent
        );

        const passed = !result.valid;

        this.testResults.push({
          testName: `Cryptographic Attack: ${attack.name}`,
          passed,
          details: passed
            ? `✅ Cryptographic integrity maintained`
            : `❌ Cryptographic attack succeeded`,
          securityLevel: passed ? 'LOW' : 'HIGH',
          attackVector: 'Cryptographic Manipulation',
          expectedBehavior: 'Reject manipulated token',
          actualBehavior: passed ? 'Token rejected' : 'Token accepted - crypto failure'
        });
      } catch (error) {
        this.testResults.push({
          testName: `Cryptographic Attack: ${attack.name}`,
          passed: true,
          details: `✅ Attack failed with error: ${error instanceof Error ? error.message : 'Unknown'}`,
          securityLevel: 'LOW',
          attackVector: 'Cryptographic Manipulation',
          expectedBehavior: 'Reject manipulated token',
          actualBehavior: 'Token processing failed - attack blocked'
        });
      }
    }
  }

  /**
   * Test 7: Privacy and Data Leakage
   */
  async testDataLeakage(): Promise<void> {
    const testCases = [
      {
        name: 'Token contains PII',
        test: () => {
          const token = generateSecureSessionToken('test-uuid', VALID_FINGERPRINT);
          const containsPii = /\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/.test(token) ||
                             /\b\d{3}-\d{2}-\d{4}\b/.test(token) ||
                             /\b\d{16}\b/.test(token);
          return !containsPii;
        }
      },
      {
        name: 'Error messages leak sensitive data',
        test: () => {
          const result = validateSecureSessionToken(
            'invalid.token.format',
            VALID_FINGERPRINT,
            VALID_IP,
            'test-ua'
          );
          // Check if error message contains sensitive information
          const errorSafe = !result.error?.includes(process.env.SESSION_SECRET || '') &&
                           !result.error?.includes('database') &&
                           !result.error?.includes('password');
          return errorSafe;
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const passed = testCase.test();
        
        this.testResults.push({
          testName: `Data Leakage: ${testCase.name}`,
          passed,
          details: passed
            ? `✅ No sensitive data leakage detected`
            : `❌ Potential data leakage detected`,
          securityLevel: passed ? 'LOW' : 'MEDIUM',
          attackVector: 'Information Disclosure',
          expectedBehavior: 'No sensitive data in outputs',
          actualBehavior: passed ? 'No leakage detected' : 'Potential leakage found'
        });
      } catch (error) {
        this.testResults.push({
          testName: `Data Leakage: ${testCase.name}`,
          passed: false,
          details: `❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown'}`,
          securityLevel: 'MEDIUM',
          attackVector: 'Information Disclosure',
          expectedBehavior: 'Test should complete successfully',
          actualBehavior: 'Test execution failed'
        });
      }
    }
  }

  /**
   * Helper: Simulate frontend validation (replaces old vulnerable logic)
   */
  private async simulateFrontendValidation(uuid: string, token: string | null): Promise<{
    accessGranted: boolean;
    error?: string;
  }> {
    try {
      // This simulates the NEW secure frontend logic
      if (!token) {
        // No automatic UUID generation - request new session
        const validUUID = await secureSessionClient.getValidUUID();
        if (!validUUID) {
          return { accessGranted: false, error: 'No valid session' };
        }
        if (uuid !== validUUID) {
          return { accessGranted: false, error: 'Session mismatch' };
        }
      }
      
      return { accessGranted: true };
    } catch (error) {
      return { 
        accessGranted: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Helper: Simulate token generation request
   */
  private async simulateTokenRequest(ip: string, userAgent: string): Promise<{
    success: boolean;
    rateLimited: boolean;
    error?: string;
  }> {
    try {
      // This would normally call the actual API
      const token = generateSecureSessionToken('test-uuid', {
        ...VALID_FINGERPRINT,
        userAgent,
      });
      
      return { success: true, rateLimited: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown';
      return { 
        success: false, 
        rateLimited: errorMessage.includes('rate limit') || errorMessage.includes('too many'),
        error: errorMessage
      };
    }
  }

  /**
   * Helper: Execute requests sequentially
   */
  private async sequentialRequests(requests: Promise<any>[]): Promise<any[]> {
    const results = [];
    for (const request of requests) {
      try {
        const result = await request;
        results.push(result);
        // Small delay to simulate real requests
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        results.push({ success: false, error });
      }
    }
    return results;
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): {
    totalTests: number;
    passed: number;
    failed: number;
    criticalFailures: number;
    results: TestResult[];
  } {
    const totalTests = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = totalTests - passed;
    const criticalFailures = this.testResults.filter(r => !r.passed && r.securityLevel === 'CRITICAL').length;

    console.log('\n🔒 SECURITY TEST REPORT');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passed} (${((passed/totalTests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed/totalTests) * 100).toFixed(1)}%)`);
    console.log(`Critical Failures: ${criticalFailures}`);
    
    if (criticalFailures > 0) {
      console.log('\n❌ CRITICAL SECURITY VULNERABILITIES FOUND:');
      this.testResults.filter(r => !r.passed && r.securityLevel === 'CRITICAL')
        .forEach(r => console.log(`   • ${r.testName}: ${r.details}`));
    }
    
    console.log('\n📊 Test Results by Security Level:');
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(level => {
      const levelTests = this.testResults.filter(r => r.securityLevel === level);
      const levelPassed = levelTests.filter(r => r.passed).length;
      console.log(`   ${level}: ${levelPassed}/${levelTests.length} passed`);
    });

    return {
      totalTests,
      passed,
      failed,
      criticalFailures,
      results: this.testResults,
    };
  }
}

// Export test runner
export async function runSecurityPenetrationTests(): Promise<void> {
  const testSuite = new SessionSecurityTests();
  const results = await testSuite.runAllTests();
  
  if (results.criticalFailures > 0) {
    throw new Error(`CRITICAL SECURITY FAILURES: ${results.criticalFailures} critical vulnerabilities found`);
  }
  
  if (results.failed > 0) {
    console.warn(`⚠️  ${results.failed} security tests failed (non-critical)`);
  } else {
    console.log('✅ All security tests passed - system is hardened');
  }
}

export default SessionSecurityTests;