const express = require("express");
const {
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getProfile,
  createUser,
  registerFcmToken,
} = require("../controllers/user.controller");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  validateUserProfileUpdate,
  validateAdminUpdateUser,
  validateRegister,
  validateFcmToken,
} = require("../middleware/validation");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: User's unique identifier
 *         username:
 *           type: string
 *           description: User's username
 *         gmail:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role
 *         is_active:
 *           type: boolean
 *           description: Whether user account is active
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: New username (optional)
 *         oldPassword:
 *           type: string
 *           description: Current password (required when updating password)
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: New password (optional)
 *     AdminUpdateUserRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: User's username
 *         gmail:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role
 *         is_active:
 *           type: boolean
 *           description: Whether user account is active
 *     PaginationResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of users
 *         limit:
 *           type: integer
 *           description: Number of users per page
 *         offset:
 *           type: integer
 *           description: Number of users skipped
 *         hasMore:
 *           type: boolean
 *           description: Whether there are more users to fetch
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           examples:
 *             updateUsername:
 *               summary: Update username only
 *               value:
 *                 username: "newusername"
 *             updatePassword:
 *               summary: Update password only
 *               value:
 *                 oldPassword: "currentpassword"
 *                 newPassword: "newpassword123"
 *             updateBoth:
 *               summary: Update both username and password
 *               value:
 *                 username: "newusername"
 *                 oldPassword: "currentpassword"
 *                 newPassword: "newpassword123"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Bad request - Invalid input or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/profile",
  authMiddleware,
  validateUserProfileUpdate,
  updateProfile
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           examples:
 *            createUser:
 *              summary: Create a new user
 *              value:
 *               username: "newuser"
 *               gmail: "newuser@example.com"
 *               password: "newpassword"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     gmail:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

router.post("/", authMiddleware, adminMiddleware, validateRegister, createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, adminMiddleware, getAllUsers);

/**
 * @swagger
 * /api/users/fcm-token:
 *   put:
 *     summary: Register or update FCM Token for push notifications
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcm_token
 *             properties:
 *               fcm_token:
 *                 type: string
 *                 description: The Firebase Cloud Messaging token from client device
 *     responses:
 *       200:
 *         description: Token registered successfully
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
 *                   example: FCM Token registered successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.put("/fcm-token", authMiddleware, validateFcmToken, registerFcmToken);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Bad request - User ID is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authMiddleware, adminMiddleware, getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID (Admin only)
 *     tags: [Users - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateUserRequest'
 *           examples:
 *             updateUsername:
 *               summary: Update username only
 *               value:
 *                 username: "updatedusername"
 *             deactivateUser:
 *               summary: Deactivate user account
 *               value:
 *                 is_active: false
 *             updateMultiple:
 *               summary: Update multiple fields
 *               value:
 *                 username: "updatedusername"
 *                 is_active: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Bad request - Invalid input or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateAdminUpdateUser,
  updateUserById
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID (Admin only)
 *     tags: [Users - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *                 deletedUser:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *                     gmail:
 *                       type: string
 *       400:
 *         description: Bad request - User ID is required or cannot delete own account
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authMiddleware, adminMiddleware, deleteUserById);
module.exports = router;
