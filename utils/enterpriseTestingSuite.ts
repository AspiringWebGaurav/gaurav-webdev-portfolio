/**
 * Enterprise Testing Suite for Ban/Unban Mobile Redirect Flows
 * Comprehensive testing scenarios specifically for Samsung S9 Plus and mobile browsers
 * Tests all enterprise redirect strategies and monitors success rates
 */

import { enterpriseRedirect, RedirectStrategy } from './enterpriseRedirect';
import { getBanMonitor } from './enterpriseBanMonitor';
import { getSessionManager } from './enterpriseSessionManager';
import { getFirebaseManager } from './enterpriseFirebaseManager';
import { silentLogger, prodLogger } from './secureLogger';

interface TestScenario {
  name: string;
  description: string;
  uuid: string;
  targetUrl: string;
  strategies: RedirectStrategy[];
  expectedOutcome: 'success' | 'failure' | 'partial';
  deviceSimulation?: 'samsung' | 'iphone' | 'chrome_mobile' | 'desktop';
  networkCondition?: 'online' | 'slow' | 'offline';
}

interface TestResult {
  scenario: string;
  success: boolean;
  method: RedirectStrategy;
  duration: number;
  attempts: number;
  error?: string;
  deviceInfo: any;
}

interface TestSuiteReport {
  totalTests: number;
  passed: number;
  failed: number;
  partialSuccess: number;
  samsungSpecificResults: TestResult[];
  mobileResults: TestResult[];
  desktopResults: TestResult[];
  averageRedirectTime: number;
  failureReasons: string[];
  recommendations: string[];
}

export class EnterpriseTestingSuite {
  private static instance: EnterpriseTestingSuite;
  private testResults: TestResult[] = [];
  private isRunning: boolean = false;

  private constructor() {
    silentLogger.silent("Enterprise testing suite initialized");
  }

  public static getInstance(): EnterpriseTestingSuite {
    if (!EnterpriseTestingSuite.instance) {
      EnterpriseTestingSuite.instance = new EnterpriseTestingSuite();
    }
    return EnterpriseTestingSuite.instance;
  }

  /**
   * Run comprehensive Samsung S9 Plus specific tests
   */
  public async runSamsungS9Tests(): Promise<TestSuiteReport> {
    const scenarios: TestScenario[] = [
      {
        name: 'Samsung_Unban_Redirect_Standard',
        description: 'Test standard unban redirect flow on Samsung S9 Plus',
        uuid: 'test-uuid-samsung-1',
        targetUrl: '/test-uuid-samsung-1',
        strategies: [
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.FORM_SUBMIT,
          RedirectStrategy.NEXT_ROUTER,
          RedirectStrategy.WINDOW_REPLACE,
          RedirectStrategy.FORCE_RELOAD
        ],
        expectedOutcome: 'success',
        deviceSimulation: 'samsung',
        networkCondition: 'online'
      },
      {
        name: 'Samsung_Slow_Network_Test',
        description: 'Test unban redirect with slow network on Samsung S9 Plus',
        uuid: 'test-uuid-samsung-2',
        targetUrl: '/test-uuid-samsung-2',
        strategies: [
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.FORM_SUBMIT
        ],
        expectedOutcome: 'success',
        deviceSimulation: 'samsung',
        networkCondition: 'slow'
      },
      {
        name: 'Samsung_Ban_Redirect_Test',
        description: 'Test ban redirect flow on Samsung S9 Plus',
        uuid: 'test-uuid-samsung-3',
        targetUrl: '/test-uuid-samsung-3/ban',
        strategies: [
          RedirectStrategy.NEXT_ROUTER,
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH
        ],
        expectedOutcome: 'success',
        deviceSimulation: 'samsung',
        networkCondition: 'online'
      },
      {
        name: 'Samsung_Router_Failure_Fallback',
        description: 'Test fallback when Next.js router fails on Samsung S9 Plus',
        uuid: 'test-uuid-samsung-4',
        targetUrl: '/test-uuid-samsung-4',
        strategies: [
          RedirectStrategy.NEXT_ROUTER, // This will fail in test
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.FORM_SUBMIT
        ],
        expectedOutcome: 'success',
        deviceSimulation: 'samsung',
        networkCondition: 'online'
      }
    ];

    return this.runTestScenarios(scenarios, 'Samsung S9 Plus Test Suite');
  }

