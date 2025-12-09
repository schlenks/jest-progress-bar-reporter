const pc = require('picocolors');

const passedFmt = pc.green;
const failedFmt = pc.red;
const pendingFmt = pc.cyan;
const infoFmt = pc.white;

const BAR_CHAR = '━';
const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

// ANSI 256-color codes for blue/gold/green theme
const blueColor = (str) => `\x1b[38;5;62m${str}\x1b[0m`; // Deep blue
const goldColor = (str) => `\x1b[38;5;178m${str}\x1b[0m`; // Gold/yellow
const brightGold = (str) => `\x1b[38;5;220m${str}\x1b[0m`; // Bright gold for head
const greenColor = (str) => `\x1b[38;5;42m${str}\x1b[0m`; // Bright green (like search button)

/**
 * Simple progress bar using ANSI escape codes.
 * Compatible with Turborepo TUI.
 */
class SimpleProgressBar {
  constructor(total, width = 40) {
    this.total = total;
    this.width = width;
    this.current = 0;
    this.spinnerIndex = 0;
  }

  tick() {
    this.current++;
    this.spinnerIndex = (this.spinnerIndex + 1) % SPINNER_FRAMES.length;
    this.render();
  }

  render() {
    const ratio = this.total > 0 ? Math.min(this.current / this.total, 1) : 0;
    const filledCount = Math.round(this.width * ratio);
    const emptyCount = this.width - filledCount;

    // Get current spinner frame
    const spinner = greenColor(SPINNER_FRAMES[this.spinnerIndex]);

    // Build the bar with colors (blue/gold theme)
    let bar = '';

    if (filledCount > 0) {
      // Gold filled portion (excluding head)
      if (filledCount > 1) {
        bar += goldColor(BAR_CHAR.repeat(filledCount - 1));
      }
      // Bright gold head at current position
      bar += brightGold(BAR_CHAR);
    }

    // Blue unfilled portion
    if (emptyCount > 0) {
      bar += blueColor(BAR_CHAR.repeat(emptyCount));
    }

    const percent = Math.floor(ratio * 100);
    const output = `\x1b[2K\r${spinner} ${bar} (${this.current}/${this.total}) ${percent}%`;

    process.stderr.write(output);
  }

  complete() {
    process.stderr.write('\n');
  }
}

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
      this._bar = new SimpleProgressBar(this._numTotalTestSuites);
    }
  }

  onRunComplete(_contexts, results) {
    // Complete the progress bar (print newline)
    this._bar?.complete();

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
module.exports.SimpleProgressBar = SimpleProgressBar;
