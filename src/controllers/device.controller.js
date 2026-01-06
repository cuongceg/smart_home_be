const Device = require('../models/device');
const Controller = require('../models/controller');
const { validationResult } = require('express-validator');

class DeviceController {
    static async createDevice(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { controller_key, room, name, type, config } = req.body;

            // Verify that the controller exists and belongs to the user
            const controller = await Controller.findByControllerKey(controller_key);
            if (!controller) {
                return res.status(404).json({
                    success: false,
                    message: 'Controller not found'
                });
            }

            if (controller.owner_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied - controller does not belong to you'
                });
            }

            const device = await Device.create({
                controller_key,
                room,
                name,
                type,
                config
            });

            res.status(201).json({
                success: true,
                message: 'Device created successfully',
                data: device
            });
        } catch (error) {
            console.error('Create device error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getMyDevices(req, res) {
        try {
            const devices = await Device.findByUserId(req.user.id);

            // Group devices by room
            const roomGroups = devices.reduce((acc, device) => {
                const roomName = device.room;
                if (!acc[roomName]) {
                    acc[roomName] = {
                        name: roomName,
                        devices: []
                    };
                }

                acc[roomName].devices.push({
                    id: device.id,
                    name: device.name,
                    type: device.type,
                    config: device.config,
                    controller_key: device.controller_key,
                    created_at: device.created_at,
                    updated_at: device.updated_at
                });

                return acc;
            }, {});

            const result = Object.values(roomGroups);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get my devices error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getDevice(req, res) {
        try {
            const { id } = req.params;
            const device = await Device.findById(id);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            // Check if user owns this device
            if (device.owner_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: device
            });
        } catch (error) {
            console.error('Get device error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async updateDevice(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const updateData = req.body;

            // Check if device exists and user owns it
            const hasAccess = await Device.checkOwnership(id, req.user.id);
            if (!hasAccess) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found or access denied'
                });
            }

            const updatedDevice = await Device.update(id, updateData);

            if (!updatedDevice) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            res.json({
                success: true,
                message: 'Device updated successfully',
                data: updatedDevice
            });
        } catch (error) {
            console.error('Update device error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async deleteDevice(req, res) {
        try {
            const { id } = req.params;

            // Check if device exists and user owns it
            const hasAccess = await Device.checkOwnership(id, req.user.id);
            if (!hasAccess) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found or access denied'
                });
            }

            const deletedDevice = await Device.delete(id);

            if (!deletedDevice) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            res.json({
                success: true,
                message: 'Device deleted successfully'
            });
        } catch (error) {
            console.error('Delete device error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getDevicesByRoom(req, res) {
        try {
            const { room } = req.params;
            const devices = await Device.findByRoom(req.user.id, room);

            res.json({
                success: true,
                data: {
                    room,
                    devices: devices.map(device => ({
                        id: device.id,
                        name: device.name,
                        type: device.type,
                        config: device.config,
                        controller: device.controller_name,
                        created_at: device.created_at,
                        updated_at: device.updated_at
                    }))
                }
            });
        } catch (error) {
            console.error('Get devices by room error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getDeviceStats(req, res) {
        try {
            const [roomStats, typeStats] = await Promise.all([
                Device.getStatsByRoom(req.user.id),
                Device.getStatsByType(req.user.id)
            ]);

            res.json({
                success: true,
                message: 'Device statistics retrieved successfully',
                by_room: roomStats.map(stat => ({
                    room: stat.room,
                    count: parseInt(stat.count)
                })),
                by_type: typeStats.map(stat => ({
                    type: stat.type,
                    count: parseInt(stat.count)
                }))
            });
        } catch (error) {
            console.error('Get device stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Share devices với multiple users
    static async shareDevices(req, res) {
        try {
            const { targetUserId, deviceIds } = req.body;

            if (!targetUserId || !deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'targetUserId and deviceIds array are required'
                });
            }

            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(targetUserId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid targetUserId format'
                });
            }

            for (const deviceId of deviceIds) {
                if (!uuidRegex.test(deviceId)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid device ID format: ${deviceId}`
                    });
                }
            }

            const result = await Device.shareDevices(req.user.id, targetUserId, deviceIds);

            res.json({
                success: true,
                message: result.message,
                data: {
                    sharedDevices: result.sharedDevices,
                    totalDevices: result.totalDevices,
                    targetUserId: targetUserId
                }
            });
        } catch (error) {
            console.error('Share devices error:', error);
            if (error.message.includes('does not own') || error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Lấy danh sách members của một device
    static async getDeviceMembers(req, res) {
        try {
            const { deviceId } = req.params;

            const members = await Device.getDeviceMembers(deviceId, req.user.id);

            res.json({
                success: true,
                message: 'Device members retrieved successfully',
                data: {
                    deviceId: deviceId,
                    members: members
                }
            });
        } catch (error) {
            console.error('Get device members error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Revoke quyền truy cập device
    static async revokeDeviceAccess(req, res) {
        try {
            const { deviceId, userId } = req.params;

            const result = await Device.revokeDeviceAccess(deviceId, req.user.id, userId);

            res.json({
                success: true,
                message: result.message,
                data: {
                    deviceId: deviceId,
                    revokedUserId: userId,
                    revoked: result.revoked
                }
            });
        } catch (error) {
            console.error('Revoke device access error:', error);
            if (error.message.includes('not found') || error.message.includes('does not own')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Lấy danh sách devices được share cho user hiện tại
    static async getSharedDevices(req, res) {
        try {
            const devices = await Device.findByUserId(req.user.id);
            
            // Filter chỉ những devices được share (không phải owner)
            const sharedDevices = devices.filter(device => device.access_type === 'member');

            // Group by room
            const roomGroups = sharedDevices.reduce((acc, device) => {
                const roomName = device.room;
                if (!acc[roomName]) {
                    acc[roomName] = {
                        name: roomName,
                        devices: []
                    };
                }

                acc[roomName].devices.push({
                    id: device.id,
                    name: device.name,
                    type: device.type,
                    config: device.config,
                    controller_key: device.controller_key,
                    access_type: device.access_type,
                    created_at: device.created_at,
                    updated_at: device.updated_at
                });

                return acc;
            }, {});

            const result = Object.values(roomGroups);

            res.json({
                success: true,
                message: 'Shared devices retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Get shared devices error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Lấy danh sách devices mà user đã share cho người khác
    static async getMySharedDevices(req, res) {
        try {
            const userId = req.user.id;
            
            // Query để lấy devices mà user owns và đã share
            const { pool } = require('../config/database');
            const query = `
                SELECT DISTINCT d.*, 
                       ARRAY_AGG(
                           JSON_BUILD_OBJECT(
                               'user_id', u.id,
                               'username', u.username,
                               'gmail', u.gmail,
                               'added_at', dm.added_at
                           )
                       ) as shared_with
                FROM devices d
                JOIN controllers c ON d.controller_key = c.controller_key
                JOIN device_members dm ON d.id = dm.device_id
                JOIN users u ON dm.user_id = u.id
                WHERE c.owner_id = $1 AND c.is_active = true
                GROUP BY d.id, d.controller_key, d.room, d.name, d.type, d.config, d.created_at, d.updated_at
                ORDER BY d.room, d.name
            `;
            
            const result = await pool.query(query, [userId]);

            res.json({
                success: true,
                message: 'My shared devices retrieved successfully',
                data: result.rows
            });
        } catch (error) {
            console.error('Get my shared devices error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = DeviceController;
