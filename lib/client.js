const axios = require('axios');
const Status = require('./resources/status');
const Notifications = require('./resources/notifications');
const NotificationHandlers = require('./resources/notification-handlers');

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

  // Optional WebSocket support
  connectWebSocket(channel) {
    // Assuming the WebSocket server URL can be derived from the base URL.
    // Replace 'http' with 'ws' or 'https' with 'wss'.
    const wsProtocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const baseHost = this.baseUrl.replace(/^https?:\/\//, '');
    // Construct a WS URL; adjust path, query params as needed by your backend.
    const wsUrl = `${wsProtocol}://${baseHost}/stream/${channel}?apiKey=${this.apiKey}`;

    const WebSocket = require('ws');
    const socket = new WebSocket(wsUrl);

    // Optionally, attach default event handlers:
    socket.on('open', () => console.log('WebSocket connection established.'));
    socket.on('error', (err) => console.error('WebSocket error:', err));
    
    return socket;
  }
}

module.exports = FilipeApiClient; 