class Status {
  constructor(client) {
    this.client = client;
  }

  /**
   * Check API status.
   * GET /status
   */
  async getStatus() {
    // Use the shared HTTP client to make a GET request
    const config = {
      method: 'get',
      url: '/status'
    };
    return this.client.request(config);
  }
}

module.exports = Status; 