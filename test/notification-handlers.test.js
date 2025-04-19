/**
 * Tests for the NotificationHandlers resource
 */

const { 
  createTestClient, 
  createTestHandler 
} = require('./setup');
const nock = require('nock');
const { expect } = require('chai');

describe('NotificationHandlers Resource', () => {
  let client;
  
  beforeEach(() => {
    client = createTestClient();
    nock.cleanAll();
  });
  
  afterEach(() => {
    nock.isDone();
  });
  
  describe('createHandler()', () => {
    it('should create a handler with simple metadata filter', async () => {
      const handler = createTestHandler();
      
      nock('http://localhost:8000')
        .post('/notification-handlers/', handler)
        .reply(201, {
          id: 'test-handler-id',
          ...handler,
          created_at: '2023-06-15T14:00:00.123456',
          updated_at: '2023-06-15T14:00:00.123456'
        });
      
      const response = await client.notificationHandlers.createHandler(handler);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal('test-handler-id');
      expect(response.source_service).to.equal(handler.source_service);
      expect(response.prompt).to.equal(handler.prompt);
      expect(response.metadata_filter).to.deep.equal(handler.metadata_filter);
      expect(response.created_at).to.be.a('string');
      expect(response.updated_at).to.be.a('string');
    });
    
    it('should create a handler with complex metadata filter', async () => {
      const handler = createTestHandler({
        metadata_filter: {
          priority: {
            operator: 'in',
            value: ['high', 'medium']
          },
          category: {
            operator: 'contains',
            value: 'important'
          },
          sender_domain: {
            operator: 'not_equals',
            value: 'spam.com'
          }
        }
      });
      
      nock('http://localhost:8000')
        .post('/notification-handlers/', handler)
        .reply(201, {
          id: 'complex-handler-id',
          ...handler,
          created_at: '2023-06-15T14:00:00.123456',
          updated_at: '2023-06-15T14:00:00.123456'
        });
      
      const response = await client.notificationHandlers.createHandler(handler);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal('complex-handler-id');
      expect(response.metadata_filter).to.be.an('object');
      expect(response.metadata_filter.priority).to.be.an('object');
      expect(response.metadata_filter.priority.operator).to.equal('in');
      expect(response.metadata_filter.priority.value).to.deep.equal(['high', 'medium']);
    });
    
    it('should handle validation errors', async () => {
      // Missing required fields
      const invalidHandler = {
        // Missing source_service
        prompt: 'Process this notification'
      };
      
      nock('http://localhost:8000')
        .post('/notification-handlers/', invalidHandler)
        .reply(400, {
          error: 'Validation error',
          message: 'source_service is required'
        });
      
      try {
        await client.notificationHandlers.createHandler(invalidHandler);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('400');
        expect(error.message).to.include('Validation error');
      }
    });
    
    it('should handle server errors', async () => {
      const handler = createTestHandler();
      
      nock('http://localhost:8000')
        .post('/notification-handlers/', handler)
        .reply(500, {
          error: 'Internal server error'
        });
      
      try {
        await client.notificationHandlers.createHandler(handler);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('500');
      }
    });
  });
  
  describe('getHandler()', () => {
    it('should retrieve a handler by ID', async () => {
      const handlerId = 'test-handler-id';
      const handler = createTestHandler();
      
      nock('http://localhost:8000')
        .get(`/notification-handlers/${handlerId}`)
        .reply(200, {
          id: handlerId,
          ...handler,
          created_at: '2023-06-15T14:00:00.123456',
          updated_at: '2023-06-15T14:00:00.123456'
        });
      
      const response = await client.notificationHandlers.getHandler(handlerId);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal(handlerId);
      expect(response.source_service).to.equal(handler.source_service);
      expect(response.prompt).to.equal(handler.prompt);
      expect(response.metadata_filter).to.deep.equal(handler.metadata_filter);
    });
    
    it('should handle non-existent handler', async () => {
      const handlerId = 'non-existent-id';
      
      nock('http://localhost:8000')
        .get(`/notification-handlers/${handlerId}`)
        .reply(404, {
          error: 'Not found',
          message: 'Handler not found'
        });
      
      try {
        await client.notificationHandlers.getHandler(handlerId);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('404');
        expect(error.message).to.include('Not found');
      }
    });
    
    it('should validate handler ID is required', async () => {
      try {
        await client.notificationHandlers.getHandler();
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('required');
      }
    });
  });
  
  describe('getHandlers()', () => {
    it('should list handlers without filters', async () => {
      nock('http://localhost:8000')
        .get('/notification-handlers/')
        .reply(200, {
          handlers: [
            {
              id: 'handler-1',
              source_service: 'email_service',
              prompt: 'Process email notifications',
              metadata_filter: { priority: 'high' },
              created_at: '2023-06-15T14:00:00.123456',
              updated_at: '2023-06-15T14:00:00.123456'
            },
            {
              id: 'handler-2',
              source_service: 'slack',
              prompt: 'Process slack notifications',
              metadata_filter: { category: 'alert' },
              created_at: '2023-06-15T14:30:00.123456',
              updated_at: '2023-06-15T14:30:00.123456'
            }
          ]
        });
      
      const response = await client.notificationHandlers.getHandlers();
      
      expect(response).to.be.an('object');
      expect(response.handlers).to.be.an('array');
      expect(response.handlers).to.have.lengthOf(2);
      expect(response.handlers[0].id).to.equal('handler-1');
      expect(response.handlers[1].id).to.equal('handler-2');
    });
    
    it('should list handlers with source_service filter', async () => {
      const sourceService = 'email_service';
      
      nock('http://localhost:8000')
        .get('/notification-handlers/')
        .query({ source_service: sourceService })
        .reply(200, {
          handlers: [
            {
              id: 'handler-1',
              source_service: sourceService,
              prompt: 'Process email notifications',
              metadata_filter: { priority: 'high' },
              created_at: '2023-06-15T14:00:00.123456',
              updated_at: '2023-06-15T14:00:00.123456'
            }
          ]
        });
      
      const response = await client.notificationHandlers.getHandlers({ 
        source_service: sourceService 
      });
      
      expect(response).to.be.an('object');
      expect(response.handlers).to.be.an('array');
      expect(response.handlers).to.have.lengthOf(1);
      expect(response.handlers[0].source_service).to.equal(sourceService);
    });
    
    it('should handle server errors when listing handlers', async () => {
      nock('http://localhost:8000')
        .get('/notification-handlers/')
        .reply(500, {
          error: 'Internal server error'
        });
      
      try {
        await client.notificationHandlers.getHandlers();
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('500');
      }
    });
  });
  
  describe('updateHandler()', () => {
    it('should update a handler\'s prompt', async () => {
      const handlerId = 'test-handler-id';
      const updateData = {
        prompt: 'Updated prompt: Process with new instructions'
      };
      
      nock('http://localhost:8000')
        .put(`/notification-handlers/${handlerId}`, updateData)
        .reply(200, {
          id: handlerId,
          source_service: 'test_service',
          prompt: updateData.prompt,
          metadata_filter: { category: 'test' },
          created_at: '2023-06-15T14:00:00.123456',
          updated_at: '2023-06-15T15:00:00.123456'
        });
      
      const response = await client.notificationHandlers.updateHandler(handlerId, updateData);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal(handlerId);
      expect(response.prompt).to.equal(updateData.prompt);
    });
    
    it('should update a handler\'s metadata filter', async () => {
      const handlerId = 'test-handler-id';
      const updateData = {
        metadata_filter: {
          priority: {
            operator: 'in',
            value: ['high', 'medium', 'low']
          }
        }
      };
      
      nock('http://localhost:8000')
        .put(`/notification-handlers/${handlerId}`, updateData)
        .reply(200, {
          id: handlerId,
          source_service: 'test_service',
          prompt: 'Process test notifications',
          metadata_filter: updateData.metadata_filter,
          created_at: '2023-06-15T14:00:00.123456',
          updated_at: '2023-06-15T15:00:00.123456'
        });
      
      const response = await client.notificationHandlers.updateHandler(handlerId, updateData);
      
      expect(response).to.be.an('object');
      expect(response.id).to.equal(handlerId);
      expect(response.metadata_filter).to.deep.equal(updateData.metadata_filter);
    });
    
    it('should handle non-existent handler', async () => {
      const handlerId = 'non-existent-id';
      const updateData = {
        prompt: 'Updated prompt'
      };
      
      nock('http://localhost:8000')
        .put(`/notification-handlers/${handlerId}`, updateData)
        .reply(404, {
          error: 'Not found',
          message: 'Handler not found'
        });
      
      try {
        await client.notificationHandlers.updateHandler(handlerId, updateData);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('404');
        expect(error.message).to.include('Not found');
      }
    });
    
    it('should validate handler ID is required', async () => {
      try {
        await client.notificationHandlers.updateHandler(null, { prompt: 'Updated prompt' });
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('required');
      }
    });
  });
  
  describe('deleteHandler()', () => {
    it('should delete a handler', async () => {
      const handlerId = 'test-handler-id';
      
      nock('http://localhost:8000')
        .delete(`/notification-handlers/${handlerId}`)
        .reply(200, {
          success: true,
          message: 'Handler deleted successfully'
        });
      
      const response = await client.notificationHandlers.deleteHandler(handlerId);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.message).to.include('deleted');
    });
    
    it('should handle non-existent handler', async () => {
      const handlerId = 'non-existent-id';
      
      nock('http://localhost:8000')
        .delete(`/notification-handlers/${handlerId}`)
        .reply(404, {
          error: 'Not found',
          message: 'Handler not found'
        });
      
      try {
        await client.notificationHandlers.deleteHandler(handlerId);
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('404');
        expect(error.message).to.include('Not found');
      }
    });
    
    it('should validate handler ID is required', async () => {
      try {
        await client.notificationHandlers.deleteHandler();
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('required');
      }
    });
  });
});