// src/services/elasticsearchService.js
import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger.js';

/**
 * Elasticsearch Integration Service
 * 
 * Uses official @elastic/elasticsearch client with graceful fallback.
 * When Elasticsearch cluster is unreachable, telemetry records are seamlessly stored
 * in an in-memory ring buffer so the dashboard, search, and analytics continue functioning.
 */

export class ElasticsearchService {
  constructor(config = {}) {
    this.nodeUrl = config.nodeUrl || process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
    this.indexName = config.indexName || process.env.ELASTICSEARCH_INDEX || 'iot-telemetry-water-level';
    
    this.client = null;
    this.isAvailable = false;
    this.connectionState = 'DISCONNECTED';
    this.lastError = null;
    this.indexedCount = 0;

    // In-memory fallback storage
    this.fallbackStore = [];
    this.maxFallbackSize = 200;

    this.initClient();
  }

  initClient() {
    try {
      const clientOptions = {
        node: this.nodeUrl,
        requestTimeout: 3000,
        maxRetries: 1
      };

      if (process.env.ELASTICSEARCH_API_KEY) {
        clientOptions.auth = { apiKey: process.env.ELASTICSEARCH_API_KEY };
      } else if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
        clientOptions.auth = {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD
        };
      }

      this.client = new Client(clientOptions);
      this.checkHealth();
    } catch (err) {
      this.isAvailable = false;
      this.connectionState = 'ERROR';
      this.lastError = err.message;
      logger.warn(`Elasticsearch client initialization failed: ${err.message}. Using fallback storage.`);
    }
  }

  async checkHealth() {
    if (!this.client) return false;
    try {
      const health = await this.client.cluster.health();
      this.isAvailable = true;
      this.connectionState = health.status ? health.status.toUpperCase() : 'CONNECTED';
      this.lastError = null;
      logger.info(`Elasticsearch connected. Cluster status: ${this.connectionState}`);
      await this.ensureIndexExists();
      return true;
    } catch (err) {
      this.isAvailable = false;
      this.connectionState = 'UNAVAILABLE';
      this.lastError = err.message;
      logger.warn(`Elasticsearch cluster unreachable at ${this.nodeUrl}. Fallback storage active.`);
      return false;
    }
  }

  async ensureIndexExists() {
    if (!this.isAvailable || !this.client) return;
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                timestamp: { type: 'date' },
                deviceId: { type: 'keyword' },
                waterLevelMeters: { type: 'float' },
                waterLevelPercentage: { type: 'float' },
                distanceMeters: { type: 'float' },
                status: { type: 'keyword' },
                signalQuality: { type: 'integer' },
                batteryPercentage: { type: 'integer' },
                isDemoData: { type: 'boolean' },
                location: {
                  properties: {
                    latitude: { type: 'float' },
                    longitude: { type: 'float' }
                  }
                }
              }
            }
          }
        });
        logger.info(`Created Elasticsearch index: ${this.indexName}`);
      }
    } catch (err) {
      logger.warn(`Could not verify/create index ${this.indexName}: ${err.message}`);
    }
  }

  /**
   * Index structured telemetry document
   */
  async indexTelemetry(document) {
    this.indexedCount++;
    const enrichedDoc = {
      ...document,
      indexedAt: new Date().toISOString()
    };

    // Always maintain in local fallback store for instant zero-latency UI preview
    this.fallbackStore.unshift(enrichedDoc);
    if (this.fallbackStore.length > this.maxFallbackSize) {
      this.fallbackStore.pop();
    }

    if (!this.isAvailable || !this.client) {
      return {
        success: true,
        storageMode: 'LOCAL_FALLBACK_MEMORY',
        indexedCount: this.indexedCount,
        message: 'Elasticsearch unavailable; indexed into resilient local buffer.'
      };
    }

    try {
      const response = await this.client.index({
        index: this.indexName,
        document: enrichedDoc
      });
      return {
        success: true,
        storageMode: 'ELASTICSEARCH_CLUSTER',
        id: response._id,
        indexedCount: this.indexedCount
      };
    } catch (err) {
      logger.error(`Elasticsearch indexing failed:`, err.message);
      return {
        success: true,
        storageMode: 'LOCAL_FALLBACK_MEMORY',
        error: err.message
      };
    }
  }

  /**
   * Search / query records
   */
  async search({ limit = 20, query = null }) {
    if (this.isAvailable && this.client) {
      try {
        const esQuery = query 
          ? { multi_match: { query, fields: ['deviceId', 'status', 'location.source'] } }
          : { match_all: {} };

        const result = await this.client.search({
          index: this.indexName,
          size: limit,
          query: esQuery,
          sort: [{ timestamp: { order: 'desc' } }]
        });

        return {
          source: 'ELASTICSEARCH_CLUSTER',
          total: result.hits.total.value || result.hits.total,
          records: result.hits.hits.map(h => ({ _id: h._id, ...h._source }))
        };
      } catch (err) {
        logger.warn(`Elasticsearch query failed, returning fallback records: ${err.message}`);
      }
    }

    // Fallback store search
    let records = [...this.fallbackStore];
    if (query) {
      const q = query.toLowerCase();
      records = records.filter(r => 
        (r.deviceId && r.deviceId.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q))
      );
    }

    return {
      source: 'LOCAL_FALLBACK_MEMORY',
      total: records.length,
      records: records.slice(0, limit)
    };
  }

  /**
   * Get Elasticsearch service status
   */
  getStatus() {
    return {
      isAvailable: this.isAvailable,
      connectionState: this.connectionState,
      nodeUrl: this.nodeUrl,
      indexName: this.indexName,
      lastError: this.lastError,
      indexedCount: this.indexedCount,
      fallbackBufferSize: this.fallbackStore.length
    };
  }
}

export const elasticsearchService = new ElasticsearchService();
