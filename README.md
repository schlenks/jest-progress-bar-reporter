# @schlenks/jest-progress-bar-reporter

A progress bar reporter for Jest that displays test progress with colored status indicators.

## Installation

```bash
pnpm add -D @schlenks/jest-progress-bar-reporter
```

## Usage

Configure [Jest](https://jestjs.io/docs/configuration) to use the reporter:

```javascript
// jest.config.js
module.exports = {
  verbose: false,
  reporters: ['@schlenks/jest-progress-bar-reporter']
};
```

## Example Output

```
Found 10 test suites
[..........] 10/10 100%
Ran 25 tests in 0.685s
✔ 20 passing
- 5 pending
```

## License

MIT
