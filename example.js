const FilipeApiClient = require('./lib');

// Instantiate the client with your API key and optional base URL.
const api = new FilipeApiClient('YOUR_API_KEY', { baseUrl: 'https://api.filipe.ai/v1' });

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

// (Optional) Example 5: Using the WebSocket feature for real-time updates.
const socket = api.connectWebSocket('updates');
socket.on('message', (data) => {
  console.log('Received real-time update:', data);
}); 