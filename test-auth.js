const axios = require('axios');

// Configuration
const API_KEY = 'key'; // Your API key
const BASE_URL = 'http://localhost:8000'; // Your server base URL

// Utility functions for test reporting
const log = (message) => console.log(`[INFO] ${message}`);
const success = (message) => console.log(`[✓] ${message}`);
const error = (message) => console.error(`[✗] ${message}`);
const warn = (message) => console.warn(`[!] ${message}`);

// Test the auth endpoint with different request formats
async function testAuthEndpoint() {
  log('Testing authentication endpoint for WebSocket tokens...');
  
  const httpClient = axios.create({
    baseURL: BASE_URL,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  // Try different payload formats based on the documentation
  const testCases = [
    // Standard approach from documentation with x-www-form-urlencoded
    { 
      description: 'Form-encoded payload with username/password',
      config: {
        method: 'post',
        url: '/auth/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
          username: 'service_name',
          password: 'anything'
        }).toString()
      }
    },
    // JSON payload variant
    {
      description: 'JSON payload with username/password', 
      config: {
        method: 'post',
        url: '/auth/token',
        data: {
          username: 'service_name',
          password: 'anything'
        }
      }
    },
    // Different endpoint
    {
      description: 'Alternative endpoint /auth/websocket-token',
      config: {
        method: 'post',
        url: '/auth/websocket-token',
        data: {
          username: 'service_name',
          password: 'anything'
        }
      }
    },
    // Different parameters
    {
      description: 'Using client_id instead of username',
      config: {
        method: 'post',
        url: '/auth/token',
        data: {
          client_id: 'service_name',
          secret: 'anything'
        }
      }
    }
  ];
  
  for (const testCase of testCases) {
    log(`Testing: ${testCase.description}`);
    
    try {
      const response = await httpClient.request(testCase.config);
      success(`✓ Success with ${testCase.description}`);
      
      if (response.data.access_token) {
        success(`✓ Got access token: ${response.data.access_token.substring(0, 10)}...`);
        log('Full response:');
        console.log(response.data);
        
        // Return successful config for further tests
        return {
          successful: true,
          config: testCase.config,
          token: response.data.access_token
        };
      } else {
        warn(`Got success response but no access_token found in the response`);
        log('Response data:');
        console.log(response.data);
      }
    } catch (err) {
      error(`✗ Failed with ${testCase.description}: ${err.message}`);
      if (err.response) {
        warn(`Response status: ${err.response.status}`);
        warn(`Response data:`);
        console.log(err.response.data);
      }
    }
  }
  
  return { successful: false };
}

// Test if we can connect to WebSocket with a token
async function testWebSocketWithToken(token) {
  if (!token) {
    error('Cannot test WebSocket connection without a token');
    return false;
  }
  
  log('Testing WebSocket connection with obtained token...');
  
  // Extract host from base URL
  const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const baseHost = BASE_URL.replace(/^https?:\/\//, '').replace(/\/v1$/, '');
  const wsUrl = `${wsProtocol}://${baseHost}/ws?token=${token}`;
  
  return new Promise((resolve) => {
    try {
      const WebSocket = require('ws');
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        success('WebSocket connection established successfully with token');
        
        // Wait for welcome message
        setTimeout(() => {
          socket.close();
          resolve(true);
        }, 1000);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          success(`Received WebSocket message: ${JSON.stringify(data)}`);
        } catch (err) {
          warn(`Failed to parse WebSocket message: ${event.data}`);
        }
      };
      
      socket.onerror = (err) => {
        error(`WebSocket connection error: ${err.message || 'Unknown error'}`);
        resolve(false);
      };
      
      socket.onclose = () => {
        log('WebSocket connection closed');
      };
      
      // Set timeout
      setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          error('WebSocket connection timed out after 5 seconds');
          socket.close();
          resolve(false);
        }
      }, 5000);
      
    } catch (err) {
      error(`Failed to create WebSocket: ${err.message}`);
      resolve(false);
    }
  });
}

// Run the tests
async function runTests() {
  // Test authentication
  const authResult = await testAuthEndpoint();
  
  if (authResult.successful) {
    success('Authentication endpoint test succeeded');
    log('Successful configuration:');
    console.log(authResult.config);
    
    // Update the websocket.js file with the correct authentication approach
    log('\nTo update your WebSocket client with the correct authentication approach:');
    log('1. Edit lib/resources/websocket.js');
    log('2. Update the getAuthToken method to use the following configuration:');
    log(JSON.stringify(authResult.config, null, 2));
    
    // Test WebSocket connection with token
    await testWebSocketWithToken(authResult.token);
  } else {
    error('All authentication endpoint tests failed');
    log('\nPossible issues:');
    log('1. The authentication endpoint might be different from what we expected');
    log('2. The required parameters might be different');
    log('3. The server might not support WebSocket authentication via tokens');
    log('\nCheck the server implementation and documentation for the correct authentication approach');
  }
}

// Run the tests
runTests().catch(err => {
  error(`Unexpected error during tests: ${err.message}`);
});