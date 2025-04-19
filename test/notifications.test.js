/**
 * Tests for the Notifications resource
 */

const { 
  createTestClient, 
  createTestNotification 
} = require('./setup');
const nock = require('nock');
const { expect } = require('chai');

describe('Notifications Resource', () => {
  let client;
  
  beforeEach(() => {
    client = createTestClient();
    nock.cleanAll();
  });
  
  afterEach(() => {
    nock.isDone();
  });
  
  describe('createNotification()', () => {
    it('should create a basic notification', async () => {
      const notification = createTestNotification();
      
      nock('http://localhost:8000')
        .post('/notifications/', notification)
        .reply(201, {
          id: 'test-notification-id'
        });
      
      const response = await client.notifications.createNotification(notification);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal('test-notification-id');
    });
    
    it('should create a notification with complex metadata', async () => {
      const notification = createTestNotification({
        metadata: {
          priority: 'high',
          category: 'complex',
          tags: ['test', 'complex', 'metadata'],
          custom_field: {
            nested: {
              deeply: {
                nested: 'value'
              }
            }
          }
        }
      });
      
      nock('http://localhost:8000')
        .post('/notifications/', notification)
        .reply(201, {
          id: 'complex-notification-id'
        });
      
      const response = await client.notifications.createNotification(notification);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal('complex-notification-id');
    });
    
    it('should handle validation errors', async () => {
      // Missing required fields
      const invalidNotification = {
        // Missing source_service
        sender_id: 'test_user',
        content: 'Test content'
      };
      
      nock('http://localhost:8000')
        .post('/notifications/', invalidNotification)
        .reply(400, {
          error: 'Validation error',
          message: 'source_service is required'
        });
      
      try {
        await client.notifications.createNotification(invalidNotification);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('400');
        expect(error.message).to.include('Validation error');
      }
    });
    
    it('should handle server errors', async () => {
      const notification = createTestNotification();
      
      nock('http://localhost:8000')
        .post('/notifications/', notification)
        .reply(500, {
          error: 'Internal server error'
        });
      
      try {
        await client.notifications.createNotification(notification);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('500');
      }
    });
  });
  
  describe('getNotification()', () => {
    it('should retrieve a notification by ID', async () => {
      const notificationId = 'test-notification-id';
      
      nock('http://localhost:8000')
        .get(`/notifications/${notificationId}`)
        .reply(200, {
          id: notificationId,
          source_service: 'test_service',
          sender_id: 'test_user',
          content: 'Test notification content',
          metadata: {
            priority: 'medium',
            category: 'test'
          },
          received_at: '2023-06-15T14:30:45.123456',
          identity: null
        });
      
      const response = await client.notifications.getNotification(notificationId);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal(notificationId);
      expect(response.source_service).to.equal('test_service');
      expect(response.sender_id).to.equal('test_user');
      expect(response.content).to.equal('Test notification content');
      expect(response.metadata).to.be.an('object');
      expect(response.received_at).to.be.a('string');
    });
    
    it('should handle non-existent notification', async () => {
      const notificationId = 'non-existent-id';
      
      nock('http://localhost:8000')
        .get(`/notifications/${notificationId}`)
        .reply(404, {
          error: 'Not found',
          message: 'Notification not found'
        });
      
      try {
        await client.notifications.getNotification(notificationId);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('404');
        expect(error.message).to.include('Not found');
      }
    });
    
    it('should validate notification ID is required', async () => {
      try {
        await client.notifications.getNotification();
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('required');
      }
    });
  });
  
  describe('getNotifications()', () => {
    it('should list notifications without filters', async () => {
      nock('http://localhost:8000')
        .get('/notifications/')
        .reply(200, {
          notifications: [
            {
              id: 'notification-1',
              source_service: 'test_service',
              sender_id: 'test_user',
              content: 'Test notification 1',
              received_at: '2023-06-15T14:30:45.123456'
            },
            {
              id: 'notification-2',
              source_service: 'test_service',
              sender_id: 'test_user',
              content: 'Test notification 2',
              received_at: '2023-06-15T14:35:45.123456'
            }
          ]
        });
      
      const response = await client.notifications.getNotifications();
      
      expect(response).to.be.an('object');
      expect(response.notifications).to.be.an('array');
      expect(response.notifications).to.have.lengthOf(2);
      expect(response.notifications[0].id).to.equal('notification-1');
      expect(response.notifications[1].id).to.equal('notification-2');
    });
    
    it('should list notifications with source_service filter', async () => {
      const sourceService = 'email_service';
      
      nock('http://localhost:8000')
        .get('/notifications/')
        .query({ source_service: sourceService })
        .reply(200, {
          notifications: [
            {
              id: 'email-notification-1',
              source_service: sourceService,
              sender_id: 'test_user',
              content: 'Email notification 1',
              received_at: '2023-06-15T14:30:45.123456'
            }
          ]
        });
      
      const response = await client.notifications.getNotifications({ 
        source_service: sourceService 
      });
      
      expect(response).to.be.an('object');
      expect(response.notifications).to.be.an('array');
      expect(response.notifications).to.have.lengthOf(1);
      expect(response.notifications[0].source_service).to.equal(sourceService);
    });
    
    it('should list notifications with sender_id filter', async () => {
      const senderId = 'specific_user';
      
      nock('http://localhost:8000')
        .get('/notifications/')
        .query({ sender_id: senderId })
        .reply(200, {
          notifications: [
            {
              id: 'sender-notification-1',
              source_service: 'test_service',
              sender_id: senderId,
              content: 'Sender notification 1',
              received_at: '2023-06-15T14:30:45.123456'
            }
          ]
        });
      
      const response = await client.notifications.getNotifications({ 
        sender_id: senderId 
      });
      
      expect(response).to.be.an('object');
      expect(response.notifications).to.be.an('array');
      expect(response.notifications).to.have.lengthOf(1);
      expect(response.notifications[0].sender_id).to.equal(senderId);
    });
    
    it('should list notifications with pagination (limit and offset)', async () => {
      nock('http://localhost:8000')
        .get('/notifications/')
        .query({ limit: 5, offset: 10 })
        .reply(200, {
          notifications: [
            {
              id: 'paginated-notification-1',
              source_service: 'test_service',
              sender_id: 'test_user',
              content: 'Paginated notification 1',
              received_at: '2023-06-15T14:30:45.123456'
            }
          ],
          total: 15,
          limit: 5,
          offset: 10
        });
      
      const response = await client.notifications.getNotifications({ 
        limit: 5, 
        offset: 10 
      });
      
      expect(response).to.be.an('object');
      expect(response.notifications).to.be.an('array');
      expect(response.notifications).to.have.lengthOf(1);
      expect(response.total).to.equal(15);
      expect(response.limit).to.equal(5);
      expect(response.offset).to.equal(10);
    });
    
    it('should handle server errors when listing notifications', async () => {
      nock('http://localhost:8000')
        .get('/notifications/')
        .reply(500, {
          error: 'Internal server error'
        });
      
      try {
        await client.notifications.getNotifications();
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('500');
      }
    });
  });
  
  describe('acknowledgeNotification()', () => {
    it('should acknowledge a notification via WebSocket', () => {
      const notificationId = 'test-notification-id';
      
      // Create a mock WebSocket object
      const mockSocket = {
        readyState: 1, // OPEN
        send: function(message) {
          const data = JSON.parse(message);
          expect(data).to.be.an('object');
          expect(data.type).to.equal('ack');
          expect(data.notification_id).to.equal(notificationId);
        }
      };
      
      // Create a spy manually since sinon is causing issues
      let wasCalled = false;
      const originalSend = mockSocket.send;
      mockSocket.send = function(data) {
        wasCalled = true;
        return originalSend.call(this, data);
      };
      
      client.notifications.acknowledgeNotification(notificationId, mockSocket);
      
      expect(wasCalled).to.be.true;
      // Restore original
      mockSocket.send = originalSend;
    });
    
    it('should validate notification ID is required', () => {
      const mockSocket = {
        readyState: 1 // OPEN
      };
      
      try {
        client.notifications.acknowledgeNotification(null, mockSocket);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('required');
      }
    });
    
    it('should validate socket is open', () => {
      const notificationId = 'test-notification-id';
      
      // Socket not open
      const mockClosedSocket = {
        readyState: 3 // CLOSED
      };
      
      try {
        client.notifications.acknowledgeNotification(notificationId, mockClosedSocket);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('not open');
      }
      
      // Socket is null
      try {
        client.notifications.acknowledgeNotification(notificationId, null);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('not open');
      }
    });
  });
});