/**
 * Identities resource for managing identity mappings
 */
class Identities {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create or update an identity mapping
   * POST /identities/
   * @param {object} data - Identity data including:
   *   - source_service (string) - Service that this identity comes from
   *   - source_id (string) - Original ID from the source service
   *   - name (string) - Display name for the identity
   *   - metadata (object, optional) - Additional data about the identity
   * @returns {Promise<object>} The created or updated identity
   */
  async createOrUpdateIdentity(data) {
    if (!data.source_service) {
      throw new Error('source_service is required');
    }
    if (!data.source_id) {
      throw new Error('source_id is required');
    }
    if (!data.name) {
      throw new Error('name is required');
    }

    const config = {
      method: 'post',
      url: '/identities/',
      data
    };
    return this.client.request(config);
  }

  /**
   * Get an identity by source service and source ID
   * GET /identities/source/{source_service}/{source_id}
   * @param {string} sourceService - The service the identity is from
   * @param {string} sourceId - The original ID in the source service
   * @returns {Promise<object>} The identity
   */
  async getIdentityBySource(sourceService, sourceId) {
    if (!sourceService) {
      throw new Error('sourceService is required');
    }
    if (!sourceId) {
      throw new Error('sourceId is required');
    }

    const config = {
      method: 'get',
      url: `/identities/source/${sourceService}/${sourceId}`
    };
    return this.client.request(config);
  }

  /**
   * Get an identity by its unified ID
   * GET /identities/{identity_id}
   * @param {string} identityId - The unified ID of the identity
   * @returns {Promise<object>} The identity
   */
  async getIdentity(identityId) {
    if (!identityId) {
      throw new Error('identityId is required');
    }

    const config = {
      method: 'get',
      url: `/identities/${identityId}`
    };
    return this.client.request(config);
  }

  /**
   * List identities with optional filtering
   * GET /identities/
   * @param {object} params - Query parameters, e.g.:
   *   - name (string, optional) - Filter by name (partial match)
   *   - source_service (string, optional) - Filter by source service
   *   - limit (integer, optional) - Maximum number of identities to return (1-100)
   *   - offset (integer, optional) - Number of identities to skip for pagination
   * @returns {Promise<object>} Object containing an array of identities
   */
  async getIdentities(params = {}) {
    const config = {
      method: 'get',
      url: '/identities/',
      params
    };
    return this.client.request(config);
  }

  /**
   * Delete an identity
   * DELETE /identities/{identity_id}
   * @param {string} identityId - The unified ID of the identity to delete
   * @returns {Promise<object>} Success message
   */
  async deleteIdentity(identityId) {
    if (!identityId) {
      throw new Error('identityId is required');
    }

    const config = {
      method: 'delete',
      url: `/identities/${identityId}`
    };
    return this.client.request(config);
  }
}

module.exports = Identities;