# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A custom Jest reporter that displays test progress as a visual progress bar with colored status indicators. Replaces Jest's verbose output with a compact, progress-oriented display.

## Commands

```bash
pnpm test          # Run tests + check
pnpm run jest      # Run Jest tests only
pnpm run check     # Biome check (lint + format)
pnpm run fix       # Biome fix (auto-fix issues)
pnpm run example   # Demo the reporter with sample tests
```

## Architecture

Single-class implementation of Jest's reporter interface:

- **lib/index.js** - Entry point (re-exports the reporter)
- **lib/jest-progress-bar-reporter.js** - Core implementation

The `JestProgressBarReporter` class implements four Jest lifecycle hooks:
- `onRunStart()` - Logs test suite count
- `onTestStart()` - Creates progress bar on first test
- `onTestResult()` - Increments progress bar
- `onRunComplete()` - Displays final summary with pass/fail/pending counts

## Testing

- Unit tests in `lib/jest-progress-bar-reporter.spec.js`
- Integration demo in `example/` folder (10 sample test suites)
- Example tests are excluded from main test run via jest config
