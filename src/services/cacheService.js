const NodeCache = require('node-cache');

class CacheService {
    constructor() {
        // Cache for 5 minutes for time-series data
        this.cache = new NodeCache({ 
            stdTTL: 300, // 5 minutes
            checkperiod: 60, // Check for expired keys every 60 seconds
            useClones: false // Don't clone objects for better performance
        });
    }

    /**
     * Generate cache key for device data queries
     * @param {string} userId - User ID
     * @param {string} controllerKey - Controller key
     * @param {string} from - From datetime
     * @param {string} to - To datetime
     * @returns {string} Cache key
     */
    generateDeviceDataKey(userId, controllerKey, from, to) {
        return `device_data:${userId}:${controllerKey}:${from}:${to}`;
    }

    /**
     * Get cached device data
     * @param {string} userId - User ID
     * @param {string} controllerKey - Controller key
     * @param {string} from - From datetime
     * @param {string} to - To datetime
     * @returns {Array|null} Cached data or null if not found
     */
    getDeviceData(userId, controllerKey, from, to) {
        const key = this.generateDeviceDataKey(userId, controllerKey, from, to);
        return this.cache.get(key);
    }

    /**
     * Set cached device data
     * @param {string} userId - User ID
     * @param {string} controllerKey - Controller key
     * @param {string} from - From datetime
     * @param {string} to - To datetime
     * @param {Array} data - Device data to cache
     * @param {number} ttl - Time to live in seconds (optional)
     */
    setDeviceData(userId, controllerKey, from, to, data, ttl = null) {
        const key = this.generateDeviceDataKey(userId, controllerKey, from, to);
        
        // Don't cache empty results or very large datasets
        if (!data || data.length === 0 || data.length > 10000) {
            return false;
        }

        // For recent data (last hour), use shorter cache time
        const toDate = new Date(to);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (toDate > oneHourAgo) {
            ttl = 30; // 30 seconds for recent data
        }

        return this.cache.set(key, data, ttl);
    }

    /**
     * Invalidate cache for a specific controller
     * @param {string} controllerKey - Controller key
     */
    invalidateController(controllerKey) {
        const keys = this.cache.keys();
        const keysToDelete = keys.filter(key => key.includes(`:${controllerKey}:`));
        this.cache.del(keysToDelete);
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        return this.cache.getStats();
    }

    /**
     * Clear all cache
     */
    flush() {
        this.cache.flushAll();
    }
}

// Export singleton instance
module.exports = new CacheService();
