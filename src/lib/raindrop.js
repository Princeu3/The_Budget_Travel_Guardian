/**
 * Raindrop Client Utility
 *
 * This utility provides helper functions for interacting with LiquidMetal Raindrop
 * services including SmartMemory and SmartBuckets.
 *
 * Environment Variables Required:
 * - LIQUIDMETAL_API_KEY: Your Raindrop API key
 * - RAINDROP_SMARTMEMORY_NAME: SmartMemory instance name (optional, defaults to 'travel-agent-memory')
 * - RAINDROP_APPLICATION_NAME: Application identifier (optional, defaults to 'travel-deal-hunter')
 * - RAINDROP_APPLICATION_VERSION: Version string (optional, defaults to '1.0.0')
 */

import Raindrop from '@liquidmetal-ai/lm-raindrop';

/**
 * Initialize Raindrop client with API key from environment
 * @returns {Raindrop} Configured Raindrop client instance
 */
export function getRaindropClient() {
    // Try multiple sources for the API key
    const apiKey = process.env.LIQUIDMETAL_API_KEY ||
                   process.env.RAINDROP_API_KEY ||
                   import.meta.env?.LIQUIDMETAL_API_KEY ||
                   import.meta.env?.RAINDROP_API_KEY;

    console.log('🔑 Checking for API key...');
    console.log('process.env.LIQUIDMETAL_API_KEY:', process.env.LIQUIDMETAL_API_KEY ? 'SET' : 'NOT SET');
    console.log('process.env.RAINDROP_API_KEY:', process.env.RAINDROP_API_KEY ? 'SET' : 'NOT SET');

    if (!apiKey) {
        const error = new Error('LIQUIDMETAL_API_KEY or RAINDROP_API_KEY environment variable is required');
        console.error('❌', error.message);
        throw error;
    }

    console.log('✅ API key found, initializing Raindrop client');
    return new Raindrop({ apiKey });
}

/**
 * Get SmartMemory location configuration
 * @returns {Object} SmartMemory location object
 */
export function getSmartMemoryLocation() {
    return {
        smartMemory: {
            name: import.meta.env.RAINDROP_SMARTMEMORY_NAME ||
                  process.env.RAINDROP_SMARTMEMORY_NAME,
            application_name: import.meta.env.RAINDROP_APPLICATION_NAME ||
                             process.env.RAINDROP_APPLICATION_NAME,
            version: import.meta.env.RAINDROP_APPLICATION_VERSION ||
                    process.env.RAINDROP_APPLICATION_VERSION
        }
    };
}

/**
 * Get SmartBucket location configuration
 * @param {string} bucketName - Name of the bucket
 * @returns {Object} SmartBucket location object
 */
export function getSmartBucketLocation(bucketName) {
    if (!bucketName) {
        throw new Error('Bucket name is required');
    }

    return {
        bucket: {
            name: bucketName
        }
    };
}

/**
 * Save data to SmartMemory
 * Stores key-value pairs in the agent's memory system
 *
 * @param {string} sessionId - Active session ID
 * @param {string} key - Memory key identifier
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {Promise<Object>} Save response from Raindrop
 *
 * @example
 * const result = await saveToSmartMemory('session-123', 'lastSearch', {
 *   origin: 'NYC',
 *   destination: 'LAX'
 * });
 */
export async function saveToSmartMemory(sessionId, key, value) {
    const client = getRaindropClient();
    const smartMemoryLocation = getSmartMemoryLocation();

    if (!sessionId) {
        throw new Error('Session ID is required');
    }

    if (!key) {
        throw new Error('Key is required');
    }

    // Convert value to string if it's an object
    const memoryValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    try {
        const response = await client.saveMemory.create({
            sessionId,
            smartMemoryLocation,
            memories: [{
                key,
                value: memoryValue,
                memoryType: 'working' // Can be: working, semantic, episodic, procedural
            }]
        });

        return response;
    } catch (error) {
        console.error('Error saving to SmartMemory:', error);
        throw error;
    }
}

/**
 * Retrieve data from SmartMemory
 *
 * @param {string} sessionId - Active session ID
 * @param {string} key - Memory key to retrieve (optional - if not provided, retrieves all)
 * @returns {Promise<Object>} Retrieved memory data
 *
 * @example
 * const memory = await getFromSmartMemory('session-123', 'lastSearch');
 * console.log(memory);
 */
export async function getFromSmartMemory(sessionId, key = null) {
    const client = getRaindropClient();
    const smartMemoryLocation = getSmartMemoryLocation();

    if (!sessionId) {
        throw new Error('Session ID is required');
    }

    try {
        const response = await client.getMemory.retrieve({
            sessionId,
            smartMemoryLocation,
            limit: key ? 1 : 10, // Retrieve single item if key specified, else get recent memories
            memoryType: 'working'
        });

        // If a specific key was requested, filter the results
        if (key && response.memories) {
            const memory = response.memories.find(m => m.key === key);
            if (memory) {
                // Try to parse JSON if it looks like JSON
                try {
                    return JSON.parse(memory.value);
                } catch {
                    return memory.value;
                }
            }
            return null;
        }

        return response;
    } catch (error) {
        console.error('Error retrieving from SmartMemory:', error);
        throw error;
    }
}

