# Smart Home IoT Backend

A Node.js/Express.js backend application for managing smart home IoT devices with TimescaleDB for time-series data storage.

## Features

- **User Authentication**: JWT-based authentication with email verification
- **Controller Management**: Manage ESP32 controllers with MAC address tracking
- **Device Management**: CRUD operations for IoT devices (sensors, actuators, cameras)
- **Room-based Organization**: Group devices by room for better organization
- **Time-series Data**: Store and query sensor data using TimescaleDB
- **Real-time Communication**: MQTT integration for device communication
- **RESTful API**: Well-documented API endpoints with Swagger documentation
- **Security**: Rate limiting, input validation, and secure password handling

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with TimescaleDB extension
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI 3.0
- **Message Broker**: MQTT (for IoT communication)
- **Email Service**: Nodemailer with SendinBlue

## Database Schema

### Users Table
- User authentication and profile management
- Supports password reset functionality
- FCM token storage for push notifications

### Controllers Table
- ESP32 controller management
- Unique controller_key for device registration and identification
- MAC address tracking for device identification
- Location support with PostGIS
- Owner-based access control

### Devices Table
- IoT device configuration storage
- Room-based organization
- Flexible JSON configuration for different device types
- Links to controllers via controller_key for hierarchy management

### Devices Data Table (TimescaleDB Hypertable)
- Time-series data storage for sensor readings
- Health check data from controllers
- Automatic data compression and retention policies
- High-performance queries for historical data

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh-token` - Refresh JWT token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

### Controller Management
- `POST /api/controllers` - Create new controller
- `GET /api/controllers` - Get all user's controllers
- `GET /api/controllers/:id` - Get controller by ID
- `PUT /api/controllers/:id` - Update controller
- `DELETE /api/controllers/:id` - Delete controller (soft delete)

### Device Management
- `POST /api/devices` - Create new device
- `GET /api/devices` - Get all user's devices grouped by room
- `GET /api/devices/:id` - Get device by ID
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/room/:room` - Get devices in specific room
- `GET /api/devices/stats` - Get device statistics by room and type

### Device Data (Time-series)
- `GET /api/device-data` - Get time-series data for charts (requires controllerKey, from, to parameters)
- `GET /api/device-data/controllers` - Get available controllers for the user

### Device Statistics API

The `/api/devices/stats` endpoint provides comprehensive statistics about your devices organized by room and type. This is useful for dashboard displays and analytics.

#### Response Format
```json
{
    "success": true,
    "message": "Device statistics retrieved successfully",
    "by_room": [
        {
            "room": "Living Room",
            "count": 5
        },
        {
            "room": "Kitchen",
            "count": 3
        },
        {
            "room": "Bedroom",
            "count": 2
        }
    ],
    "by_type": [
        {
            "type": "SENSOR",
            "count": 7
        },
        {
            "type": "ACTUATOR",
            "count": 2
        },
        {
            "type": "CAMERA",
            "count": 1
        }
    ]
}
```

#### Usage Example
```bash
curl -X GET \
  http://localhost:3000/api/devices/stats \
  -H 'Authorization: Bearer your_jwt_token'
```

### Device Data API (Time-series)

The Device Data API provides time-series data optimized for Flutter `fl_chart` with TimescaleDB performance optimization.

#### Get Time-series Data
`GET /api/device-data`

**Query Parameters:**
- `controllerKey` (required): Controller key to filter data
- `from` (required): Start time in ISO8601 format with timezone (+07:00)
- `to` (required): End time in ISO8601 format with timezone (+07:00)

**Response Format:**
```json
{
  "controllerKey": "ESP32_001",
  "from": "2024-01-01T00:00:00.000Z",
  "to": "2024-01-02T00:00:00.000Z",
  "data": [
    {
      "time": "2024-01-01T12:00:00.000Z",
      "temperature": 25.5,
      "humidity": 60.2,
      "gas_concentration": 150.3,
      "metadata": {"sensor_id": "DHT22", "location": "living_room"}
    }
  ]
}
```

**Features:**
- Validates user access to controller data
- Supports maximum 30-day time range for performance
- Uses optimized TimescaleDB indexes for fast queries
- Data ordered by time ASC for chart rendering
- Supports timezone-aware datetime filtering

#### Usage Example
```bash
curl -X GET \
  "http://localhost:3000/api/device-data?controllerKey=ESP32_001&from=2024-01-01T00:00:00%2B07:00&to=2024-01-02T00:00:00%2B07:00" \
  -H 'Authorization: Bearer your_jwt_token'
```

#### Get Available Controllers
`GET /api/device-data/controllers`

Returns list of controllers owned by the authenticated user.

**Response Format:**
```json
{
  "success": true,
  "message": "Controllers retrieved successfully",
  "data": [
    {
      "controller_key": "ESP32_001",
      "name": "Living Room Controller"
    }
  ]
}
```

#### Usage Example
```bash
curl -X GET \
  "http://localhost:3000/api/device-data/controllers" \
  -H 'Authorization: Bearer your_jwt_token'
```