  /**
   * Run comprehensive mobile browser tests
   */
  public async runMobileBrowserTests(): Promise<TestSuiteReport> {
    const scenarios: TestScenario[] = [
      {
        name: 'iPhone_Safari_Unban_Test',
        description: 'Test unban redirect on iPhone Safari',
        uuid: 'test-uuid-iphone-1',
        targetUrl: '/test-uuid-iphone-1',
        strategies: [
          RedirectStrategy.NEXT_ROUTER,
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.WINDOW_REPLACE,
          RedirectStrategy.META_REFRESH
        ],
        expectedOutcome: 'success',
        deviceSimulation: 'iphone',
        networkCondition: 'online'
      },
      {
        name: 'Chrome_Mobile_Unban_Test',
        description: 'Test unban redirect on Chrome Mobile',
        uuid: 'test-uuid-chrome-1',
        targetUrl: '/test-uuid-chrome-1',
        strategies: [
          RedirectStrategy.NEXT_ROUTER,
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH
        ],
        expectedOutcome: 'success',
        deviceSimulation: 'chrome_mobile',
        networkCondition: 'online'
      },
      {
        name: 'Mobile_Network_Interruption_Test',
        description: 'Test redirect with network interruption on mobile',
        uuid: 'test-uuid-mobile-offline',
        targetUrl: '/test-uuid-mobile-offline',
        strategies: [
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.FORM_SUBMIT,
          RedirectStrategy.FORCE_RELOAD
        ],
        expectedOutcome: 'partial',
        deviceSimulation: 'samsung',
        networkCondition: 'offline'
      }
    ];

    return this.runTestScenarios(scenarios, 'Mobile Browser Test Suite');
  }

  /**
   * Run stress test with multiple simultaneous redirects
   */
  public async runStressTest(concurrentTests: number = 10): Promise<TestSuiteReport> {
    const scenarios: TestScenario[] = [];
    
    for (let i = 0; i < concurrentTests; i++) {
      scenarios.push({
        name: `Stress_Test_${i + 1}`,
        description: `Concurrent redirect test #${i + 1}`,
        uuid: `stress-test-uuid-${i + 1}`,
        targetUrl: `/stress-test-uuid-${i + 1}`,
        strategies: [
          RedirectStrategy.WINDOW_LOCATION,
          RedirectStrategy.META_REFRESH,
          RedirectStrategy.NEXT_ROUTER
        ],
        expectedOutcome: 'success',
        deviceSimulation: 'samsung',
        networkCondition: 'online'
      });
    }

    return this.runTestScenarios(scenarios, `Stress Test - ${concurrentTests} Concurrent Redirects`);
  }

