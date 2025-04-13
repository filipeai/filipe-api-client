class NotificationHandlers {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new notification handler.
   * POST /notification-handlers/
   * @param {object} data - Handler data including:
   *   - source_service (string) - Service that generates notifications to handle
   *   - metadata_filter (object, optional) - JSON filter to match against notification metadata
   *   - prompt (string) - Prompt text to use for handling the notification
   */
  async createHandler(data) {
    const config = {
      method: 'post',
      url: '/notification-handlers/',
      data
    };
    return this.client.request(config);
  }

  /**
   * Get notification handlers with optional filtering.
   * GET /notification-handlers/
   * @param {object} params - Query parameters, e.g.:
   *   - source_service (string, optional) - Filter by source service
   *   - limit (integer, optional) - Maximum number of handlers to return (1-100)
   *   - offset (integer, optional) - Number of handlers to skip for pagination
   */
  async getHandlers(params = {}) {
    const config = {
      method: 'get',
      url: '/notification-handlers/',
      params
    };
    return this.client.request(config);
  }

  /**
   * Get a notification handler by its ID.
   * GET /notification-handlers/{handler_id}
   * @param {string} handlerId - The ID of the notification handler
   */
  async getHandler(handlerId) {
    if (!handlerId) {
      throw new Error('Handler ID is required');
    }
    const config = {
      method: 'get',
      url: `/notification-handlers/${handlerId}`
    };
    return this.client.request(config);
  }

  /**
   * Update a notification handler.
   * PUT /notification-handlers/{handler_id}
   * @param {string} handlerId - The ID of the notification handler to update
   * @param {object} data - Handler data including:
   *   - source_service (string) - Service that generates notifications to handle
   *   - metadata_filter (object, optional) - JSON filter to match against notification metadata
   *   - prompt (string) - Prompt text to use for handling the notification
   */
  async updateHandler(handlerId, data) {
    if (!handlerId) {
      throw new Error('Handler ID is required');
    }
    const config = {
      method: 'put',
      url: `/notification-handlers/${handlerId}`,
      data
    };
    return this.client.request(config);
  }

  /**
   * Delete a notification handler.
   * DELETE /notification-handlers/{handler_id}
   * @param {string} handlerId - The ID of the notification handler to delete
   */
  async deleteHandler(handlerId) {
    if (!handlerId) {
      throw new Error('Handler ID is required');
    }
    const config = {
      method: 'delete',
      url: `/notification-handlers/${handlerId}`
    };
    return this.client.request(config);
  }
}

module.exports = NotificationHandlers;