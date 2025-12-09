const JestProgressBarReporter = require('./jest-progress-bar-reporter');

describe('Jest Progress Bar reporter', () => {
  let reporter;
  let consoleSpy;

  beforeEach(() => {
    reporter = new JestProgressBarReporter();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('interface implementation', () => {
    it('should implement onRunComplete', () => {
      expect(reporter.onRunComplete).toBeDefined();
    });

    it('should implement onRunStart', () => {
      expect(reporter.onRunStart).toBeDefined();
    });

    it('should implement onTestResult', () => {
      expect(reporter.onTestResult).toBeDefined();
    });

    it('should implement onTestStart', () => {
      expect(reporter.onTestStart).toBeDefined();
    });

    it('should implement getLastError', () => {
      expect(reporter.getLastError).toBeDefined();
    });
  });

  describe('Jest Reporter best practices', () => {
    it('should accept globalConfig and options in constructor', () => {
      const globalConfig = { rootDir: '/test' };
      const options = { verbose: true };
      const reporterWithConfig = new JestProgressBarReporter(
        globalConfig,
        options,
      );
      expect(reporterWithConfig).toBeInstanceOf(JestProgressBarReporter);
    });

    it('should work without constructor arguments', () => {
      const reporterNoArgs = new JestProgressBarReporter();
      expect(reporterNoArgs).toBeInstanceOf(JestProgressBarReporter);
    });

    it('should accept options parameter in onRunStart', () => {
      const options = { showStatus: true };
      expect(() =>
        reporter.onRunStart({ numTotalTestSuites: 1 }, options),
      ).not.toThrow();
    });

    it('should accept test parameter in onTestStart', () => {
      reporter.onRunStart({ numTotalTestSuites: 1 });
      const test = { path: '/test/file.spec.js' };
      expect(() => reporter.onTestStart(test)).not.toThrow();
    });

    it('should accept all parameters in onTestResult', () => {
      reporter.onRunStart({ numTotalTestSuites: 1 });
      reporter.onTestStart();
      const test = { path: '/test/file.spec.js' };
      const testResult = { numPassingTests: 1 };
      const aggregatedResult = { numTotalTests: 1 };
      expect(() =>
        reporter.onTestResult(test, testResult, aggregatedResult),
      ).not.toThrow();
    });
  });

  describe('getLastError', () => {
    it('should return null when no error occurred', () => {
      expect(reporter.getLastError()).toBeNull();
    });
  });

  describe('onRunStart', () => {
    it('should store numTotalTestSuites', () => {
      reporter.onRunStart({ numTotalTestSuites: 5 });
      expect(reporter._numTotalTestSuites).toBe(5);
    });

    it('should log the test suite count', () => {
      reporter.onRunStart({ numTotalTestSuites: 3 });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('3 test suites'),
      );
    });

    // P1: Input validation tests
    it('should treat negative numTotalTestSuites as 0', () => {
      reporter.onRunStart({ numTotalTestSuites: -5 });
      expect(reporter._numTotalTestSuites).toBe(0);
    });

    it('should treat NaN numTotalTestSuites as 0', () => {
      reporter.onRunStart({ numTotalTestSuites: NaN });
      expect(reporter._numTotalTestSuites).toBe(0);
    });

    it('should treat undefined numTotalTestSuites as 0', () => {
      reporter.onRunStart({});
      expect(reporter._numTotalTestSuites).toBe(0);
    });

    it('should handle missing aggregatedResults gracefully', () => {
      expect(() => reporter.onRunStart(null)).not.toThrow();
      expect(reporter._numTotalTestSuites).toBe(0);
    });
  });

  describe('onTestResult', () => {
    it('should not crash when progress bar is not initialized', () => {
      // Bug: onTestResult crashes if called before onTestStart
      expect(() => reporter.onTestResult()).not.toThrow();
    });

    it('should tick progress bar when initialized', () => {
      reporter.onRunStart({ numTotalTestSuites: 1 });
      reporter.onTestStart();
      // Should not throw
      expect(() => reporter.onTestResult()).not.toThrow();
    });
  });

  describe('onRunComplete', () => {
    const createResults = (overrides = {}) => ({
      numFailedTests: 0,
      numPassedTests: 5,
      numPendingTests: 0,
      numTotalTests: 5,
      testResults: [],
      startTime: Date.now() - 1050, // 1.050 seconds ago
      snapshot: { failure: false },
      ...overrides,
    });

    it('should format duration with zero-padded milliseconds', () => {
      const results = createResults({ startTime: Date.now() - 1050 });
      reporter.onRunComplete(null, results);

      const durationLog = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('Ran'),
      );
      expect(durationLog).toBeDefined();
      // Should have 3 digits after decimal: "1.050s" not "1.50s"
      expect(durationLog[0]).toMatch(/\d+\.\d{3}s/);
    });

    it('should format duration correctly for sub-100ms', () => {
      const results = createResults({ startTime: Date.now() - 50 });
      reporter.onRunComplete(null, results);

      const durationLog = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('Ran'),
      );
      expect(durationLog[0]).toMatch(/0\.0\d{2}s/);
    });

    it('should handle missing snapshot gracefully', () => {
      // Bug: crashes if snapshot is undefined
      const results = createResults();
      delete results.snapshot;

      expect(() => reporter.onRunComplete(null, results)).not.toThrow();
    });

    it('should handle snapshot being null', () => {
      const results = createResults({ snapshot: null });
      expect(() => reporter.onRunComplete(null, results)).not.toThrow();
    });

    it('should log passed count when tests pass', () => {
      const results = createResults({ numPassedTests: 10 });
      reporter.onRunComplete(null, results);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('10 passing'),
      );
    });

    it('should log failed count when tests fail', () => {
      const results = createResults({ numFailedTests: 3 });
      reporter.onRunComplete(null, results);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('3 failing'),
      );
    });

    it('should log pending count when tests are pending', () => {
      const results = createResults({ numPendingTests: 2 });
      reporter.onRunComplete(null, results);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('2 pending'),
      );
    });

    it('should not log passed count when zero', () => {
      const results = createResults({ numPassedTests: 0 });
      reporter.onRunComplete(null, results);

      const passingCall = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('passing'),
      );
      expect(passingCall).toBeUndefined();
    });

    it('should log failure messages from test results', () => {
      const results = createResults({
        testResults: [
          { failureMessage: 'Error: Test failed!' },
          { failureMessage: null },
          { failureMessage: 'Another error' },
        ],
      });
      reporter.onRunComplete(null, results);

      expect(consoleSpy).toHaveBeenCalledWith('Error: Test failed!');
      expect(consoleSpy).toHaveBeenCalledWith('Another error');
    });

    // P0: testResults crash bug
    it('should handle undefined elements in testResults array', () => {
      const results = createResults({
        testResults: [undefined, null, { failureMessage: 'Real error' }],
      });
      expect(() => reporter.onRunComplete(null, results)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Real error');
    });

    it('should handle empty testResults array', () => {
      const results = createResults({ testResults: [] });
      expect(() => reporter.onRunComplete(null, results)).not.toThrow();
    });

    // P2: Duration formatting for long tests
    it('should format duration in minutes for tests over 60 seconds', () => {
      // 90 seconds = 1m 30.000s
      const results = createResults({ startTime: Date.now() - 90000 });
      reporter.onRunComplete(null, results);

      const durationLog = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('Ran'),
      );
      expect(durationLog[0]).toMatch(/1m 30\.\d{3}s/);
    });

    it('should format duration in hours for tests over 60 minutes', () => {
      // 3661 seconds = 1h 1m 1.000s
      const results = createResults({ startTime: Date.now() - 3661000 });
      reporter.onRunComplete(null, results);

      const durationLog = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('Ran'),
      );
      expect(durationLog[0]).toMatch(/1h 1m 1\.\d{3}s/);
    });

    it('should not show minutes/hours for durations under 60 seconds', () => {
      const results = createResults({ startTime: Date.now() - 5500 });
      reporter.onRunComplete(null, results);

      const durationLog = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('Ran'),
      );
      // Should be "5.500s" not "0m 5.500s"
      expect(durationLog[0]).toMatch(/5\.\d{3}s/);
      expect(durationLog[0]).not.toMatch(/\dm/);
    });

    it('should show snapshot failure message when snapshots are obsolete', () => {
      const results = createResults({ snapshot: { failure: true } });
      reporter.onRunComplete(null, results);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Obsolete snapshot'),
      );
    });
  });

  describe('_getStatus', () => {
    it('should return green checkmark for passed', () => {
      const status = reporter._getStatus('passed');
      expect(status).toContain('✔');
    });

    it('should return red X for failed', () => {
      const status = reporter._getStatus('failed');
      expect(status).toContain('✘');
    });

    it('should return cyan dash for pending', () => {
      const status = reporter._getStatus('pending');
      expect(status).toContain('-');
    });

    it('should return red X for unknown status', () => {
      const status = reporter._getStatus('unknown');
      expect(status).toContain('✘');
    });
  });

  // P2: Additional edge case tests
  describe('edge cases', () => {
    it('should handle zero test suites scenario', () => {
      reporter.onRunStart({ numTotalTestSuites: 0 });
      reporter.onTestStart();
      expect(() => reporter.onTestResult()).not.toThrow();
    });

    it('should handle all tests pending scenario', () => {
      reporter.onRunStart({ numTotalTestSuites: 1 });
      const results = {
        numFailedTests: 0,
        numPassedTests: 0,
        numPendingTests: 5,
        numTotalTests: 5,
        testResults: [],
        startTime: Date.now() - 1000,
        snapshot: { failure: false },
      };
      reporter.onRunComplete(null, results);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('5 pending'),
      );
      // Should not log passing or failing
      const passingCall = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('passing'),
      );
      const failingCall = consoleSpy.mock.calls.find((call) =>
        call[0]?.includes?.('failing'),
      );
      expect(passingCall).toBeUndefined();
      expect(failingCall).toBeUndefined();
    });

    it('should handle over-ticking progress bar', () => {
      reporter.onRunStart({ numTotalTestSuites: 2 });
      reporter.onTestStart();
      reporter.onTestResult();
      reporter.onTestResult();
      // Tick more than total - should not crash
      expect(() => reporter.onTestResult()).not.toThrow();
    });

    it('should handle multiple onRunStart calls', () => {
      reporter.onRunStart({ numTotalTestSuites: 5 });
      reporter.onRunStart({ numTotalTestSuites: 10 });
      expect(reporter._numTotalTestSuites).toBe(10);
    });
  });

  // P2: _formatDuration as class method test
  describe('_formatDuration', () => {
    it('should be a class method', () => {
      expect(reporter._formatDuration).toBeDefined();
      expect(typeof reporter._formatDuration).toBe('function');
    });

    it('should format milliseconds correctly', () => {
      const result = reporter._formatDuration(500);
      expect(result).toBe('0.500s');
    });

    it('should format seconds correctly', () => {
      const result = reporter._formatDuration(5500);
      expect(result).toBe('5.500s');
    });

    it('should format minutes correctly', () => {
      const result = reporter._formatDuration(90000);
      expect(result).toBe('1m 30.000s');
    });

    it('should format hours correctly', () => {
      const result = reporter._formatDuration(3661000);
      expect(result).toBe('1h 1m 1.000s');
    });
  });
});
