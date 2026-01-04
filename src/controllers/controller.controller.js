const Controller = require('../models/controller');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

class ControllerController {
    static async createController(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { name, mac_address, controller_key, latitude, longitude } = req.body;
            const owner_id = req.user.id;

            // Generate controller_key if not provided
            const finalControllerKey = controller_key || `CTRL_${uuidv4().substring(0, 8).toUpperCase()}`;

            // Convert latitude and longitude to GeoJSON format if provided
            let location = null;
            if (latitude !== undefined && longitude !== undefined) {
                location = {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                };
            }

            // Check if MAC address already exists
            const existingController = await Controller.findByMacAddress(mac_address);
            if (existingController) {
                return res.status(409).json({
                    success: false,
                    message: 'Controller with this MAC address already exists'
                });
            }

            // Check if controller_key already exists
            if (controller_key) {
                const existingControllerByKey = await Controller.findByControllerKey(controller_key);
                if (existingControllerByKey) {
                    return res.status(409).json({
                        success: false,
                        message: 'Controller with this key already exists'
                    });
                }
            }

            const controller = await Controller.create({
                owner_id,
                name,
                controller_key: finalControllerKey,
                mac_address,
                location
            });

            res.status(201).json({
                success: true,
                message: 'Controller created successfully',
                data: controller
            });
        } catch (error) {
            console.error('Create controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getController(req, res) {
        try {
            const { id } = req.params;
            const controller = await Controller.findById(id);

            if (!controller) {
                return res.status(404).json({
                    success: false,
                    message: 'Controller not found'
                });
            }

            // Check if user owns this controller
            if (controller.owner_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: controller
            });
        } catch (error) {
            console.error('Get controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getMyControllers(req, res) {
        try {
            const controllers = await Controller.findByOwnerId(req.user.id);

            res.json({
                success: true,
                data: controllers
            });
        } catch (error) {
            console.error('Get my controllers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async updateController(req, res) {
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
            const { name, controller_key, mac_address, latitude, longitude, is_active } = req.body;

            const controller = await Controller.findById(id);
            if (!controller) {
                return res.status(404).json({
                    success: false,
                    message: 'Controller not found'
                });
            }

            // Check ownership
            if (controller.owner_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // If MAC address is being updated, check for conflicts
            if (mac_address && mac_address !== controller.mac_address) {
                const existingController = await Controller.findByMacAddress(mac_address);
                if (existingController) {
                    return res.status(409).json({
                        success: false,
                        message: 'Controller with this MAC address already exists'
                    });
                }
            }

            // If controller_key is being updated, check for conflicts
            if (controller_key && controller_key !== controller.controller_key) {
                const existingControllerByKey = await Controller.findByControllerKey(controller_key);
                if (existingControllerByKey) {
                    return res.status(409).json({
                        success: false,
                        message: 'Controller with this key already exists'
                    });
                }
            }

            // Convert latitude and longitude to GeoJSON format if provided
            let location = undefined;
            if (latitude !== undefined && longitude !== undefined) {
                location = {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                };
            }

            const updateData = {
                name,
                controller_key,
                mac_address,
                location,
                is_active
            };

            const updatedController = await Controller.update(id, updateData);

            res.json({
                success: true,
                message: 'Controller updated successfully',
                data: updatedController
            });
        } catch (error) {
            console.error('Update controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async deleteController(req, res) {
        try {
            const { id } = req.params;

            const controller = await Controller.findById(id);
            if (!controller) {
                return res.status(404).json({
                    success: false,
                    message: 'Controller not found'
                });
            }

            // Check ownership
            if (controller.owner_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            await Controller.delete(id);

            res.json({
                success: true,
                message: 'Controller deleted successfully'
            });
        } catch (error) {
            console.error('Delete controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = ControllerController;
