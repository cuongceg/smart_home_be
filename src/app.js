const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const controllerRoutes = require('./routes/controller.routes');
const deviceRoutes = require('./routes/device.routes');
const deviceDataRoutes = require('./routes/deviceData.routes');
const {initMQTT} = require('./services/mqttService');
const { testConnection } = require('./config/database');
const specs = require('./config/swagger');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/controllers', controllerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/device-data', deviceDataRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await testConnection();
        res.status(200).json({ 
            status: 'OK', 
            message: 'Server and database are running',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'Error', 
            message: 'Database connection failed',
            error: error.message 
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Endpoint not found',
        path: req.originalUrl 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
    try {
        await testConnection();

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
            console.log(`Health check available at http://localhost:${PORT}/health`);
            // Start MQTT subscriber service for alerts
            try {
                initMQTT();
                console.log('MQTT service started');
            } catch (err) {
                console.error('Failed to start MQTT service:', err);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();