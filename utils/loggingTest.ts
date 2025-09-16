// utils/loggingTest.ts
// Test suite for the new logging system

import { smartLogger } from './smartLogger';

/**
 * Test the new logging system
 * Run this in browser console to verify logging behavior
 */
export const testLoggingSystem = () => {
  console.group('🧪 Testing Smart Logger System');
  
  // Test browser-only logging
  console.log('Testing browser-only logs (should appear):');
  smartLogger.browserOnly.debug('Debug: Browser-only message', { test: 'data' });
  smartLogger.browserOnly.info('Info: Browser-only message', { test: 'data' });
  smartLogger.browserOnly.warn('Warn: Browser-only message', { test: 'data' });
  
  // Test dev-only logging
  console.log('Testing dev-only logs (should appear in dev):');
  smartLogger.devOnly.debug('Dev Debug: Development message', { test: 'data' });
  smartLogger.devOnly.info('Dev Info: Development message', { test: 'data' });
  
  // Test Firebase logging
  console.log('Testing Firebase logs:');
  smartLogger.firebase.init('Firebase test initialization', { app: 'test' });
  smartLogger.firebase.debug('Firebase debug message', { query: 'test' });
  
  // Test API logging
  console.log('Testing API logs:');
  smartLogger.api.request('GET /test/endpoint', { id: 123 });
  
  // Test standard logging (warnings/errors should go to terminal too)
  console.log('Testing standard logs (warn/error go to terminal):');
  smartLogger.info('Standard info message', { test: 'data' });
  smartLogger.warn('Standard warning message', { test: 'data' });
  
  // Test data sanitization
  console.log('Testing data sanitization:');
  const sensitiveData = {
    user: 'John Doe',
    apiKey: 'sk-1234567890abcdef',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    password: 'secret123',
    normalData: 'This should appear'
  };
  smartLogger.browserOnly.info('Sensitive data test', sensitiveData);
  
  console.log('✅ Logging test completed! Check terminal for minimal output.');
  console.groupEnd();
};

/**
 * Verify environment-specific behavior
 */
export const verifyEnvironment = () => {
  const env = process.env.NODE_ENV;
  const isClient = typeof window !== 'undefined';
  const isServer = typeof window === 'undefined';
  
  console.group('🌍 Environment Verification');
  console.log('Environment:', env);
  console.log('Is Client:', isClient);
  console.log('Is Server:', isServer);
  console.log('Smart Logger Config:', {
    terminalLogsEnabled: !isClient && env === 'development',
    browserLogsEnabled: isClient,
    productionMode: env === 'production'
  });
  console.groupEnd();
};

/**
 * Performance test for logging overhead
 */
export const performanceTest = () => {
  console.group('⚡ Performance Test');
  
  const iterations = 1000;
  const testData = { test: 'data', id: 123, timestamp: Date.now() };
  
  // Test browser-only logging performance
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    smartLogger.browserOnly.debug(`Performance test ${i}`, testData);
  }
  const end = performance.now();
  
  console.log(`${iterations} browser-only logs took ${end - start} milliseconds`);
  console.log(`Average time per log: ${(end - start) / iterations} ms`);
  console.groupEnd();
};

// Auto-run tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run tests when module loads (browser only)
  setTimeout(() => {
    console.log('🚀 Auto-running logging system tests...');
    verifyEnvironment();
    // Uncomment to run full tests
    // testLoggingSystem();
    // performanceTest();
  }, 1000);
}

export default {
  testLoggingSystem,
  verifyEnvironment,
  performanceTest
};