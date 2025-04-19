const FilipeApiClient = require('./lib');

// Instantiate the client with your API key and optional base URL.
const api = new FilipeApiClient('key', { baseUrl: 'http://localhost:8000' });

// Example 1: Checking the API status
api.status.getStatus()
  .then(statusData => {
    console.log('API Status:', statusData);
  })
  .catch(err => {
    console.error('Error fetching status:', err.message);
  });

// Example 2: Creating a new notification
const notificationPayload = {
  source_service: 'billing',
  sender_id: 'user123',
  content: 'Your invoice is ready.',
  metadata: { invoiceId: 'INV-456' }
};

let createdNotificationId;
api.notifications.createNotification(notificationPayload)
  .then(response => {
    console.log('Notification created:', response);
    createdNotificationId = response.id;
    
    // Example 4: Fetching the notification we just created
    return api.notifications.getNotification(createdNotificationId);
  })
  .then(notification => {
    console.log('Fetched notification by ID:', notification);
  })
  .catch(err => {
    console.error('Error with notification operations:', err.message);
  });

// Example 3: Retrieving notifications with filtering
setTimeout(() => {
  api.notifications.getNotifications({ sender_id: 'user123', limit: 20 })
    .then(notificationList => {
      console.log('Notifications:', notificationList.notifications);
    })
    .catch(err => {
      console.error('Error fetching notifications:', err.message);
    });
}, 1000);

// Example 5: Creating a new notification handler
const handlerPayload = {
  source_service: 'billing',
  metadata_filter: { invoiceType: { operator: 'eq', value: 'premium' } },
  prompt: 'Summarize this invoice notification'
};

let createdHandlerId;
api.notificationHandlers.createHandler(handlerPayload)
  .then(response => {
    console.log('Handler created:', response);
    createdHandlerId = response.id;
    
    // Example 7: Updating the handler we just created
    const updatePayload = {
      source_service: 'billing',
      metadata_filter: { invoiceType: { operator: 'eq', value: 'enterprise' } },
      prompt: 'Create a detailed summary of this enterprise invoice notification'
    };
    
    return api.notificationHandlers.updateHandler(createdHandlerId, updatePayload);
  })
  .then(updatedHandler => {
    console.log('Updated handler:', updatedHandler);
    
    // Example 8: Deleting the handler we created and updated
    return api.notificationHandlers.deleteHandler(createdHandlerId);
  })
  .then(() => {
    console.log('Handler deleted successfully');
  })
  .catch(err => {
    console.error('Error with handler operations:', err.message);
  });

// Example 6: Retrieving notification handlers with filtering
setTimeout(() => {
  api.notificationHandlers.getHandlers({ source_service: 'billing', limit: 10 })
    .then(handlerList => {
      console.log('Notification handlers:', handlerList.handlers);
    })
    .catch(err => {
      console.error('Error fetching handlers:', err.message);
    });
}, 1000);

// Example 9: Using WebSockets for real-time notifications
(async () => {
  try {
    // Connect to the WebSocket notification system with API key auth
    const socket = await api.websocket.connect({
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    });
    
    console.log('Connected to WebSocket notification system');
    
    // Subscribe to specific notification sources
    api.websocket.subscribe('email_service');
    api.websocket.subscribe('billing');
    
    // Handle different types of messages
    api.websocket.on('message', (data) => {
      switch (data.type) {
        case 'notification':
          console.log('New notification received:', data);
          
          // Acknowledge receipt
          api.notifications.acknowledgeNotification(data.notification_id, socket);
          break;
          
        case 'processing_result':
          console.log('Processing completed:', data);
          break;
          
        case 'processing_error':
          console.error('Processing failed:', data);
          break;
          
        case 'system':
          console.log('System message:', data.message);
          break;
      }
    });
    
    // Handle connection events
    api.websocket.on('close', () => {
      console.log('Disconnected from notification system');
    });
    
    api.websocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // To disconnect when done
    // Uncomment to test disconnection
    // setTimeout(() => {
    //   api.websocket.disconnect();
    //   console.log('Disconnected from WebSocket');
    // }, 30000);
  } catch (err) {
    console.error('WebSocket connection error:', err.message);
  }
})();