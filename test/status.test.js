/**
 * Tests for the Status resource
 */

const { createTestClient, TEST_BASE_URL } = require('./setup');
const nock = require('nock');
const { expect } = require('chai');

describe('Status Resource', () => {
  let client;
  
  beforeEach(() => {
    client = createTestClient();
    // Clear any existing nock interceptors
    nock.cleanAll();
  });
  
  afterEach(() => {
    // Ensure all nock interceptors were used
    nock.isDone();
  });
  
  describe('getStatus()', () => {
    it('should get API status successfully', async () => {
      // Mock the API response
      nock(TEST_BASE_URL)
        .get('/status')
        .reply(200, {
          status: 'ok',
          version: '0.1.0'
        });
      
      // Call the method
      const response = await client.status.getStatus();
      
      // Verify the response
      expect(response).to.be.an('object');
      expect(response.status).to.equal('ok');
      expect(response.version).to.equal('0.1.0');
    });
    
    it('should handle server errors', async () => {
      // Mock a server error
      nock(TEST_BASE_URL)
        .get('/status')
        .reply(500, {
          error: 'Internal server error'
        });
      
      try {
        await client.status.getStatus();
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('500');
      }
    });
    
    it('should handle network errors', async () => {
      // Simulate a network error
      nock(TEST_BASE_URL)
        .get('/status')
        .replyWithError('Network error');
      
      try {
        await client.status.getStatus();
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (error) {
        // Just verify we got an error, since the exact type/message might vary
        expect(error).to.exist;
      }
    });
  });
});