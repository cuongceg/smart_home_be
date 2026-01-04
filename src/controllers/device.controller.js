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
}

module.exports = DeviceController;
