const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Configuration
const PORT = 3000;

// Create HTTP server for API key validation endpoint
const server = http.createServer((req, res) => {
  // Return a simple response for any request
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', version: '0.1.0' }));
});

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Client tracking
const clients = new Map();
const subscriptions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, request, client) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  clients.set(clientId, ws);
  
  console.log(`Client connected: ${clientId}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Connected to notification system',
    client_id: clientId
  }));
  
  // Handle messages from clients
  ws.on('message', (message) => {
    console.log(`Received message from ${clientId}: ${message}`);
    
    try {
      const data = JSON.parse(message);
      
      // Handle subscription requests
      if (data.action === 'subscribe' && data.source_service) {
        const service = data.source_service;
        
        // Add to subscriptions
        if (!subscriptions.has(service)) {
          subscriptions.set(service, new Set());
        }
        subscriptions.get(service).add(clientId);
        
        // Confirm subscription
        ws.send(JSON.stringify({
          type: 'system',
          message: `Subscribed to ${service}`,
          subscription: service
        }));
        
        console.log(`Client ${clientId} subscribed to ${service}`);
      }
      // Handle unsubscribe requests
      else if (data.action === 'unsubscribe' && data.source_service) {
        const service = data.source_service;
        
        // Remove from subscriptions
        if (subscriptions.has(service)) {
          subscriptions.get(service).delete(clientId);
          if (subscriptions.get(service).size === 0) {
            subscriptions.delete(service);
          }
        }
        
        // Confirm unsubscription
        ws.send(JSON.stringify({
          type: 'system',
          message: `Unsubscribed from ${service}`,
          subscription: service
        }));
        
        console.log(`Client ${clientId} unsubscribed from ${service}`);
      }
      // Handle acknowledgements
      else if (data.type === 'ack' && data.notification_id) {
        console.log(`Client ${clientId} acknowledged notification ${data.notification_id}`);
        
        // Echo back with confirmation
        ws.send(JSON.stringify({
          type: 'system',
          message: `Acknowledged notification ${data.notification_id}`,
          notification_id: data.notification_id
        }));
      }
    } catch (err) {
      console.error(`Error processing message: ${err.message}`);
    }
  });
  
  // Handle disconnections
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    
    // Remove from clients
    clients.delete(clientId);
    
    // Remove from all subscriptions
    for (const [service, subscribers] of subscriptions.entries()) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        subscriptions.delete(service);
      }
    }
  });
});

// Handle HTTP server upgrade for WebSockets
server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;
  
  if (pathname === '/ws') {
    // Extract API key from query
    const params = new URLSearchParams(url.parse(request.url).query);
    const apiKey = params.get('apiKey');
    
    if (apiKey === 'test_key') {
      console.log(`Received WebSocket connection with valid API key`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      console.log('WebSocket connection rejected: Invalid API key');
      socket.destroy();
    }
  } else {
    socket.destroy();
  }
});

// Command to simulate sending a notification to subscribers
function sendNotification(sourceService, notificationData) {
  const notification = {
    type: 'notification',
    notification_id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    source_service: sourceService,
    ...notificationData
  };
  
  console.log(`Sending notification from ${sourceService}: ${JSON.stringify(notification)}`);
  
  // Send to subscribers
  if (subscriptions.has(sourceService)) {
    const subscribers = subscriptions.get(sourceService);
    
    for (const clientId of subscribers) {
      const client = clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    }
    
    console.log(`Notification sent to ${subscribers.size} subscribers`);
  } else {
    console.log(`No subscribers for ${sourceService}`);
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket Echo Server running on port ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws?apiKey=test_key`);
  
  // Examples:
  console.log('\nTo simulate sending a notification to subscribers:');
  console.log('Run this in the Node.js console:');
  console.log(`
  // Example for email notification
  sendNotification('email_service', {
    sender_id: 'test-system',
    content: 'You have a new email',
    metadata: { from: 'test@example.com', subject: 'Test Email' }
  });
  
  // Example for billing notification
  sendNotification('billing', {
    sender_id: 'billing-system',
    content: 'Your invoice is ready',
    metadata: { invoiceId: 'INV-12345', amount: 99.99 }
  });
  `);
});

// Export for programmatic use
module.exports = {
  sendNotification
};