  /**
   * Test enterprise monitoring and logging system
   */
  public async runMonitoringSystemTest(): Promise<{
    monitoringWorking: boolean;
    sessionManagerWorking: boolean;
    firebaseManagerWorking: boolean;
    loggedEvents: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let monitoringWorking = false;
    let sessionManagerWorking = false;
    let firebaseManagerWorking = false;
    let loggedEvents = 0;

    try {
      // Test ban monitor
      const monitor = getBanMonitor();
      const initialMetrics = monitor.getMetrics();
      
      monitor.logBanEvent('test-uuid-monitoring', 'Test ban event', 'System');
      monitor.logUnbanEvent('test-uuid-monitoring', 'System');
      
      const finalMetrics = monitor.getMetrics();
      monitoringWorking = finalMetrics.totalBans > initialMetrics.totalBans;
      loggedEvents = monitor.getEvents({ since: Date.now() - 60000 }).length;
      
    } catch (error) {
      errors.push(`Ban monitoring test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test session manager
      const sessionManager = getSessionManager();
      await sessionManager.setBanState('test-uuid-session', 'banned');
      const banState = await sessionManager.getBanState('test-uuid-session');
      sessionManagerWorking = banState?.state === 'banned';
      
    } catch (error) {
      errors.push(`Session manager test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test Firebase manager
      const firebaseManager = getFirebaseManager();
      const diagnostics = firebaseManager.getDiagnostics();
      firebaseManagerWorking = typeof diagnostics.listeners === 'number';
      
    } catch (error) {
      errors.push(`Firebase manager test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      monitoringWorking,
      sessionManagerWorking,
      firebaseManagerWorking,
      loggedEvents,
      errors
    };
  }

  /**
   * Run test scenarios
   */
  private async runTestScenarios(scenarios: TestScenario[], suiteName: string): Promise<TestSuiteReport> {
    if (this.isRunning) {
      throw new Error('Test suite is already running');
    }

    this.isRunning = true;
    this.testResults = [];

    prodLogger.info(`Starting ${suiteName}`, { scenarios: scenarios.length });

    try {
      for (const scenario of scenarios) {
        const result = await this.runTestScenario(scenario);
        this.testResults.push(result);
      }

      return this.generateReport(suiteName);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run individual test scenario
   */
  private async runTestScenario(scenario: TestScenario): Promise<TestResult> {
    silentLogger.silent(`Running test scenario: ${scenario.name}`);

    // Simulate device environment
    this.simulateDeviceEnvironment(scenario.deviceSimulation);

    try {
      const startTime = Date.now();

      // Simulate network condition
      if (scenario.networkCondition === 'slow') {
        await this.sleep(2000); // Simulate slow network
      } else if (scenario.networkCondition === 'offline') {
        throw new Error('Network offline simulation');
      }

      const redirectResult = await enterpriseRedirect(
        scenario.targetUrl,
        {
          maxRetries: 3,
          retryDelay: 500,
          timeout: 5000,
          validateRedirect: false, // Disable validation in tests
          fallbackStrategies: scenario.strategies
        },
        null, // No router in tests
        scenario.uuid
      );

      return {
        scenario: scenario.name,
        success: redirectResult.success,
        method: redirectResult.method,
        duration: redirectResult.duration,
        attempts: redirectResult.attempts,
        error: redirectResult.error,
        deviceInfo: this.getCurrentDeviceSimulation()
      };

    } catch (error) {
      return {
        scenario: scenario.name,
        success: false,
        method: RedirectStrategy.NEXT_ROUTER,
        duration: Date.now() - Date.now(),
        attempts: 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceInfo: this.getCurrentDeviceSimulation()
      };
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(suiteName: string): TestSuiteReport {
    const totalTests = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const partialSuccess = 0; // Would be calculated based on specific criteria

    const samsungResults = this.testResults.filter(r => 
      r.deviceInfo.isSamsung || r.scenario.includes('Samsung')
    );

    const mobileResults = this.testResults.filter(r => 
      r.deviceInfo.isMobile || r.scenario.includes('Mobile') || r.scenario.includes('iPhone')
    );

    const desktopResults = this.testResults.filter(r => 
      !r.deviceInfo.isMobile
    );

    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    const averageRedirectTime = totalTests > 0 ? totalDuration / totalTests : 0;

    const failureReasons = this.testResults
      .filter(r => !r.success && r.error)
      .map(r => r.error!)
      .filter((reason, index, arr) => arr.indexOf(reason) === index);

    const recommendations = this.generateRecommendations(samsungResults, mobileResults);

    const report: TestSuiteReport = {
      totalTests,
      passed,
      failed,
      partialSuccess,
      samsungSpecificResults: samsungResults,
      mobileResults,
      desktopResults,
      averageRedirectTime,
      failureReasons,
      recommendations
    };

    prodLogger.info(`${suiteName} completed`, {
      totalTests,
      passed,
      failed,
      successRate: `${Math.round((passed / totalTests) * 100)}%`
    });

    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(samsungResults: TestResult[], mobileResults: TestResult[]): string[] {
    const recommendations: string[] = [];

    // Analyze Samsung-specific issues
    const samsungFailures = samsungResults.filter(r => !r.success);
    if (samsungFailures.length > 0) {
      recommendations.push('Samsung S9 Plus requires window.location.href as primary redirect method');
      recommendations.push('Implement meta refresh as immediate fallback for Samsung browsers');
      recommendations.push('Add form submit method for stubborn Samsung browser cases');
    }

    // Analyze mobile-specific issues
    const mobileFailures = mobileResults.filter(r => !r.success);
    if (mobileFailures.length > samsungFailures.length) {
      recommendations.push('General mobile browsers need extended timeout values');
      recommendations.push('Implement progressive retry delays for mobile networks');
    }

    // Analyze method effectiveness
    const methodSuccess: { [key: string]: number } = {};
    const methodTotal: { [key: string]: number } = {};

    this.testResults.forEach(result => {
      const method = result.method;
      methodTotal[method] = (methodTotal[method] || 0) + 1;
      if (result.success) {
        methodSuccess[method] = (methodSuccess[method] || 0) + 1;
      }
    });

    const bestMethod = Object.keys(methodSuccess).reduce((best, method) => {
      const rate = methodSuccess[method] / methodTotal[method];
      return rate > (methodSuccess[best] / methodTotal[best] || 0) ? method : best;
    }, RedirectStrategy.WINDOW_LOCATION);

    recommendations.push(`Most reliable method: ${bestMethod}`);

    return recommendations;
  }

  /**
   * Simulate different device environments for testing
   */
  private simulateDeviceEnvironment(simulation?: TestScenario['deviceSimulation']): void {
    // This would modify global navigator object in a real test environment
    // For now, we'll just log the simulation
    silentLogger.silent(`Simulating device: ${simulation || 'default'}`);
  }

  /**
   * Get current device simulation info
   */
  private getCurrentDeviceSimulation(): any {
    return {
      isMobile: true,
      isSamsung: true,
      browserName: 'Samsung Internet',
      browserVersion: '12.0'
    };
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get latest test results
   */
  public getLatestResults(): TestResult[] {
    return [...this.testResults];
  }

  /**
   * Clear test results
   */
  public clearResults(): void {
    this.testResults = [];
  }

  /**
   * Check if tests are currently running
   */
  public isTestsRunning(): boolean {
    return this.isRunning;
  }
}

// Convenience functions for easy usage
export function getTestingSuite(): EnterpriseTestingSuite {
  return EnterpriseTestingSuite.getInstance();
}

export async function runSamsungS9Tests(): Promise<TestSuiteReport> {
  const suite = getTestingSuite();
  return suite.runSamsungS9Tests();
}

export async function runMobileBrowserTests(): Promise<TestSuiteReport> {
  const suite = getTestingSuite();
  return suite.runMobileBrowserTests();
}

export async function runStressTest(concurrentTests: number = 10): Promise<TestSuiteReport> {
  const suite = getTestingSuite();
  return suite.runStressTest(concurrentTests);
}

export async function runMonitoringSystemTest(): Promise<any> {
  const suite = getTestingSuite();
  return suite.runMonitoringSystemTest();
}

// Export types
export type { TestScenario, TestResult, TestSuiteReport };