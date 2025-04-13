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

api.notifications.createNotification(notificationPayload)
  .then(response => {
    console.log('Notification created:', response);
  })
  .catch(err => {
    console.error('Error creating notification:', err.message);
  });

// Example 3: Retrieving notifications with filtering
api.notifications.getNotifications({ sender_id: 'user123', limit: 20 })
  .then(notificationList => {
    console.log('Notifications:', notificationList.notifications);
  })
  .catch(err => {
    console.error('Error fetching notifications:', err.message);
  });

// Example 4: Fetching a notification by ID using async/await
(async () => {
  try {
    const notification = await api.notifications.getNotification('notif-789');
    console.log('Fetched notification:', notification);
  } catch (err) {
    console.error('Error fetching notification:', err.message);
  }
})();


// Example 5: Creating a new notification handler
const handlerPayload = {
  source_service: 'billing',
  metadata_filter: { invoiceType: { operator: 'eq', value: 'premium' } },
  prompt: 'Summarize this invoice notification'
};

api.notificationHandlers.createHandler(handlerPayload)
  .then(response => {
    console.log('Handler created:', response);
  })
  .catch(err => {
    console.error('Error creating handler:', err.message);
  });

// Example 6: Retrieving notification handlers with filtering
api.notificationHandlers.getHandlers({ source_service: 'billing', limit: 10 })
  .then(handlerList => {
    console.log('Notification handlers:', handlerList.handlers);
  })
  .catch(err => {
    console.error('Error fetching handlers:', err.message);
  });

// Example 7: Updating a handler
(async () => {
  try {
    const handlerId = 'handler-123';
    const updatePayload = {
      source_service: 'billing',
      metadata_filter: { invoiceType: { operator: 'eq', value: 'enterprise' } },
      prompt: 'Create a detailed summary of this enterprise invoice notification'
    };
    
    const updatedHandler = await api.notificationHandlers.updateHandler(handlerId, updatePayload);
    console.log('Updated handler:', updatedHandler);
  } catch (err) {
    console.error('Error updating handler:', err.message);
  }
})();

// Example 8: Deleting a handler
(async () => {
  try {
    await api.notificationHandlers.deleteHandler('handler-456');
    console.log('Handler deleted successfully');
  } catch (err) {
    console.error('Error deleting handler:', err.message);
  }
})();

// (Optional) Example 9: Using the WebSocket feature for real-time updates.
const socket = api.connectWebSocket('updates');
socket.on('message', (data) => {
  console.log('Received real-time update:', data);
}); 