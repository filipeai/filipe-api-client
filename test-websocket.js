const FilipeApiClient = require('./lib');

// Configuration
const API_KEY = 'key'; // Your API key
const BASE_URL = 'http://localhost:8000'; // Your server base URL

// Utility functions for test reporting
const log = (message) => console.log(`[INFO] ${message}`);
const success = (message) => console.log(`[✓] ${message}`);
const error = (message) => console.error(`[✗] ${message}`);
const warn = (message) => console.warn(`[!] ${message}`);

// Create API client
const api = new FilipeApiClient(API_KEY, { baseUrl: BASE_URL });

// Test cases
async function testWebSocketConnection() {
  log('Testing WebSocket connection...');
  
  try {
    const socket = await api.websocket.connect({
      reconnectInterval: 3000,
      maxReconnectAttempts: 1 // Only try once for testing
    });
    
    success('WebSocket connection established');
    return socket;
  } catch (err) {
    error(`WebSocket connection failed: ${err.message}`);
    
    // Check for specific error conditions to provide more helpful debugging
    if (err.message.includes('ECONNREFUSED')) {
      warn('Connection refused. Check if WebSocket server is running on the expected URL');
    }
    
    return null;
  }
}

async function testSubscription(socket, sourceService) {
  log(`Testing subscription to "${sourceService}"...`);
  
  if (!socket) {
    error('Cannot test subscription - WebSocket connection not established');
    return false;
  }
  
  return new Promise((resolve) => {
    const messageHandler = (data) => {
      if (data.type === 'system' && data.message === `Subscribed to ${sourceService}`) {
        success(`Successfully subscribed to "${sourceService}"`);
        api.websocket.off('message', messageHandler);
        resolve(true);
      }
    };
    
    // Set timeout to handle cases where subscription confirmation isn't received
    const timeout = setTimeout(() => {
      warn(`No subscription confirmation received for "${sourceService}" after 5 seconds`);
      api.websocket.off('message', messageHandler);
      resolve(false);
    }, 5000);
    
    // Listen for subscription confirmation
    api.websocket.on('message', messageHandler);
    
    // Send subscription request
    try {
      api.websocket.subscribe(sourceService);
      log(`Subscription request sent for "${sourceService}"`);
    } catch (err) {
      error(`Failed to send subscription request: ${err.message}`);
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

async function testUnsubscription(socket, sourceService) {
  log(`Testing unsubscription from "${sourceService}"...`);
  
  if (!socket) {
    error('Cannot test unsubscription - WebSocket connection not established');
    return false;
  }
  
  return new Promise((resolve) => {
    const messageHandler = (data) => {
      if (data.type === 'system' && data.message === `Unsubscribed from ${sourceService}`) {
        success(`Successfully unsubscribed from "${sourceService}"`);
        api.websocket.off('message', messageHandler);
        resolve(true);
      }
    };
    
    // Set timeout to handle cases where unsubscription confirmation isn't received
    const timeout = setTimeout(() => {
      warn(`No unsubscription confirmation received for "${sourceService}" after 5 seconds`);
      api.websocket.off('message', messageHandler);
      resolve(false);
    }, 5000);
    
    // Listen for unsubscription confirmation
    api.websocket.on('message', messageHandler);
    
    // Send unsubscription request
    try {
      api.websocket.unsubscribe(sourceService);
      log(`Unsubscription request sent for "${sourceService}"`);
    } catch (err) {
      error(`Failed to send unsubscription request: ${err.message}`);
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

async function testNotificationCreationAndReception(sourceService) {
  log(`Testing notification creation and reception for "${sourceService}"...`);
  
  // Create a notification via the API
  const notificationPayload = {
    source_service: sourceService,
    sender_id: 'test-user',
    content: `Test notification from ${sourceService}`,
    metadata: { test: true, timestamp: Date.now() }
  };
  
  return new Promise((resolve) => {
    // Set up WebSocket listener for notification
    const messageHandler = (data) => {
      if (data.type === 'notification' && 
          data.source_service === sourceService && 
          data.content.includes(`Test notification from ${sourceService}`)) {
        
        success(`Received notification from "${sourceService}" via WebSocket`);
        
        // Try to acknowledge the notification
        try {
          api.notifications.acknowledgeNotification(data.notification_id, api.websocket.socket);
          success(`Acknowledged notification ${data.notification_id}`);
        } catch (err) {
          error(`Failed to acknowledge notification: ${err.message}`);
        }
        
        api.websocket.off('message', messageHandler);
        resolve(true);
      }
    };
    
    // Set timeout
    const timeout = setTimeout(() => {
      warn(`No notification received from "${sourceService}" after 10 seconds`);
      api.websocket.off('message', messageHandler);
      resolve(false);
    }, 10000);
    
    // Listen for notifications
    api.websocket.on('message', messageHandler);
    
    // Create notification via API
    api.notifications.createNotification(notificationPayload)
      .then(response => {
        log(`Created test notification (ID: ${response.id}) for "${sourceService}"`);
      })
      .catch(err => {
        error(`Failed to create test notification: ${err.message}`);
        clearTimeout(timeout);
        api.websocket.off('message', messageHandler);
        resolve(false);
      });
  });
}

// Main test runner
async function runTests() {
  log('Starting WebSocket tests...');
  
  // Test WebSocket connection
  const socket = await testWebSocketConnection();
  if (!socket) {
    error('WebSocket tests cannot continue without a connection');
    return;
  }
  
  // Test event reception
  let welcomeMessageReceived = false;
  let clientId = null;
  
  api.websocket.on('message', (data) => {
    if (data.type === 'system' && data.message === 'Connected to notification system' && data.client_id) {
      welcomeMessageReceived = true;
      clientId = data.client_id;
      success(`Received welcome message with client ID: ${clientId}`);
    }
  });
  
  // Wait a bit to ensure we get the welcome message
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (!welcomeMessageReceived) {
    warn('Did not receive welcome message. This may indicate a protocol mismatch.');
  }
  
  // Test subscriptions to different services
  const testServices = ['email_service', 'billing'];
  
  for (const service of testServices) {
    const subscribed = await testSubscription(socket, service);
    
    if (subscribed) {
      // If subscription worked, test notification reception
      await testNotificationCreationAndReception(service);
      
      // Test unsubscription after testing notification
      await testUnsubscription(socket, service);
    }
  }
  
  // Clean up
  log('Tests completed, closing WebSocket connection');
  api.websocket.disconnect();
}

// Run tests
runTests().catch(err => {
  error(`Unexpected error during tests: ${err.message}`);
});