#### Performance Optimization

The Device Data API includes intelligent caching for high-frequency IoT data:

- **Automatic Caching**: Recent queries are cached for 5 minutes
- **Smart TTL**: Recent data (last hour) cached for 30 seconds only
- **Cache Invalidation**: Cache automatically invalidated when new data arrives
- **Performance Monitoring**: Use `/api/device-data/cache/stats` to monitor cache performance
- **Memory Efficient**: Large datasets (>10k records) are not cached to prevent memory issues

#### Cache Monitoring
`GET /api/device-data/cache/stats`

Returns cache statistics including hit/miss ratios, memory usage, and key counts.

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL with TimescaleDB extension
- Docker & Docker Compose (recommended)

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd smart_home_be
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=smart_home_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Email Configuration (SendinBlue)
SENDINBLUE_API_KEY=your_sendinblue_api_key
FROM_EMAIL=your_email@domain.com

# Server Configuration
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000

# MQTT Configuration
MQTT_BROKER_URL=mqtt://mosquitto:1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
```

4. Start the application:
```bash
docker-compose up -d
```

5. The application will be available at:
- API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs
- Health Check: http://localhost:5000/health

### Manual Installation

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL with TimescaleDB:
```bash
# Install TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. Run database setup:
```bash
psql -U postgres -d smart_home_db -f database/setup.sql
```

4. Start the application:
```bash
npm start        # Production
npm run dev      # Development with nodemon
```

## API Usage Examples

### 1. Create Controller
```bash
curl -X POST http://localhost:5000/api/controllers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Living Room Controller",
    "controller_key": "CTRL_ABC12345",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "latitude": 20.979209,
    "longitude": 105.843675
  }'
```

### 2. Create Device
```bash
curl -X POST http://localhost:5000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "controller_key": "CTRL_ABC12345",
    "room": "Kitchen",
    "name": "Smart Light",
    "type": "ACTUATOR",
    "config": {
      "pin": 12,
      "active_low": true,
      "brightness_levels": 10
    }
  }'
```

### 3. Get Devices Grouped by Room
```bash
curl -X GET http://localhost:5000/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "name": "Kitchen",
      "devices": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Smart Light",
          "type": "ACTUATOR",
          "controller": "Kitchen Controller",
          "config": {
            "pin": 12,
            "active_low": true
          },
          "created_at": "2024-01-01T00:00:00.000Z",
          "updated_at": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

## Device Configuration Examples

### Sensor Device
```json
{
  "name": "Temperature Sensor",
  "type": "SENSOR",
  "config": {
    "pin": 14,
    "sensor_type": "DHT22",
    "reading_interval": 30,
    "unit": "celsius"
  }
}
```

### Actuator Device
```json
{
  "name": "Smart Relay",
  "type": "ACTUATOR",
  "config": {
    "pin": 12,
    "active_low": true,
    "default_state": "off",
    "timer_support": true
  }
}
```

### Camera Device
```json
{
  "name": "Security Camera",
  "type": "CAMERA",
  "config": {
    "resolution": "1080p",
    "fps": 30,
    "night_vision": true,
    "motion_detection": true
  }
}
```

## MQTT Integration

The system integrates with MQTT for real-time device communication:

### Topic Structure
- `telemetry/{controller_key}/{device_type}` - Sensor data
- `health/{controller_key}` - Controller health status  
- `commands/{controller_key}/{device_id}` - Device control commands

### Data Flow
1. ESP32 controllers publish sensor data to MQTT
2. Telegraf consumes MQTT messages and writes to TimescaleDB
3. API provides endpoints to query historical data
4. WebSocket connections can be used for real-time updates

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Input Validation**: Comprehensive validation using express-validator
3. **Rate Limiting**: Protection against API abuse
4. **Password Security**: Bcrypt hashing for passwords
5. **Access Control**: Owner-based resource access
6. **SQL Injection Protection**: Parameterized queries
7. **CORS Configuration**: Cross-origin request handling

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error information"]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Development Guidelines

### Code Structure
- **Models**: Database interaction logic
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions with Swagger documentation
- **Middleware**: Authentication, validation, and utility functions
- **Config**: Database and application configuration

### Best Practices
1. Use async/await for asynchronous operations
2. Implement proper error handling in all endpoints
3. Validate all input data using express-validator
4. Use parameterized queries to prevent SQL injection
5. Follow RESTful API design principles
6. Document all endpoints with Swagger annotations

## Monitoring & Logging

### Health Check Endpoint
- `GET /health` - Returns system status and database connectivity

### Database Performance
- TimescaleDB compression policies for efficient storage
- Indexed queries for optimal performance
- Connection pooling for scalability

## Contributing

1. Follow the existing code structure and patterns
2. Add appropriate validation for new endpoints
3. Include Swagger documentation for new APIs
4. Test all functionality before submitting
5. Update this README for significant changes

## License

This project is licensed under the ISC License.
