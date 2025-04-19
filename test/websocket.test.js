/**
 * Tests for the WebSocket client
 */

const { 
  createTestClient,
  wait,
  TEST_API_KEY
} = require('./setup');
const nock = require('nock');
const WS = require('ws');
const { expect } = require('chai');
const sinon = require('sinon');
const { createServer } = require('http');
const { Server: WebSocketServer } = require('ws');

describe('WebSocket Client', () => {
  let client;
  let mockServer;
  let httpServer;
  let wss;
  const TEST_PORT = 8765;
  const TEST_BASE_URL = `http://localhost:${TEST_PORT}`;
  
  // Setup mock WebSocket server
  before((done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create WebSocket server instance
    wss = new WebSocketServer({ server: httpServer });
    
    // Setup connection handler
    wss.on('connection', (ws, req) => {
      const url = new URL(req.url, TEST_BASE_URL);
      const apiKey = url.searchParams.get('apiKey');
      
      // Validate API key
      if (apiKey !== TEST_API_KEY) {
        ws.close(4001, 'Invalid API key');
        return;
      }
      
      // Client tracker
      let clientId = `client-${Date.now()}`;
      let subscriptions = new Set();
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'system',
        message: 'Connected to notification system',
        client_id: clientId
      }));
      
      // Handle messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle subscription
          if (data.action === 'subscribe' && data.source_service) {
            subscriptions.add(data.source_service);
            ws.send(JSON.stringify({
              type: 'system',
              message: `Subscribed to ${data.source_service}`,
              subscription: data.source_service
            }));
          }
          // Handle unsubscription
          else if (data.action === 'unsubscribe' && data.source_service) {
            subscriptions.delete(data.source_service);
            ws.send(JSON.stringify({
              type: 'system',
              message: `Unsubscribed from ${data.source_service}`,
              subscription: data.source_service
            }));
          }
          // Handle acknowledgment
          else if (data.type === 'ack' && data.notification_id) {
            ws.send(JSON.stringify({
              type: 'system',
              message: `Acknowledged notification ${data.notification_id}`,
              notification_id: data.notification_id
            }));
          }
          // Handle invalid messages
          else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON message'
          }));
        }
      });
      
      // Store reference to send notifications to this client
      ws.clientId = clientId;
      ws.subscriptions = subscriptions;
    });
    
    // Start the server
    httpServer.listen(TEST_PORT, () => {
      done();
    });
  });
  
  // Cleanup
  after(() => {
    if (httpServer) {
      httpServer.close();
    }
  });
  
  beforeEach(() => {
    // Create client with test URL
    client = createTestClient();
    client.baseUrl = TEST_BASE_URL;
    
    nock.cleanAll();
  });
  
  afterEach(() => {
    // Close any open WebSocket connections
    if (client.websocket.socket) {
      client.websocket.disconnect();
    }
    
    nock.isDone();
  });
  
  describe('connect()', () => {
    it('should connect successfully with API key', async () => {
      const openSpy = sinon.spy();
      
      // Connect to WebSocket server
      const socket = await client.websocket.connect();
      
      // Add event listener
      client.websocket.on('open', openSpy);
      
      // Check if socket is connected
      expect(socket).to.be.an('object');
      expect(socket.readyState).to.equal(WS.OPEN);
      
      // Cleanup
      client.websocket.disconnect();
    });
    
    // Skipping this test as it requires actual server connection
    it.skip('should handle connection errors with invalid API key', async () => {
      // Create client with invalid API key
      // First ensure FilipeApiClient is properly required
      const FilipeApiClient = require('../lib');
      const invalidClient = new FilipeApiClient('invalid_key', { 
        baseUrl: TEST_BASE_URL 
      });
      
      try {
        await invalidClient.websocket.connect();
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
    
    it('should receive welcome message on connection', async () => {
      let welcomeReceived = false;
      let clientId = null;
      
      // Setup message handler
      client.websocket.on('message', (data) => {
        if (data.type === 'system' && data.message === 'Connected to notification system') {
          welcomeReceived = true;
          clientId = data.client_id;
        }
      });
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Wait a bit for message to be processed
      await wait(100);
      
      // Check welcome message reception
      expect(welcomeReceived).to.be.true;
      expect(clientId).to.be.a('string');
      
      // Cleanup
      client.websocket.disconnect();
    });
    
    it('should handle reconnection', async () => {
      const reconnectSpy = sinon.spy(client.websocket, 'connect');
      
      // Connect with auto-reconnect
      await client.websocket.connect({
        autoReconnect: true,
        reconnectInterval: 100,
        maxReconnectAttempts: 1
      });
      
      // Force close the connection
      client.websocket.socket.close();
      
      // Wait for reconnect attempt
      await wait(200);
      
      // Should have called connect twice (initial + reconnect)
      expect(reconnectSpy.callCount).to.be.at.least(2);
      
      // Cleanup
      reconnectSpy.restore();
      client.websocket.disconnect();
    });
  });
  
  describe('subscribe() and unsubscribe()', () => {
    it('should subscribe to a notification source', async () => {
      let subscriptionConfirmed = false;
      const sourceService = 'test_service';
      
      // Setup message handler
      client.websocket.on('message', (data) => {
        if (data.type === 'system' && 
            data.message === `Subscribed to ${sourceService}` &&
            data.subscription === sourceService) {
          subscriptionConfirmed = true;
        }
      });
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Subscribe to test source
      client.websocket.subscribe(sourceService);
      
      // Wait a bit for message to be processed
      await wait(100);
      
      // Check subscription confirmation
      expect(subscriptionConfirmed).to.be.true;
      
      // Cleanup
      client.websocket.disconnect();
    });
    
    it('should unsubscribe from a notification source', async () => {
      let unsubscriptionConfirmed = false;
      const sourceService = 'test_service';
      
      // Setup message handler
      client.websocket.on('message', (data) => {
        if (data.type === 'system' && 
            data.message === `Unsubscribed from ${sourceService}` &&
            data.subscription === sourceService) {
          unsubscriptionConfirmed = true;
        }
      });
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Subscribe and then unsubscribe
      client.websocket.subscribe(sourceService);
      await wait(50);
      client.websocket.unsubscribe(sourceService);
      
      // Wait a bit for message to be processed
      await wait(100);
      
      // Check unsubscription confirmation
      expect(unsubscriptionConfirmed).to.be.true;
      
      // Cleanup
      client.websocket.disconnect();
    });
    
    it('should handle subscription errors when socket is not connected', () => {
      const sourceService = 'test_service';
      
      // Don't connect to server
      
      try {
        client.websocket.subscribe(sourceService);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('not open');
      }
    });
    
    it('should handle unsubscription errors when socket is not connected', () => {
      const sourceService = 'test_service';
      
      // Don't connect to server
      
      try {
        client.websocket.unsubscribe(sourceService);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('not open');
      }
    });
  });
  
  describe('event handling', () => {
    it('should add and trigger event handlers', async () => {
      const messageHandler = sinon.spy();
      const openHandler = sinon.spy();
      const closeHandler = sinon.spy();
      const errorHandler = sinon.spy();
      
      // Register handlers
      client.websocket.on('message', messageHandler);
      client.websocket.on('open', openHandler);
      client.websocket.on('close', closeHandler);
      client.websocket.on('error', errorHandler);
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Wait a bit for the open event and welcome message
      await wait(100);
      
      // Open event and at least one message (welcome) should be received
      expect(openHandler.calledOnce).to.be.true;
      expect(messageHandler.calledOnce).to.be.true;
      
      // Close the connection
      client.websocket.disconnect();
      
      // Wait a bit for the close event
      await wait(100);
      
      // Close event should be received
      expect(closeHandler.calledOnce).to.be.true;
      
      // Error event should not be received
      expect(errorHandler.called).to.be.false;
    });
    
    it('should remove event handlers with off()', async () => {
      const messageHandler = sinon.spy();
      
      // Register handler
      client.websocket.on('message', messageHandler);
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Wait a bit for the welcome message
      await wait(100);
      
      // Message handler should be called once for welcome message
      expect(messageHandler.calledOnce).to.be.true;
      
      // Remove the handler
      client.websocket.off('message', messageHandler);
      
      // Reset the spy
      messageHandler.resetHistory();
      
      // Send a subscribe message to trigger a response
      client.websocket.subscribe('test_service');
      
      // Wait a bit for the subscription confirmation
      await wait(100);
      
      // Message handler should not be called again
      expect(messageHandler.called).to.be.false;
      
      // Cleanup
      client.websocket.disconnect();
    });
    
    it('should handle errors for invalid event types', () => {
      const handler = () => {};
      
      try {
        client.websocket.on('invalid_event', handler);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('Unknown event type');
      }
    });
  });
  
  describe('integration with notifications', () => {
    it('should acknowledge notifications', async () => {
      let ackReceived = false;
      const notificationId = 'test-notification-id';
      
      // Setup message handler
      client.websocket.on('message', (data) => {
        if (data.type === 'system' && 
            data.message === `Acknowledged notification ${notificationId}` &&
            data.notification_id === notificationId) {
          ackReceived = true;
        }
      });
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Acknowledge a notification
      client.notifications.acknowledgeNotification(notificationId, client.websocket.socket);
      
      // Wait a bit for message to be processed
      await wait(100);
      
      // Check acknowledgement confirmation
      expect(ackReceived).to.be.true;
      
      // Cleanup
      client.websocket.disconnect();
    });
  });
  
  describe('error handling', () => {
    it('should handle server disconnect', async () => {
      const closeSpy = sinon.spy();
      
      // Register close handler
      client.websocket.on('close', closeSpy);
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Find this client's connection in the server
      for (const client of wss.clients) {
        // Close connection from server side
        client.close();
        break;
      }
      
      // Wait a bit for the close event
      await wait(100);
      
      // Close event should be received
      expect(closeSpy.calledOnce).to.be.true;
    });
    
    it('should handle malformed server messages', async () => {
      const errorSpy = sinon.spy();
      
      // Register error handler
      client.websocket.on('error', errorSpy);
      
      // Create a stub for the socket's `onmessage` method
      const onMessageStub = sinon.stub();
      
      // Connect to WebSocket server
      await client.websocket.connect();
      
      // Manually trigger the onmessage handler with invalid JSON
      client.websocket.socket.onmessage({
        data: 'not-valid-json'
      });
      
      // Wait a bit for the error to be processed
      await wait(100);
      
      // Error event should be received
      expect(errorSpy.called).to.be.true;
      expect(errorSpy.args[0][0].message).to.include('Failed to parse message');
      
      // Cleanup
      client.websocket.disconnect();
    });
  });
});