# Testing Guide

This document explains how to run and write tests for the Filipe API Client.

## Overview

The Filipe API Client uses the following testing tools:

- **Mocha**: Test runner
- **Chai**: Assertion library
- **Sinon**: Mocking and spying library
- **Nock**: HTTP request mocking
- **NYC (Istanbul)**: Code coverage

## Running Tests

### Install Dependencies

Before running tests, install the required dependencies:

```bash
pnpm install
```

### Run All Tests

To run all tests:

```bash
pnpm test
```

### Run Unit Tests Only

To run unit tests (excluding integration tests):

```bash
pnpm test:unit
```

### Run Integration Tests Only

To run integration tests only:

```bash
pnpm test:integration
```

### Generate Code Coverage

To generate code coverage reports:

```bash
pnpm test:coverage
```

This will create a coverage report in the `coverage` directory and display a summary in the console.

## Test Structure

Tests are organized by resource type:

- `test/status.test.js`: Tests for the Status resource
- `test/notifications.test.js`: Tests for the Notifications resource
- `test/notification-handlers.test.js`: Tests for the NotificationHandlers resource
- `test/websocket.test.js`: Tests for the WebSocket client
- `test/integration.test.js`: End-to-end integration tests

## Writing Tests

### Test Setup

The `test/setup.js` file contains utility functions for creating test clients and test data. Use these helpers in your tests:

```javascript
const { 
  createTestClient,
  createTestNotification,
  createTestHandler
} = require('./setup');

// Create a test client
const client = createTestClient();

// Create test data
const notification = createTestNotification({
  // Override default properties as needed
  source_service: 'my_test_service'
});
```

### Mocking HTTP Requests

Use Nock to mock HTTP requests:

```javascript
const nock = require('nock');

// Mock a GET request
nock('http://localhost:8000')
  .get('/status')
  .reply(200, {
    status: 'ok',
    version: '0.1.0'
  });
  
// Call the API method
const response = await client.status.getStatus();
```

### Mock WebSocket Server

For WebSocket tests, a mock WebSocket server is provided in `websocket.test.js` and `integration.test.js`. You can use this as a reference for writing additional WebSocket tests.

## Test Coverage

We aim for high test coverage of the API client. When adding new features, please ensure they are covered by tests following these guidelines:

1. **Unit Tests**: Test individual methods in isolation with mocked dependencies
2. **Error Handling**: Test both success and error cases
3. **Edge Cases**: Test edge cases like missing parameters or invalid inputs
4. **Integration**: Add integration tests for end-to-end flows

## Continuous Integration

Tests are automatically run on push via GitHub Actions. The configuration is in `.github/workflows/test.yml`.

## Troubleshooting

### Network Errors

If you're seeing network errors in tests, check that:

1. Nock interceptors are properly set up
2. All Nock interceptors are consumed (check `nock.isDone()`)
3. Reset Nock between tests with `nock.cleanAll()`

### WebSocket Tests Hanging

If WebSocket tests are hanging, make sure you're:

1. Properly closing WebSocket connections in the `afterEach` cleanup
2. Using `wait()` helper for async operations instead of arbitrary timeouts
3. Using the `--exit` flag in Mocha (already set in mocha.opts)

## Adding New Tests

When adding new tests:

1. Follow the existing pattern for the resource you're testing
2. Use the test helpers in `setup.js`
3. Make sure to test both success and error cases
4. Clean up resources (like WebSocket connections) after tests
5. Use descriptive test names that explain what's being tested