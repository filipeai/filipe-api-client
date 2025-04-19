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


### Working with Notification Handlers

#### Create a notification handler

```js
const handlerData = {
  source_service: 'billing',
  metadata_filter: { invoiceType: { operator: 'eq', value: 'premium' } },
  prompt: 'Summarize this invoice notification'
};

api.notificationHandlers.createHandler(handlerData)
  .then(response => {
    console.log('Handler created:', response);
  })
  .catch(err => {
    console.error('Error creating handler:', err.message);
  });
```

#### Get notification handlers with filtering

```js
api.notificationHandlers.getHandlers({ 
  source_service: 'billing', 
  limit: 10
})
  .then(handlerList => {
    console.log('Notification handlers:', handlerList.handlers);
  })
  .catch(err => {
    console.error('Error fetching handlers:', err.message);
  });
```

#### Get a notification handler by ID

```js
api.notificationHandlers.getHandler('handler-id')
  .then(handler => {
    console.log('Handler:', handler);
  })
  .catch(err => {
    console.error('Error fetching handler:', err.message);
  });
```

#### Update a notification handler

```js
const updateData = {
  source_service: 'billing',
  metadata_filter: { invoiceType: { operator: 'eq', value: 'enterprise' } },
  prompt: 'Create a detailed summary of this enterprise invoice notification'
};

api.notificationHandlers.updateHandler('handler-id', updateData)
  .then(updatedHandler => {
    console.log('Handler updated:', updatedHandler);
  })
  .catch(err => {
    console.error('Error updating handler:', err.message);
  });
```

#### Delete a notification handler

```js
api.notificationHandlers.deleteHandler('handler-id')
  .then(() => {
    console.log('Handler deleted successfully');
  })
  .catch(err => {
    console.error('Error deleting handler:', err.message);
  });
```

### Working with Identities

Identities allow you to map and unify user identities across different services.

#### Create or update an identity

```js
const identityData = {
  source_service: 'email_service',
  source_id: 'john.doe@example.com',
  name: 'John Doe',
  metadata: {
    department: 'Engineering',
    title: 'Senior Developer',
    location: 'San Francisco'
  }
};

api.identities.createOrUpdateIdentity(identityData)
  .then(response => {
    console.log('Identity created/updated:', response);
  })
  .catch(err => {
    console.error('Error creating/updating identity:', err.message);
  });
```

#### Get an identity by ID

```js
api.identities.getIdentity('identity-id')
  .then(identity => {
    console.log('Identity:', identity);
  })
  .catch(err => {
    console.error('Error fetching identity:', err.message);
  });
```

#### Get an identity by source

```js
api.identities.getIdentityBySource('email_service', 'john.doe@example.com')
  .then(identity => {
    console.log('Identity:', identity);
  })
  .catch(err => {
    console.error('Error fetching identity by source:', err.message);
  });
```

#### List identities with filtering

```js
api.identities.getIdentities({
  source_service: 'email_service',
  name: 'John',
  limit: 10,
  offset: 0
})
  .then(response => {
    console.log('Identities:', response.identities);
  })
  .catch(err => {
    console.error('Error listing identities:', err.message);
  });
```

#### Delete an identity

```js
api.identities.deleteIdentity('identity-id')
  .then(response => {
    console.log('Identity deleted:', response);
  })
  .catch(err => {
    console.error('Error deleting identity:', err.message);
  });
```

### Identity Integration with Notifications

When you create a notification with a `sender_id` that matches an identity's `source_id` (with the same `source_service`), the notification will include the identity information:

```js
// After creating an identity with:
// source_service: 'email_service', source_id: 'john.doe@example.com'

// Create a notification with the same source
const notificationData = {
  source_service: 'email_service',
  sender_id: 'john.doe@example.com',
  content: 'Notification with identity integration',
  metadata: { category: 'example' }
};

api.notifications.createNotification(notificationData)
  .then(response => {
    // Fetch the notification to see the linked identity
    return api.notifications.getNotification(response.id);
  })
  .then(notification => {
    // The notification should include identity information
    console.log('Notification sender identity:', notification.identity);
  });
```

### WebSocket Notification System

Connect to the WebSocket notification system for real-time updates:

```js
// Connect to the WebSocket notification system
api.websocket.connect({
  autoReconnect: true,          // Automatically reconnect on disconnect
  reconnectInterval: 3000,      // Reconnect attempt interval in ms
  maxReconnectAttempts: 5       // Maximum number of reconnect attempts
})
  .then(socket => {
    console.log('Connected to the notification system');
    
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
    // api.websocket.disconnect();
  })
  .catch(err => {
    console.error('WebSocket connection error:', err.message);
  });
```

#### WebSocket Authentication

The WebSocket connection uses your API key for authentication. The same API key used to initialize the client is used for the WebSocket connection.

#### WebSocket Methods

- `api.websocket.connect(options)` - Connect to the WebSocket server
- `api.websocket.subscribe(sourceService)` - Subscribe to a notification source
- `api.websocket.unsubscribe(sourceService)` - Unsubscribe from a notification source
- `api.websocket.on(event, handler)` - Add an event handler
- `api.websocket.off(event, handler)` - Remove an event handler
- `api.websocket.disconnect()` - Close the WebSocket connection

#### WebSocket Events

- `open` - Connection is established
- `message` - Message received from the server
- `close` - Connection is closed
- `error` - Connection error occurred

#### Message Types

- `system` - System messages (connection, subscription confirmation)
- `notification` - New notification messages
- `processing_result` - Notification processing result messages
- `processing_error` - Notification processing error messages

## Error Handling

All API calls return promises. Errors from the API will be standardized and include the HTTP status code and response data.

## License

MIT