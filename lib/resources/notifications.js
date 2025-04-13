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
}

module.exports = Notifications; 