/**
 * Start a new SmartMemory session
 *
 * @returns {Promise<string>} New session ID
 *
 * @example
 * const sessionId = await startSmartMemorySession();
 * console.log('Session started:', sessionId);
 */
export async function startSmartMemorySession() {
    const client = getRaindropClient();
    const smartMemoryLocation = getSmartMemoryLocation();

    try {
        const response = await client.startSession.create({
            smartMemoryLocation
        });

        return response.sessionId;
    } catch (error) {
        console.error('Error starting SmartMemory session:', error);
        throw error;
    }
}

/**
 * Save data to SmartBucket
 * Stores documents/objects in a semantic-search enabled bucket
 *
 * @param {string} bucketName - Name of the bucket
 * @param {string} objectId - Unique identifier for the object
 * @param {Object} data - Data to store (file or text content)
 * @returns {Promise<Object>} Upload response from Raindrop
 *
 * @example
 * const result = await saveToSmartBucket('price-history', 'flight-2024-10-28', {
 *   carrier: 'Delta',
 *   price: 450,
 *   timestamp: new Date().toISOString()
 * });
 */
export async function saveToSmartBucket(bucketName, objectId, data) {
    const client = getRaindropClient();
    const bucketLocation = getSmartBucketLocation(bucketName);

    if (!objectId) {
        throw new Error('Object ID is required');
    }

    try {
        // Convert data to JSON string if it's an object
        const jsonString = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

        // Encode content as base64
        const content = Buffer.from(jsonString, 'utf-8').toString('base64');

        const response = await client.bucket.put({
            bucketLocation,
            key: objectId,
            content,
            contentType: 'application/json'
        });

        return response;
    } catch (error) {
        console.error('Error saving to SmartBucket:', error);
        throw error;
    }
}

/**
 * Query SmartBucket for semantic search
 *
 * @param {string} bucketName - Name of the bucket to query
 * @param {string} query - Natural language query
 * @param {string} objectId - Specific object to query (optional)
 * @returns {Promise<Object>} Query results
 *
 * @example
 * const results = await querySmartBucket(
 *   'price-history',
 *   'Find the cheapest flight to LAX in the last week'
 * );
 */
export async function querySmartBucket(bucketName, query, objectId = null) {
    const client = getRaindropClient();
    const bucketLocation = getSmartBucketLocation(bucketName);

    if (!query) {
        throw new Error('Query is required');
    }

    try {
        if (objectId) {
            // Query specific document
            const response = await client.query.documentQuery({
                bucketLocation,
                objectId,
                input: query,
                requestId: `query-${Date.now()}`
            });
            return response;
        } else {
            // Query entire bucket
            const response = await client.query.bucketQuery({
                bucketLocation,
                input: query,
                requestId: `query-${Date.now()}`
            });
            return response;
        }
    } catch (error) {
        console.error('Error querying SmartBucket:', error);
        throw error;
    }
}

/**
 * Get object from SmartBucket by ID
 *
 * @param {string} bucketName - Name of the bucket
 * @param {string} objectId - Object identifier
 * @returns {Promise<Object>} Retrieved object data
 *
 * @example
 * const priceData = await getFromSmartBucket('price-history', 'flight-2024-10-28');
 */
export async function getFromSmartBucket(bucketName, objectId) {
    const client = getRaindropClient();
    const bucketLocation = getSmartBucketLocation(bucketName);

    if (!objectId) {
        throw new Error('Object ID is required');
    }

    try {
        // Use search to find the specific object
        const response = await client.search.create({
            bucketLocation,
            query: objectId,
            limit: 1
        });

        if (response.results && response.results.length > 0) {
            return response.results[0];
        }

        return null;
    } catch (error) {
        console.error('Error retrieving from SmartBucket:', error);
        throw error;
    }
}

/**
 * Search SmartBucket
 *
 * @param {string} bucketName - Name of the bucket to search
 * @param {string} searchQuery - Search query string
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<Object>} Search results
 *
 * @example
 * const results = await searchSmartBucket('price-history', 'cheap flights', 5);
 */
export async function searchSmartBucket(bucketName, searchQuery, limit = 10) {
    const client = getRaindropClient();
    const bucketLocation = getSmartBucketLocation(bucketName);

    if (!searchQuery) {
        throw new Error('Search query is required');
    }

    try {
        const response = await client.search.create({
            bucketLocation,
            query: searchQuery,
            limit
        });

        return response;
    } catch (error) {
        console.error('Error searching SmartBucket:', error);
        throw error;
    }
}

// Default export for convenience
export default {
    getRaindropClient,
    getSmartMemoryLocation,
    getSmartBucketLocation,
    saveToSmartMemory,
    getFromSmartMemory,
    startSmartMemorySession,
    saveToSmartBucket,
    getFromSmartBucket,
    querySmartBucket,
    searchSmartBucket
};
