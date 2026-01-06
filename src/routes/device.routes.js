const express = require('express');
const DeviceController = require('../controllers/device.controller');
const { authMiddleware } = require('../middleware/auth');
const {
    validateCreateDevice,
    validateUpdateDevice,
    validateShareDevices
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       required:
 *         - controller_id
 *         - room
 *         - name
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the device
 *         controller_key:
 *           type: string
 *           maxLength: 50
 *           description: Key of the controller this device belongs to
 *         room:
 *           type: string
 *           maxLength: 50
 *           description: Room where the device is located
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the device
 *         type:
 *           type: string
 *           maxLength: 50
 *           description: Type of the device (e.g., SENSOR, ACTUATOR, CAMERA)
 *         config:
 *           type: object
 *           description: Device configuration in JSON format
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateDeviceRequest:
 *       type: object
 *       required:
 *         - controller_key
 *         - room
 *         - name
 *         - type
 *       properties:
 *         controller_key:
 *           type: string
 *           maxLength: 50
 *           example: "CTRL_ABC12345"
 *         room:
 *           type: string
 *           maxLength: 50
 *           example: "Living Room"
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Smart Light"
 *         type:
 *           type: string
 *           maxLength: 50
 *           example: "ACTUATOR"
 *         config:
 *           type: object
 *           example: {"pin": 12, "active_low": true}
 *     RoomDevices:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Room name
 *         devices:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               config:
 *                 type: object
 *               controller:
 *                 type: string
 *                 description: Controller name
 *               created_at:
 *                 type: string
 *                 format: date-time
 *               updated_at:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /api/devices/my-shared:
 *   get:
 *     summary: Get devices that the current user has shared with others
 *     tags: [Devices - Sharing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My shared devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       controller_key:
 *                         type: string
 *                       room:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       config:
 *                         type: object
 *                       shared_with:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             user_id:
 *                               type: string
 *                               format: uuid
 *                             username:
 *                               type: string
 *                             gmail:
 *                               type: string
 *                             added_at:
 *                               type: string
 *                               format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/my-shared', authMiddleware, DeviceController.getMySharedDevices);

/**
 * @swagger
 * /api/devices/shared:
 *   get:
 *     summary: Get devices that are shared with the current user
 *     tags: [Devices - Sharing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shared devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Room name
 *                       devices:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                             type:
 *                               type: string
 *                             config:
 *                               type: object
 *                             controller_key:
 *                               type: string
 *                             access_type:
 *                               type: string
 *                               enum: [member]
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/shared', authMiddleware, DeviceController.getSharedDevices);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create a new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeviceRequest'
 *     responses:
 *       201:
 *         description: Device created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Controller not found
 *       403:
 *         description: Access denied - controller does not belong to user
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, validateCreateDevice, DeviceController.createDevice);

/**
 * @swagger
 * /api/devices/stats:
 *   get:
 *     summary: Get device statistics by room and type
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device statistics retrieved successfully
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
 *                   example: "Device statistics retrieved successfully"
 *                 by_room:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       room:
 *                         type: string
 *                         example: "Living Room"
 *                       count:
 *                         type: integer
 *                         example: 5
 *                 by_type:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "SENSOR"
 *                       count:
 *                         type: integer
 *                         example: 3
 *       401:
 *         description: Unauthorized
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
 *                   example: "Unauthorized access"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
router.get('/stats', authMiddleware, DeviceController.getDeviceStats);

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices owned by the current user, grouped by room
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices grouped by room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RoomDevices'
 *             example:
 *               success: true
 *               data:
 *                 - name: "Kitchen"
 *                   devices:
 *                     - id: "123e4567-e89b-12d3-a456-426614174000"
 *                       name: "fan kitchen"
 *                       type: "fan"
 *                       controller: "Kitchen Controller"
 *                       config: {"pin": 12}
 *                       created_at: "2024-01-01T00:00:00.000Z"
 *                       updated_at: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, DeviceController.getMyDevices);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get a device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Device details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       404:
 *         description: Device not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, DeviceController.getDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Update a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room:
 *                 type: string
 *                 maxLength: 50
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               type:
 *                 type: string
 *                 maxLength: 50
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Device not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authMiddleware, validateUpdateDevice, DeviceController.updateDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authMiddleware, DeviceController.deleteDevice);

/**
 * @swagger
 * /api/devices/room/{room}:
 *   get:
 *     summary: Get devices in a specific room
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: room
 *         required: true
 *         schema:
 *           type: string
 *         description: Room name
 *     responses:
 *       200:
 *         description: List of devices in the room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     room:
 *                       type: string
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           config:
 *                             type: object
 *                           controller:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/room/:room', authMiddleware, DeviceController.getDevicesByRoom);

/**
 * @swagger
 * /api/devices/share:
 *   post:
 *     summary: Share multiple devices with another user
 *     tags: [Devices - Sharing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *               - deviceIds
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user to share devices with
 *               deviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of device IDs to share
 *           examples:
 *             shareDevices:
 *               summary: Share multiple devices
 *               value:
 *                 targetUserId: "123e4567-e89b-12d3-a456-426614174001"
 *                 deviceIds: ["123e4567-e89b-12d3-a456-426614174002", "123e4567-e89b-12d3-a456-426614174003"]
 *     responses:
 *       200:
 *         description: Devices shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sharedDevices:
 *                       type: integer
 *                     totalDevices:
 *                       type: integer
 *                     targetUserId:
 *                       type: string
 *       400:
 *         description: Bad request - Invalid input
 *       404:
 *         description: Device not found or user does not own devices
 *       401:
 *         description: Unauthorized
 */
router.post('/share', authMiddleware, validateShareDevices, DeviceController.shareDevices);

/**
 * @swagger
 * /api/devices/{deviceId}/members:
 *   get:
 *     summary: Get list of users who have access to a specific device
 *     tags: [Devices - Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deviceId:
 *                       type: string
 *                       format: uuid
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           username:
 *                             type: string
 *                           gmail:
 *                             type: string
 *                           added_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/:deviceId/members', authMiddleware, DeviceController.getDeviceMembers);

/**
 * @swagger
 * /api/devices/{deviceId}/revoke/{userId}:
 *   delete:
 *     summary: Revoke device access from a user
 *     tags: [Devices - Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Device ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to revoke access from
 *     responses:
 *       200:
 *         description: Access revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deviceId:
 *                       type: string
 *                       format: uuid
 *                     revokedUserId:
 *                       type: string
 *                       format: uuid
 *                     revoked:
 *                       type: boolean
 *       404:
 *         description: Device not found or user does not own device
 *       401:
 *         description: Unauthorized
 */
router.delete('/:deviceId/revoke/:userId', authMiddleware, DeviceController.revokeDeviceAccess);

module.exports = router;
