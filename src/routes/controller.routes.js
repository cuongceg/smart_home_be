const express = require('express');
const ControllerController = require('../controllers/controller.controller');
const { authMiddleware } = require('../middleware/auth');
const {
    validateCreateController,
    validateUpdateController
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Controller:
 *       type: object
 *       required:
 *         - name
 *         - mac_address
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the controller
 *         owner_id:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this controller
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the controller
 *         controller_key:
 *           type: string
 *           maxLength: 50
 *           description: Unique key for device registration
 *         mac_address:
 *           type: string
 *           pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
 *           description: MAC address of the controller
 *         location:
 *           type: object
 *           description: GeoJSON point representing controller location
 *         is_active:
 *           type: boolean
 *           description: Whether the controller is active
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateControllerRequest:
 *       type: object
 *       required:
 *         - name
 *         - mac_address
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Living Room Controller"
 *         controller_key:
 *           type: string
 *           maxLength: 50
 *           description: Optional controller key (auto-generated if not provided)
 *           example: "CTRL_ABC12345"
 *         mac_address:
 *           type: string
 *           pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
 *           example: "AA:BB:CC:DD:EE:FF"
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           example: 10.8231
 *           description: "Latitude coordinate (optional)"
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           example: 106.6297
 *           description: "Longitude coordinate (optional)"
 */

/**
 * @swagger
 * /api/controllers:
 *   post:
 *     summary: Create a new controller
 *     tags: [Controllers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateControllerRequest'
 *     responses:
 *       201:
 *         description: Controller created successfully
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
 *                   $ref: '#/components/schemas/Controller'
 *       400:
 *         description: Validation error
 *       409:
 *         description: MAC address already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, validateCreateController, ControllerController.createController);

/**
 * @swagger
 * /api/controllers:
 *   get:
 *     summary: Get all controllers owned by the current user
 *     tags: [Controllers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of controllers
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
 *                     $ref: '#/components/schemas/Controller'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, ControllerController.getMyControllers);

/**
 * @swagger
 * /api/controllers/{id}:
 *   get:
 *     summary: Get a controller by ID
 *     tags: [Controllers]
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
 *         description: Controller details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Controller'
 *       404:
 *         description: Controller not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, ControllerController.getController);

/**
 * @swagger
 * /api/controllers/{id}:
 *   put:
 *     summary: Update a controller
 *     tags: [Controllers]
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
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               mac_address:
 *                 type: string
 *                 pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: "Latitude coordinate"
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: "Longitude coordinate"
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Controller updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Controller not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authMiddleware, validateUpdateController, ControllerController.updateController);

/**
 * @swagger
 * /api/controllers/{id}:
 *   delete:
 *     summary: Delete a controller (soft delete)
 *     tags: [Controllers]
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
 *         description: Controller deleted successfully
 *       404:
 *         description: Controller not found
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authMiddleware, ControllerController.deleteController);

module.exports = router;
