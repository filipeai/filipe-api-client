const FilipeApiClient = require('./lib');

// Create test client pointing to our echo server
const api = new FilipeApiClient('test_key', { 
  baseUrl: 'http://localhost:3000' 
});

// Run the client
async function runClient() {
  try {
    console.log('Connecting to WebSocket server...');
    const socket = await api.websocket.connect({
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    });
    
    console.log('Connected to WebSocket server');
    
    // Subscribe to services
    console.log('Subscribing to email_service and billing...');
    api.websocket.subscribe('email_service');
    api.websocket.subscribe('billing');
    
    // Set up message handling
    api.websocket.on('message', (data) => {
      console.log('Received message:', data);
      
      // Handle notifications and acknowledge them
      if (data.type === 'notification' && data.notification_id) {
        console.log(`Acknowledging notification ${data.notification_id}...`);
        api.notifications.acknowledgeNotification(data.notification_id, socket);
      }
    });
    
    // Handle connection events
    api.websocket.on('close', () => {
      console.log('Disconnected from WebSocket server');
    });
    
    api.websocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    console.log('Client is running. Press Ctrl+C to exit.');
    
    // Keep the process running
    process.stdin.resume();
    
    // Handle cleanup on exit
    process.on('SIGINT', () => {
      console.log('Disconnecting...');
      api.websocket.disconnect();
      console.log('Exiting');
      process.exit(0);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Start the client
runClient();