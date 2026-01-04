const express = require('express');
const router = express.Router();
const DeviceDataController = require('../controllers/deviceData.controller');
const { authMiddleware } = require('../middleware/auth');
const { validateDeviceDataQuery } = require('../middleware/validation');

// Apply authentication middleware to all device data routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/device-data:
 *   get:
 *     summary: Get device data for time-series charts
 *     tags: [Device Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: controllerKey
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Controller key to filter data
 *         example: "ESP32_001"
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start time in ISO8601 format with timezone
 *         example: "2024-01-01T00:00:00+07:00"
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End time in ISO8601 format with timezone
 *         example: "2024-01-02T00:00:00+07:00"
 *     responses:
 *       200:
 *         description: Device data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 controllerKey:
 *                   type: string
 *                   example: "ESP32_001"
 *                 from:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 to:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-02T00:00:00.000Z"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-01T12:00:00.000Z"
 *                       temperature:
 *                         type: number
 *                         nullable: true
 *                         example: 25.5
 *                       humidity:
 *                         type: number
 *                         nullable: true
 *                         example: 60.2
 *                       gas_concentration:
 *                         type: number
 *                         nullable: true
 *                         example: 150.3
 *                       metadata:
 *                         type: object
 *                         example: {"sensor_id": "DHT22", "location": "living_room"}
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input parameters"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Access denied to the specified controller
 *       500:
 *         description: Server error
 */
router.get('/', validateDeviceDataQuery, DeviceDataController.getDeviceData);

/**
 * @swagger
 * /api/device-data/controllers:
 *   get:
 *     summary: Get available controllers for the user
 *     tags: [Device Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Controllers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Controllers retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       controller_key:
 *                         type: string
 *                         example: "ESP32_001"
 *                       name:
 *                         type: string
 *                         example: "Living Room Controller"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/controllers', DeviceDataController.getControllers);

/**
 * @swagger
 * /api/device-data/cache/stats:
 *   get:
 *     summary: Get cache statistics for monitoring
 *     tags: [Device Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cache statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     keys:
 *                       type: number
 *                       example: 42
 *                     hits:
 *                       type: number
 *                       example: 156
 *                     misses:
 *                       type: number
 *                       example: 23
 *                     ksize:
 *                       type: number
 *                       example: 1024
 *                     vsize:
 *                       type: number
 *                       example: 8192
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/cache/stats', DeviceDataController.getCacheStats);

module.exports = router;
