const WebSocket = require('ws');

class WebSocketClient {
  constructor(client) {
    this.client = client;
    this.socket = null;
    this.handlers = {
      message: [],
      open: [],
      close: [],
      error: []
    };
  }

  /**
   * Connect to the WebSocket notification system
   * @param {Object} options - Connection options
   * @param {Boolean} options.autoReconnect - Whether to automatically reconnect (default: true)
   * @param {Number} options.reconnectInterval - Reconnect interval in ms (default: 5000)
   * @param {Number} options.maxReconnectAttempts - Max reconnect attempts (default: 10)
   * @returns {Promise<WebSocket>} The WebSocket connection
   */
  async connect(options = {}) {
    const {
      autoReconnect = true,
      reconnectInterval = 5000,
      maxReconnectAttempts = 10
    } = options;

    this.autoReconnect = autoReconnect;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectAttempts = 0;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    try {
      // Construct WebSocket URL from API base URL with API key
      const wsProtocol = this.client.baseUrl.startsWith('https') ? 'wss' : 'ws';
      const baseHost = this.client.baseUrl.replace(/^https?:\/\//, '').replace(/\/v1$/, '');
      const wsUrl = `${wsProtocol}://${baseHost}/ws?apiKey=${this.client.apiKey}`;

      this.socket = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        // Setup socket event handlers
        this.socket.onopen = (event) => {
          this.reconnectAttempts = 0;
          this._triggerHandlers('open', event);
          resolve(this.socket);
        };

        this.socket.onclose = (event) => {
          this._triggerHandlers('close', event);
          
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(options), this.reconnectInterval);
          }
        };

        this.socket.onerror = (error) => {
          this._triggerHandlers('error', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this._triggerHandlers('message', data);
          } catch (err) {
            this._triggerHandlers('error', new Error(`Failed to parse message: ${err.message}`));
          }
        };
      });
    } catch (error) {
      throw new Error(`WebSocket connection failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to notifications from a specific source service
   * @param {string} sourceService - The service to subscribe to (e.g., 'email_service')
   */
  subscribe(sourceService) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection is not open');
    }

    this.socket.send(JSON.stringify({
      action: 'subscribe',
      source_service: sourceService
    }));
  }

  /**
   * Unsubscribe from notifications from a specific source service
   * @param {string} sourceService - The service to unsubscribe from
   */
  unsubscribe(sourceService) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection is not open');
    }

    this.socket.send(JSON.stringify({
      action: 'unsubscribe',
      source_service: sourceService
    }));
  }

  /**
   * Close the WebSocket connection
   */
  disconnect() {
    if (this.socket) {
      this.autoReconnect = false;
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Add an event handler
   * @param {string} event - Event type: 'message', 'open', 'close', or 'error'
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.handlers[event]) {
      throw new Error(`Unknown event type: ${event}`);
    }
    this.handlers[event].push(handler);
    return this;
  }

  /**
   * Remove an event handler
   * @param {string} event - Event type
   * @param {Function} handler - Handler to remove
   */
  off(event, handler) {
    if (!this.handlers[event]) {
      return this;
    }
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    return this;
  }

  /**
   * Helper method to trigger event handlers
   * @private
   */
  _triggerHandlers(event, data) {
    if (!this.handlers[event]) {
      return;
    }
    this.handlers[event].forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Error in ${event} handler:`, err);
      }
    });
  }
}

module.exports = WebSocketClient;