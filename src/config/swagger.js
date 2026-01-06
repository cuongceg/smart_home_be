const swaggerJSDoc = require('swagger-jsdoc');

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Smart Home API',
            version: '1.0.0',
            description: 'API for Smart Home IoT management system',
        },
        servers: [
            {
                url: 'https://iot.dev-monitor.id.vn',
                description: 'Production server',
            },
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: 'Auth',
                description: 'Authentication endpoints',
            },
            {
                name: 'Users',
                description: 'User management endpoints',
            },
            {
                name: 'Controllers',
                description: 'ESP32 controller management endpoints',
            },
            {
                name: 'Devices',
                description: 'IoT device management endpoints',
            },
            {
                name: 'Devices - Sharing',
                description: 'Device sharing and access management endpoints',
            },
        ],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
