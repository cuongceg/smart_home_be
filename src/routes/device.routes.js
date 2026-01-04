const express = require('express');
const DeviceController = require('../controllers/device.controller');
const { authMiddleware } = require('../middleware/auth');
const {
    validateCreateDevice,
    validateUpdateDevice
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
 *     summary: Get all devices in a specific room
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

module.exports = router;
