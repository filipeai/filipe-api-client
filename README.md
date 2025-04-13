# Filipe API Client

A Node.js client library for the Filipe API.

## Installation

Since this package is private and hosted on GitHub Packages, you'll need to configure npm/pnpm to use GitHub Packages for the @filipeai scope:

1. Create or edit an `.npmrc` file in your project root:

```
@filipeai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

2. Replace `YOUR_GITHUB_TOKEN` with a personal access token that has the `read:packages` scope.

3. Install the package:

```
pnpm add @filipeai/client
```

## Usage

### Initializing the Client

```js
const FilipeApiClient = require('@filipeai/client');

// Initialize with your API key
const api = new FilipeApiClient('YOUR_API_KEY', {
  baseUrl: 'https://api.filipe.ai/v1', // Optional
  timeout: 5000 // Optional, default is 5000ms
});
```

### API Status

Check the API status:

```js
api.status.getStatus()
  .then(statusData => {
    console.log('API Status:', statusData);
  })
  .catch(err => {
    console.error('Error fetching status:', err.message);
  });
```

### Working with Notifications

#### Create a notification

```js
const notificationData = {
  source_service: 'billing',
  sender_id: 'user123',
  content: 'Your invoice is ready.',
  metadata: { invoiceId: 'INV-456' }
};

api.notifications.createNotification(notificationData)
  .then(response => {
    console.log('Notification created:', response);
  })
  .catch(err => {
    console.error('Error creating notification:', err.message);
  });
```

#### Get notifications with filtering

```js
api.notifications.getNotifications({ 
  sender_id: 'user123', 
  limit: 20,
  offset: 0
})
  .then(notificationList => {
    console.log('Notifications:', notificationList.notifications);
  })
  .catch(err => {
    console.error('Error fetching notifications:', err.message);
  });
```

#### Get a notification by ID

```js
api.notifications.getNotification('notification-id')
  .then(notification => {
    console.log('Notification:', notification);
  })
  .catch(err => {
    console.error('Error fetching notification:', err.message);
  });
```

### Real-time Updates (Optional WebSocket Support)

Connect to a WebSocket channel for real-time updates:

```js
const socket = api.connectWebSocket('updates');

socket.on('message', (data) => {
  console.log('Received real-time update:', JSON.parse(data));
});

// Close the connection when done
// socket.close();
```

## Error Handling

All API calls return promises. Errors from the API will be standardized and include the HTTP status code and response data.

## License

MIT