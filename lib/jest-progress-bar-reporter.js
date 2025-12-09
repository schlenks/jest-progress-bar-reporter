const pc = require('picocolors');
const ProgressBar = require('progress');

const passedFmt = pc.green;
const failedFmt = pc.red;
const pendingFmt = pc.cyan;
const infoFmt = pc.white;

class JestProgressBarReporter {
  constructor(_globalConfig, _options) {
    this._numTotalTestSuites = 0;
    this._bar = null;
    this._error = null;
  }

  onRunStart(aggregatedResults, _options) {
    const rawCount = aggregatedResults?.numTotalTestSuites;
    const numTotalTestSuites =
      typeof rawCount === 'number' && rawCount > 0 && Number.isFinite(rawCount)
        ? rawCount
        : 0;

    console.log();
    console.log(infoFmt(`Found ${numTotalTestSuites} test suites`));
    this._numTotalTestSuites = numTotalTestSuites;
  }

  onTestStart(_test) {
    if (!this._bar) {
      this._bar = new ProgressBar('[:bar] :current/:total :percent', {
        complete: '.',
        incomplete: ' ',
        total: this._numTotalTestSuites,
      });
    }
  }

  onRunComplete(_contexts, results) {
    const {
      numFailedTests,
      numPassedTests,
      numPendingTests,
      testResults,
      numTotalTests,
      startTime,
      snapshot,
    } = results;

    testResults.forEach((result) => {
      if (result?.failureMessage) {
        console.log(result.failureMessage);
      }
    });
    console.log(
      infoFmt(
        `Ran ${numTotalTests} tests in ${this._formatDuration(Date.now() - startTime)}`,
      ),
    );
    if (snapshot?.failure) {
      console.log(
        `\n${failedFmt('Obsolete snapshot(s)')} found, run with -u flag to remove them\n`,
      );
    }
    if (numPassedTests) {
      console.log(
        this._getStatus('passed') + passedFmt(` ${numPassedTests} passing`),
      );
    }
    if (numFailedTests) {
      console.log(
        this._getStatus('failed') + failedFmt(` ${numFailedTests} failing`),
      );
    }
    if (numPendingTests) {
      console.log(
        this._getStatus('pending') + pendingFmt(` ${numPendingTests} pending`),
      );
    }
  }

  onTestResult(_test, _testResult, _aggregatedResult) {
    this._bar?.tick();
  }

  getLastError() {
    return this._error;
  }

  _formatDuration(deltaMs) {
    const totalSeconds = Math.floor(deltaMs / 1000);
    const millis = deltaMs % 1000;
    const millisStr = String(millis).padStart(3, '0');

    if (totalSeconds >= 3600) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}.${millisStr}s`;
    }

    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${seconds}.${millisStr}s`;
    }

    return `${totalSeconds}.${millisStr}s`;
  }

  _getStatus(status) {
    switch (status) {
      case 'passed':
        return passedFmt('✔');
      case 'failed':
        return failedFmt('✘');
      case 'pending':
        return pendingFmt('-');
      default:
        return failedFmt('✘');
    }
  }
}

module.exports = JestProgressBarReporter;
