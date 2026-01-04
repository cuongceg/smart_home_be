const DeviceData = require('../models/deviceData');
const { validationResult } = require('express-validator');
const cacheService = require('../services/cacheService');

class DeviceDataController {
    /**
     * Get device data for time-series charts
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getDeviceData(req, res) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input parameters',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { controllerKey, from, to } = req.query;

            // Validate required parameters
            if (!controllerKey || !from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required parameters: controllerKey, from, to'
                });
            }

            // Validate datetime format
            const fromDate = new Date(from);
            const toDate = new Date(to);

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid datetime format. Use ISO8601 format with timezone'
                });
            }

            // Validate time range
            if (fromDate >= toDate) {
                return res.status(400).json({
                    success: false,
                    message: 'From date must be before to date'
                });
            }

            // Validate max time range (e.g., 30 days to prevent performance issues)
            const maxRangeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
            if (toDate.getTime() - fromDate.getTime() > maxRangeMs) {
                return res.status(400).json({
                    success: false,
                    message: 'Time range cannot exceed 30 days'
                });
            }

            // Validate user access to controller
            const hasAccess = await DeviceData.validateControllerAccess(userId, controllerKey);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to the specified controller'
                });
            }

            // Check cache first
            const cachedData = cacheService.getDeviceData(userId, controllerKey, from, to);
            if (cachedData) {
                const response = {
                    controllerKey,
                    from: fromDate.toISOString(),
                    to: toDate.toISOString(),
                    data: cachedData
                };
                return res.json(response);
            }

            // Query device data
            const deviceData = await DeviceData.getByTimeRange(userId, controllerKey, from, to);

            // Format data for response
            const formattedData = deviceData.map(record => ({
                time: record.time.toISOString(),
                temperature: record.temperature,
                humidity: record.humidity,
                gas_concentration: record.gas_concentration,
                metadata: record.metadata || {}
            }));

            // Cache the formatted data
            cacheService.setDeviceData(userId, controllerKey, from, to, formattedData);

            // Format response for Flutter fl_chart
            const response = {
                controllerKey,
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
                data: formattedData
            };

            res.json(response);

        } catch (error) {
            console.error('Get device data error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }

    /**
     * Get available controllers for the user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getControllers(req, res) {
        try {
            const userId = req.user.id;
            const controllers = await DeviceData.getUserControllerKeys(userId);

            res.json({
                success: true,
                message: 'Controllers retrieved successfully',
                data: controllers
            });

        } catch (error) {
            console.error('Get controllers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }

    /**
     * Get cache statistics for monitoring
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getCacheStats(req, res) {
        try {
            const stats = cacheService.getStats();
            
            res.json({
                success: true,
                message: 'Cache statistics retrieved successfully',
                data: stats
            });

        } catch (error) {
            console.error('Get cache stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }
}

module.exports = DeviceDataController;
