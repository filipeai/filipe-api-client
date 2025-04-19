class Notifications {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new notification.
   * POST /notifications/
   * @param {object} data - Notification data including:
   *   - source_service (string)
   *   - sender_id (string)
   *   - content (string)
   *   - metadata (object, optional)
   */
  async createNotification(data) {
    const config = {
      method: 'post',
      url: '/notifications/',
      data
    };
    return this.client.request(config);
  }

  /**
   * Get notifications with optional filtering.
   * GET /notifications/
   * @param {object} params - Query parameters, e.g.:
   *   - source_service (string, optional)
   *   - sender_id (string, optional)
   *   - limit (integer, optional)
   *   - offset (integer, optional)
   */
  async getNotifications(params = {}) {
    const config = {
      method: 'get',
      url: '/notifications/',
      params
    };
    return this.client.request(config);
  }

  /**
   * Get a notification by its ID.
   * GET /notifications/{notification_id}
   * @param {string} notificationId - The ID of the notification.
   */
  async getNotification(notificationId) {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }
    const config = {
      method: 'get',
      url: `/notifications/${notificationId}`
    };
    return this.client.request(config);
  }

  /**
   * Acknowledge receipt of a notification via WebSocket.
   * This should be called after receiving a notification via WebSocket
   * to inform the server the notification was received.
   * @param {string} notificationId - The ID of the notification to acknowledge.
   * @param {object} socket - WebSocket instance to send acknowledgement through.
   */
  acknowledgeNotification(notificationId, socket) {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }
    if (!socket || socket.readyState !== 1) { // 1 = OPEN
      throw new Error('WebSocket connection is not open');
    }
    
    socket.send(JSON.stringify({
      type: 'ack',
      notification_id: notificationId
    }));
  }
}

module.exports = Notifications;