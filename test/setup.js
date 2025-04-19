/**
 * Common test setup and utilities
 */

const FilipeApiClient = require('../lib');

// Test configuration
const TEST_API_KEY = 'key';
const TEST_BASE_URL = 'http://localhost:8000';

/**
 * Creates a test client instance
 * @returns {Object} FilipeApiClient instance
 */
function createTestClient() {
  return new FilipeApiClient(TEST_API_KEY, { 
    baseUrl: TEST_BASE_URL 
  });
}

/**
 * Creates a mock notification for testing
 * @param {Object} overrides - Properties to override in the default notification
 * @returns {Object} Test notification object
 */
function createTestNotification(overrides = {}) {
  return {
    source_service: 'test_service',
    sender_id: 'test_user',
    content: 'Test notification content',
    metadata: {
      priority: 'medium',
      category: 'test',
      tags: ['test', 'automated']
    },
    ...overrides
  };
}

/**
 * Creates a mock notification handler for testing
 * @param {Object} overrides - Properties to override in the default handler
 * @returns {Object} Test notification handler object
 */
function createTestHandler(overrides = {}) {
  return {
    source_service: 'test_service',
    prompt: 'Process this test notification',
    metadata_filter: {
      category: 'test'
    },
    ...overrides
  };
}

/**
 * Utility to wait for a specified amount of time
 * @param {Number} ms - Time to wait in milliseconds
 * @returns {Promise} Promise that resolves after the specified time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a WebSocket connection for testing
 * @returns {Promise<Object>} Promise resolving to the WebSocket connection
 */
async function createTestWebSocketConnection() {
  const client = createTestClient();
  return client.websocket.connect({
    autoReconnect: false // Disable auto-reconnect for tests
  });
}

module.exports = {
  TEST_API_KEY,
  TEST_BASE_URL,
  createTestClient,
  createTestNotification,
  createTestHandler,
  wait,
  createTestWebSocketConnection
};