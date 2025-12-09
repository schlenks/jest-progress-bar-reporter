import type {
  AggregatedResult,
  Config,
  Reporter,
  ReporterOnStartOptions,
  Test,
  TestContext,
  TestResult,
} from '@jest/reporters';

/**
 * A Jest reporter that displays test progress as a visual progress bar.
 *
 * @example
 * // jest.config.js
 * module.exports = {
 *   reporters: ['@schlenks/jest-progress-bar-reporter']
 * };
 *
 * @example
 * // With options
 * module.exports = {
 *   reporters: [
 *     ['@schlenks/jest-progress-bar-reporter', { /* options *\/ }]
 *   ]
 * };
 */
declare class JestProgressBarReporter
  implements
    Pick<
      Reporter,
      | 'onRunStart'
      | 'onTestStart'
      | 'onRunComplete'
      | 'onTestResult'
      | 'getLastError'
    >
{
  /**
   * Creates a new JestProgressBarReporter instance.
   * @param globalConfig - Jest's global configuration (optional, unused)
   * @param options - Reporter-specific options (optional, unused)
   */
  constructor(globalConfig?: Config.GlobalConfig, options?: object);

  /**
   * Called when the test run starts.
   * Logs the total number of test suites and initializes internal state.
   */
  onRunStart(
    aggregatedResults: AggregatedResult,
    options?: ReporterOnStartOptions,
  ): void;

  /**
   * Called when a test file starts running.
   * Creates the progress bar on first call.
   */
  onTestStart(test?: Test): void;

  /**
   * Called when a test file completes.
   * Advances the progress bar.
   */
  onTestResult(
    test?: Test,
    testResult?: TestResult,
    aggregatedResult?: AggregatedResult,
  ): void;

  /**
   * Called when all tests have completed.
   * Displays failure messages and final summary (passed/failed/pending counts).
   */
  onRunComplete(contexts: Set<TestContext>, results: AggregatedResult): void;

  /**
   * Returns any error that occurred during reporting, or null if none.
   * Called by Jest to check if the reporter encountered errors.
   */
  getLastError(): Error | null;
}

export = JestProgressBarReporter;
