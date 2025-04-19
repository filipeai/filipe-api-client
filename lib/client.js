const axios = require('axios');
const Status = require('./resources/status');
const Notifications = require('./resources/notifications');
const NotificationHandlers = require('./resources/notification-handlers');
const WebSocketClient = require('./resources/websocket');
const Identities = require('./resources/identities');

class FilipeApiClient {
  /**
   * @param {string} apiKey - Your API key for authentication.
   * @param {object} options - Optional settings.
   *        options.baseUrl - Base URL for the API. Default: 'https://api.filipe.com/v1'
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.filipe.ai/v1';

    // Create an Axios instance with the base URL and default header for API key.
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: options.timeout || 5000 // Optional timeout setting
    });

    // Initialize resource modules with a reference to this client.
    this.status = new Status(this);
    this.notifications = new Notifications(this);
    this.notificationHandlers = new NotificationHandlers(this);
    this.websocket = new WebSocketClient(this);
    this.identities = new Identities(this);
  }

  // Generic request method (optional abstraction)
  async request(config) {
    try {
      const response = await this.http.request(config);
      return response.data;
    } catch (error) {
      // Wrap or standardize error handling
      if (error.response) {
        // API responded with an error status code
        const message = `Request failed: ${error.response.status} ${JSON.stringify(error.response.data)}`;
        throw new Error(message);
      }
      // Other errors (network, timeout, etc.)
      throw error;
    }
  }
}

module.exports = FilipeApiClient;