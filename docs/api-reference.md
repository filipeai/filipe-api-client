# Notification System API Documentation

## Authentication

All API endpoints require an API key for authentication, which must be
passed in the X-API-Key header.

```
X-API-Key: your_api_key_here
```

## REST API Endpoints

### 1. Notification Endpoints

#### Create a Notification

**POST /notifications/**

Creates a new notification and triggers its processing.

**Request Body:**
```json
{
  "source_service": "email_service",
  "sender_id": "user123",
  "content": "New email received from example@example.com",
  "metadata": {
    "subject": "Meeting tomorrow",
    "priority": "high",
    "category": "work",
    "tags": ["meeting", "important"],
    "custom_field": {
      "nested": "value"
    }
  }
}
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
}
```

#### Get a Notification

**GET /notifications/{notification_id}**

Retrieves a specific notification by ID.

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "source_service": "email_service",
  "sender_id": "user123",
  "content": "New email received from example@example.com",
  "metadata": {
    "subject": "Meeting tomorrow",
    "priority": "high",
    "category": "work",
    "tags": ["meeting", "important"]
  },
  "received_at": "2023-06-15T14:30:45.123456",
  "identity": {
    "id": "unified-id-123",
    "name": "John Doe"
  }
}
```

#### List Notifications

**GET /notifications/?source_service=email_service&sender_id=user123&limit=10&offset=0**

Lists notifications with optional filtering parameters.

**Query Parameters:**
- source_service (optional): Filter by the source service
- sender_id (optional): Filter by the sender ID
- limit (optional, default: 50): Maximum number of notifications to return
- offset (optional, default: 0): Number of notifications to skip

**Response:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "source_service": "email_service",
    "sender_id": "user123",
    "content": "New email received from example@example.com",
    "metadata": {
      "subject": "Meeting tomorrow",
      "priority": "high"
    },
    "received_at": "2023-06-15T14:30:45.123456",
    "identity": {
      "id": "unified-id-123",
      "name": "John Doe"
    }
  },
  {
    "id": "b2c3d4e5-f678-90ab-cdef-1234567890ab",
    "source_service": "email_service",
    "sender_id": "user123",
    "content": "Another email received",
    "metadata": {
      "subject": "Project update",
      "priority": "medium"
    },
    "received_at": "2023-06-15T15:45:12.345678",
    "identity": {
      "id": "unified-id-123",
      "name": "John Doe"
    }
  }
]
```

#### Get Processing Records for a Notification

**GET /notifications/{notification_id}/processing**

Retrieves processing records for a specific notification.

**Response:**
```json
[
  {
    "id": "proc-a1b2c3d4-e5f6-7890-abcd",
    "notification_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "handler_id": "handler-1234",
    "status": "COMPLETED",
    "result": "Email categorized as 'work meeting'",
    "error": null,
    "created_at": "2023-06-15T14:30:46.123456",
    "completed_at": "2023-06-15T14:30:48.123456"
  },
  {
    "id": "proc-b2c3d4e5-f678-90ab-cdef",
    "notification_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "handler_id": "handler-5678",
    "status": "FAILED",
    "result": null,
    "error": "Failed to process notification: invalid format",
    "created_at": "2023-06-15T14:30:46.123456",
    "completed_at": "2023-06-15T14:30:47.123456"
  }
]
```

### 2. Notification Handler Endpoints

#### Create a Notification Handler

**POST /notification-handlers/**

Creates a new notification handler.

**Request Body - Simple Filter:**
```json
{
  "source_service": "email_service",
  "prompt": "Categorize this email into work, personal, or spam.",
  "metadata_filter": {
    "priority": "high"
  }
}
```

**Request Body - Complex Filter:**
```json
{
  "source_service": "email_service",
  "prompt": "Analyze this email for security threats.",
  "metadata_filter": {
    "priority": {
      "operator": "in",
      "value": ["high", "medium"]
    },
    "category": {
      "operator": "contains",
      "value": "external"
    },
    "sender_domain": {
      "operator": "not_equals",
      "value": "company.com"
    }
  }
}
```

**Response:**
```json
{
  "id": "handler-1234",
  "source_service": "email_service",
  "prompt": "Categorize this email into work, personal, or spam.",
  "metadata_filter": {
    "priority": "high"
  },
  "created_at": "2023-06-15T14:00:00.123456",
  "updated_at": "2023-06-15T14:00:00.123456"
}
```

#### Get a Notification Handler

**GET /notification-handlers/{handler_id}**

Retrieves a specific notification handler.

**Response:**
```json
{
  "id": "handler-1234",
  "source_service": "email_service",
  "prompt": "Categorize this email into work, personal, or spam.",
  "metadata_filter": {
    "priority": "high"
  },
  "created_at": "2023-06-15T14:00:00.123456",
  "updated_at": "2023-06-15T14:00:00.123456"
}
```

#### List Notification Handlers

**GET /notification-handlers/?source_service=email_service**

Lists notification handlers with optional filtering.

**Query Parameters:**
- source_service (optional): Filter by source service

**Response:**
```json
[
  {
    "id": "handler-1234",
    "source_service": "email_service",
    "prompt": "Categorize this email into work, personal, or spam.",
    "metadata_filter": {
      "priority": "high"
    },
    "created_at": "2023-06-15T14:00:00.123456",
    "updated_at": "2023-06-15T14:00:00.123456"
  },
  {
    "id": "handler-5678",
    "source_service": "email_service",
    "prompt": "Extract meeting details from this email.",
    "metadata_filter": {
      "category": "meeting"
    },
    "created_at": "2023-06-15T15:30:00.123456",
    "updated_at": "2023-06-15T15:30:00.123456"
  }
]
```

#### Update a Notification Handler

**PUT /notification-handlers/{handler_id}**

Updates an existing notification handler.

**Request Body:**
```json
{
  "prompt": "Updated prompt: Categorize this email into work, personal, spam, or promotional.",
  "metadata_filter": {
    "priority": {
      "operator": "in",
      "value": ["high", "medium"]
    }
  }
}
```

**Response:**
```json
{
  "id": "handler-1234",
  "source_service": "email_service",
  "prompt": "Updated prompt: Categorize this email into work, personal, spam, or promotional.",
  "metadata_filter": {
    "priority": {
      "operator": "in",
      "value": ["high", "medium"]
    }
  },
  "created_at": "2023-06-15T14:00:00.123456",
  "updated_at": "2023-06-15T16:30:00.123456"
}
```

#### Delete a Notification Handler

**DELETE /notification-handlers/{handler_id}**

Deletes a notification handler.

**Response:**
```json
{
  "success": true,
  "message": "Handler deleted successfully"
}
```

### 3. Identity Endpoints

#### Create or Update an Identity

**POST /identities/**

Creates or updates an identity mapping.

**Request Body:**
```json
{
  "source_service": "email_service",
  "source_id": "john.doe@example.com",
  "name": "John Doe",
  "metadata": {
    "department": "Engineering",
    "title": "Senior Developer",
    "location": "San Francisco"
  }
}
```

**Response:**
```json
{
  "id": "unified-id-123",
  "source_service": "email_service",
  "source_id": "john.doe@example.com",
  "name": "John Doe",
  "metadata": {
    "department": "Engineering",
    "title": "Senior Developer",
    "location": "San Francisco"
  },
  "created_at": "2023-06-15T10:00:00.123456",
  "updated_at": "2023-06-15T10:00:00.123456"
}
```

#### Get Identity by Source

**GET /identities/source/{source_service}/{source_id}**

Retrieves an identity by source service and source ID.

**Response:**
```json
{
  "id": "unified-id-123",
  "source_service": "email_service",
  "source_id": "john.doe@example.com",
  "name": "John Doe",
  "metadata": {
    "department": "Engineering",
    "title": "Senior Developer",
    "location": "San Francisco"
  },
  "created_at": "2023-06-15T10:00:00.123456",
  "updated_at": "2023-06-15T10:00:00.123456"
}
```

#### Get Identity by ID

**GET /identities/{identity_id}**

Retrieves an identity by its unified ID.

**Response:**
```json
{
  "id": "unified-id-123",
  "source_service": "email_service",
  "source_id": "john.doe@example.com",
  "name": "John Doe",
  "metadata": {
    "department": "Engineering",
    "title": "Senior Developer",
    "location": "San Francisco"
  },
  "created_at": "2023-06-15T10:00:00.123456",
  "updated_at": "2023-06-15T10:00:00.123456"
}
```

#### List Identities

**GET /identities/?name=John&limit=10&offset=0**

Lists identities with optional filtering.

**Query Parameters:**
- name (optional): Filter by name (partial match)
- source_service (optional): Filter by source service
- limit (optional, default: 50): Maximum number of identities to return
- offset (optional, default: 0): Number of identities to skip

**Response:**
```json
[
  {
    "id": "unified-id-123",
    "source_service": "email_service",
    "source_id": "john.doe@example.com",
    "name": "John Doe",
    "metadata": {
      "department": "Engineering"
    },
    "created_at": "2023-06-15T10:00:00.123456",
    "updated_at": "2023-06-15T10:00:00.123456"
  },
  {
    "id": "unified-id-456",
    "source_service": "slack",
    "source_id": "U12345",
    "name": "John Smith",
    "metadata": {
      "department": "Marketing"
    },
    "created_at": "2023-06-14T11:30:00.123456",
    "updated_at": "2023-06-14T11:30:00.123456"
  }
]
```

### 4. Status Endpoint

#### Check API Status

**GET /status**

Checks if the API is running.

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

## WebSocket Endpoint

### Connect to WebSocket

**WebSocket /ws?apiKey=your_api_key**

Establishes a real-time WebSocket connection for bidirectional notifications.

### Client Messages

#### 1. Subscribe to Notifications

```json
{
  "action": "subscribe",
  "source_service": "email_service"
}
```

#### 2. Unsubscribe from Notifications

```json
{
  "action": "unsubscribe",
  "source_service": "email_service"
}
```

#### 3. Acknowledge a Notification

```json
{
  "type": "ack",
  "notification_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
}
```

### Server Messages

#### 1. Welcome Message

```json
{
  "type": "system",
  "message": "Connected to notification system",
  "client_id": "client-uuid"
}
```

#### 2. Subscription Confirmation

```json
{
  "type": "system",
  "message": "Subscribed to email_service",
  "subscription": "email_service"
}
```

#### 3. Unsubscription Confirmation

```json
{
  "type": "system",
  "message": "Unsubscribed from email_service",
  "subscription": "email_service"
}
```

#### 4. New Notification

```json
{
  "type": "notification",
  "notification_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "source_service": "email_service",
  "sender_id": "user123",
  "content": "New email received from example@example.com",
  "metadata": {
    "subject": "Meeting tomorrow",
    "priority": "high",
    "category": "work",
    "tags": ["meeting", "important"]
  }
}
```

#### 5. Processing Result

```json
{
  "type": "processing_result",
  "notification_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "handler_id": "handler-1234",
  "status": "COMPLETED",
  "result": "Email categorized as 'work meeting'"
}
```

#### 6. Processing Error

```json
{
  "type": "processing_error",
  "notification_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "handler_id": "handler-5678",
  "status": "FAILED",
  "error": "Failed to process notification: invalid format"
}
```

#### 7. Error Message

```json
{
  "type": "error",
  "message": "Invalid JSON message"
}
```

## Authentication Method

**API Key Authentication:**
- Send API key in the X-API-Key header for all REST API requests
- Connect to WebSocket with API key: /ws?apiKey=your_api_key