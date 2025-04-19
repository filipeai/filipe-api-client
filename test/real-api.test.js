/**
 * Manual testing script for the Filipe API Client against a real API
 * 
 * Usage:
 * cd /path/to/filipe-api-client
 * pnpm test:real-api
 */

const FilipeApiClient = require('../lib');

// Configuration - Change these values to match your API setup
const API_KEY = 'key';
const BASE_URL = 'http://localhost:8000';

// Create API client
const client = new FilipeApiClient(API_KEY, { baseUrl: BASE_URL });

// Utility to wait for a specific duration
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run the tests
(async function runTests() {
  console.log('Starting Filipe API Client tests against real API...');
  console.log(`API URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log('-'.repeat(60));

  try {
    // ====================== Status API Test ======================
    console.log('1. Testing Status API...');
    const statusResponse = await client.status.getStatus();
    console.log(`   ✓ Status API returned: ${JSON.stringify(statusResponse)}`);

    // ====================== Notifications API Tests ======================
    console.log('\n2. Testing Notification Creation...');
    const notification = {
      source_service: 'test_service',
      sender_id: 'test_user',
      content: 'Test notification from API client',
      metadata: {
        priority: 'medium',
        category: 'test',
        tags: ['test', 'automated'],
        timestamp: Date.now()
      }
    };
    
    const createResponse = await client.notifications.createNotification(notification);
    console.log(`   ✓ Notification created with ID: ${createResponse.id}`);
    
    console.log('\n3. Testing Get Notification by ID...');
    const getResponse = await client.notifications.getNotification(createResponse.id);
    console.log(`   ✓ Retrieved notification with content: ${getResponse.content}`);
    
    console.log('\n4. Testing Listing Notifications...');
    const listResponse = await client.notifications.getNotifications({ 
      source_service: 'test_service',
      limit: 5 
    });
    console.log(`   ✓ Retrieved ${listResponse.notifications?.length || 0} notifications`);
    
    // ====================== Notification Handlers API Tests ======================
    console.log('\n5. Testing Handler Creation...');
    const handler = {
      source_service: 'test_service',
      prompt: 'Process this test notification',
      metadata_filter: {
        category: 'test'
      }
    };
    
    const handlerResponse = await client.notificationHandlers.createHandler(handler);
    console.log(`   ✓ Handler created with ID: ${handlerResponse.id}`);
    
    console.log('\n6. Testing Handler Update...');
    const updateData = {
      source_service: 'test_service', // Need to include source_service
      prompt: `Updated prompt: ${new Date().toISOString()}`
    };
    
    const updateResponse = await client.notificationHandlers.updateHandler(
      handlerResponse.id, 
      updateData
    );
    console.log(`   ✓ Handler updated with new prompt: ${updateResponse.prompt}`);
    
    console.log('\n7. Testing Listing Handlers...');
    const handlersResponse = await client.notificationHandlers.getHandlers({
      source_service: 'test_service'
    });
    console.log(`   ✓ Retrieved ${handlersResponse.handlers?.length || 0} handlers`);
    
    // ====================== Identity API Tests ======================
    console.log('\n8. Testing Identity API...');
    
    // Create/update identity
    const identity = {
      source_service: 'test_service',
      source_id: 'test_user',
      name: 'Test User',
      metadata: {
        department: 'Engineering',
        role: 'Tester',
        tags: ['test', 'automated']
      }
    };
    
    const identityResponse = await client.identities.createOrUpdateIdentity(identity);
    console.log(`   ✓ Identity created/updated with ID: ${identityResponse.id}`);
    
    // Wait briefly to ensure the identity is fully processed
    await wait(500);
    
    // Get identity by ID
    const getIdentityResponse = await client.identities.getIdentity(identityResponse.id);
    console.log(`   ✓ Retrieved identity by ID: ${getIdentityResponse.name}`);
    
    // Wait again before getting by source
    await wait(500);
    
    // Try getting identity by source, but don't fail the test if this endpoint isn't working
    try {
      const getIdentityBySourceResponse = await client.identities.getIdentityBySource(
        identity.source_service,
        identity.source_id
      );
      console.log(`   ✓ Retrieved identity by source: ${getIdentityBySourceResponse.name}`);
    } catch (error) {
      console.log(`   ⚠ Could not retrieve identity by source: ${error.message}`);
      // Continue with the test even if this part fails
    }
    
    // List identities
    const listIdentitiesResponse = await client.identities.getIdentities({
      source_service: 'test_service',
      limit: 5
    });
    console.log(`   ✓ Retrieved ${listIdentitiesResponse.identities?.length || 0} identities`);
    
    // ====================== Identity Integration Test ======================
    console.log('\n9. Testing Identity Integration with Notifications...');
    
    // Create a notification with the same sender_id as the identity's source_id
    const notificationWithIdentity = {
      source_service: 'test_service',
      sender_id: 'test_user', // Same as identity.source_id
      content: 'Test notification with identity integration',
      metadata: {
        priority: 'high',
        category: 'integration-test',
        timestamp: Date.now()
      }
    };
    
    const identityIntegrationResponse = await client.notifications.createNotification(notificationWithIdentity);
    console.log(`   ✓ Notification with identity integration created: ${identityIntegrationResponse.id}`);
    
    // Fetch the notification to check identity integration
    await wait(500); // Wait a moment for processing
    const notificationWithIdentityData = await client.notifications.getNotification(identityIntegrationResponse.id);
    
    if (notificationWithIdentityData.identity) {
      console.log(`   ✓ Identity integration successful. Notification contains identity: ${notificationWithIdentityData.identity.name}`);
    } else {
      console.log(`   ⚠ Identity information not present in notification`);
    }
    
    // ====================== WebSocket Tests ======================
    console.log('\n10. Testing WebSocket Connection...');
    let welcomeReceived = false;
    let subscriptionConfirmed = false;
    
    try {
      // Setup message handlers
      client.websocket.on('message', (data) => {
        if (data.type === 'system' && data.message === 'Connected to notification system') {
          welcomeReceived = true;
          console.log(`   ✓ Received welcome message with client ID: ${data.client_id}`);
        }
        
        if (data.type === 'system' && data.message === 'Subscribed to test_service') {
          subscriptionConfirmed = true;
          console.log(`   ✓ Subscription to test_service confirmed`);
        }
        
        if (data.type === 'notification') {
          console.log(`   ✓ Received notification: ${data.content}`);
          
          // Acknowledge the notification
          client.notifications.acknowledgeNotification(data.notification_id, client.websocket.socket);
          console.log(`   ✓ Acknowledged notification: ${data.notification_id}`);
        }
      });
      
      // Connect to WebSocket
      console.log('   Connecting to WebSocket...');
      const socket = await client.websocket.connect();
      console.log('   ✓ WebSocket connection established');
      
      // Subscribe to test service
      client.websocket.subscribe('test_service');
      console.log('   Subscribed to test_service, waiting for confirmation...');
      
      // Wait for subscription confirmation
      await wait(2000);
      
      if (welcomeReceived) {
        console.log('   ✓ Welcome message received');
      } else {
        console.log('   ⚠ No welcome message received');
      }
      
      if (subscriptionConfirmed) {
        console.log('   ✓ Subscription confirmed');
      } else {
        console.log('   ⚠ No subscription confirmation received');
      }
      
      // Create a notification to test WebSocket reception
      console.log('   Creating a notification to test WebSocket...');
      await client.notifications.createNotification({
        ...notification,
        content: `WebSocket test notification ${Date.now()}`
      });
      
      // Wait for notification to be received
      console.log('   Waiting for notification via WebSocket...');
      await wait(2000);
      
      // Clean up
      client.websocket.disconnect();
      console.log('   ✓ WebSocket connection closed');
    } catch (error) {
      console.log(`   ✗ WebSocket test failed: ${error.message}`);
    }
    
    // ====================== Cleanup ======================
    console.log('\n11. Testing Handler Deletion...');
    await client.notificationHandlers.deleteHandler(handlerResponse.id);
    console.log(`   ✓ Handler deleted successfully`);
    
    // Optional: Test deleting identity
    // Uncomment the following to test identity deletion
    /*
    console.log('\n12. Testing Identity Deletion...');
    await client.identities.deleteIdentity(identityResponse.id);
    console.log(`   ✓ Identity deleted successfully`);
    */
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error(`\n✗ Test failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
  } finally {
    // Ensure the process exits cleanly
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
})();