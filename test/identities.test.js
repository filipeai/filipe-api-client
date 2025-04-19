const { expect } = require('chai');
const nock = require('nock');
const FilipeApiClient = require('../lib');

describe('Identities Resource', () => {
  let client;
  const API_KEY = 'test_api_key';
  const BASE_URL = 'https://api.filipe.ai/v1';
  
  beforeEach(() => {
    client = new FilipeApiClient(API_KEY, { baseUrl: BASE_URL });
    nock.cleanAll();
  });
  
  afterEach(() => {
    nock.cleanAll();
  });
  
  describe('createOrUpdateIdentity()', () => {
    it('should create a new identity', async () => {
      const identityData = {
        source_service: 'email_service',
        source_id: 'john.doe@example.com',
        name: 'John Doe',
        metadata: {
          department: 'Engineering',
          title: 'Senior Developer'
        }
      };
      
      const expectedResponse = {
        id: 'unified-id-123',
        source_service: 'email_service',
        source_id: 'john.doe@example.com',
        name: 'John Doe',
        metadata: {
          department: 'Engineering',
          title: 'Senior Developer'
        },
        created_at: '2023-06-15T10:00:00.123456',
        updated_at: '2023-06-15T10:00:00.123456'
      };
      
      const scope = nock(BASE_URL)
        .post('/identities/', identityData)
        .reply(200, expectedResponse);
        
      const response = await client.identities.createOrUpdateIdentity(identityData);
      
      expect(response).to.deep.equal(expectedResponse);
      expect(scope.isDone()).to.be.true;
    });
    
    it('should validate required parameters', async () => {
      const testCases = [
        { data: { source_id: 'id', name: 'Name' }, missing: 'source_service' },
        { data: { source_service: 'service', name: 'Name' }, missing: 'source_id' },
        { data: { source_service: 'service', source_id: 'id' }, missing: 'name' }
      ];
      
      for (const testCase of testCases) {
        try {
          await client.identities.createOrUpdateIdentity(testCase.data);
          expect.fail(`Should have thrown error for missing ${testCase.missing}`);
        } catch (error) {
          expect(error.message).to.include(`${testCase.missing} is required`);
        }
      }
    });
  });
  
  describe('getIdentityBySource()', () => {
    it('should retrieve an identity by source service and source ID', async () => {
      const sourceService = 'email_service';
      const sourceId = 'john.doe@example.com';
      
      const expectedResponse = {
        id: 'unified-id-123',
        source_service: sourceService,
        source_id: sourceId,
        name: 'John Doe',
        metadata: {
          department: 'Engineering'
        },
        created_at: '2023-06-15T10:00:00.123456',
        updated_at: '2023-06-15T10:00:00.123456'
      };
      
      const scope = nock(BASE_URL)
        .get(`/identities/source/${sourceService}/${sourceId}`)
        .reply(200, expectedResponse);
        
      const response = await client.identities.getIdentityBySource(sourceService, sourceId);
      
      expect(response).to.deep.equal(expectedResponse);
      expect(scope.isDone()).to.be.true;
    });
    
    it('should validate required parameters', async () => {
      try {
        await client.identities.getIdentityBySource(null, 'id');
        expect.fail('Should have thrown error for missing sourceService');
      } catch (error) {
        expect(error.message).to.equal('sourceService is required');
      }
      
      try {
        await client.identities.getIdentityBySource('service', null);
        expect.fail('Should have thrown error for missing sourceId');
      } catch (error) {
        expect(error.message).to.equal('sourceId is required');
      }
    });
  });
  
  describe('getIdentity()', () => {
    it('should retrieve an identity by unified ID', async () => {
      const identityId = 'unified-id-123';
      
      const expectedResponse = {
        id: identityId,
        source_service: 'email_service',
        source_id: 'john.doe@example.com',
        name: 'John Doe',
        metadata: {
          department: 'Engineering'
        },
        created_at: '2023-06-15T10:00:00.123456',
        updated_at: '2023-06-15T10:00:00.123456'
      };
      
      const scope = nock(BASE_URL)
        .get(`/identities/${identityId}`)
        .reply(200, expectedResponse);
        
      const response = await client.identities.getIdentity(identityId);
      
      expect(response).to.deep.equal(expectedResponse);
      expect(scope.isDone()).to.be.true;
    });
    
    it('should validate the identityId parameter', async () => {
      try {
        await client.identities.getIdentity(null);
        expect.fail('Should have thrown error for missing identityId');
      } catch (error) {
        expect(error.message).to.equal('identityId is required');
      }
    });
  });
  
  describe('getIdentities()', () => {
    it('should list identities with optional filters', async () => {
      const params = {
        name: 'John',
        source_service: 'email_service',
        limit: 10,
        offset: 0
      };
      
      const expectedResponse = {
        identities: [
          {
            id: 'unified-id-123',
            source_service: 'email_service',
            source_id: 'john.doe@example.com',
            name: 'John Doe',
            metadata: {
              department: 'Engineering'
            },
            created_at: '2023-06-15T10:00:00.123456',
            updated_at: '2023-06-15T10:00:00.123456'
          },
          {
            id: 'unified-id-456',
            source_service: 'email_service',
            source_id: 'john.smith@example.com',
            name: 'John Smith',
            metadata: {
              department: 'Marketing'
            },
            created_at: '2023-06-14T11:30:00.123456',
            updated_at: '2023-06-14T11:30:00.123456'
          }
        ],
        total: 2,
        limit: 10,
        offset: 0
      };
      
      const scope = nock(BASE_URL)
        .get('/identities/')
        .query(params)
        .reply(200, expectedResponse);
        
      const response = await client.identities.getIdentities(params);
      
      expect(response).to.deep.equal(expectedResponse);
      expect(scope.isDone()).to.be.true;
    });
    
    it('should work without parameters', async () => {
      const expectedResponse = {
        identities: [
          {
            id: 'unified-id-123',
            source_service: 'email_service',
            source_id: 'john.doe@example.com',
            name: 'John Doe'
          }
        ],
        total: 1,
        limit: 50,
        offset: 0
      };
      
      const scope = nock(BASE_URL)
        .get('/identities/')
        .reply(200, expectedResponse);
        
      const response = await client.identities.getIdentities();
      
      expect(response).to.deep.equal(expectedResponse);
      expect(scope.isDone()).to.be.true;
    });
  });
  
  describe('deleteIdentity()', () => {
    it('should delete an identity', async () => {
      const identityId = 'unified-id-123';
      
      const expectedResponse = {
        success: true,
        message: 'Identity deleted successfully'
      };
      
      const scope = nock(BASE_URL)
        .delete(`/identities/${identityId}`)
        .reply(200, expectedResponse);
        
      const response = await client.identities.deleteIdentity(identityId);
      
      expect(response).to.deep.equal(expectedResponse);
      expect(scope.isDone()).to.be.true;
    });
    
    it('should validate the identityId parameter', async () => {
      try {
        await client.identities.deleteIdentity(null);
        expect.fail('Should have thrown error for missing identityId');
      } catch (error) {
        expect(error.message).to.equal('identityId is required');
      }
    });
  });
});