# 📝 Blog API

A production-ready RESTful API for managing blog posts and comments built with Node.js, Express, and MongoDB. Features comprehensive security middleware, input validation, rate limiting, and structured logging.

## ✨ Key Features

- **Full CRUD Operations** - Complete post and comment management
- **Robust Security** - Helmet, CORS, rate limiting, NoSQL injection prevention, HPP protection
- **Input Validation** - Express-validator with XSS sanitization
- **Structured Logging** - Winston logger with file rotation and console transport
- **Error Handling** - Centralized error middleware with detailed logging
- **Database Management** - Mongoose with connection retry logic and graceful shutdown
- **Cascade Deletes** - Automatic comment cleanup when posts are deleted
- **Pagination Support** - Efficient data retrieval with configurable limits
- **Health Checks** - API and database health monitoring endpoints
- **Test Coverage** - Jest integration tests with MongoDB Memory Server

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** >= 4.4 (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blog-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see Environment Variables section below).

### 4. Start MongoDB

**Local MongoDB:**
```bash
mongod --dbpath /path/to/your/data/directory
```

**Or use MongoDB Atlas** and update `MONGODB_URI` in `.env`

## ⚙️ Environment Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NODE_ENV` | Application environment | ✅ Yes | - | `development`, `production`, `test` |
| `PORT` | Server port number | ✅ Yes | - | `3000` |
| `MONGODB_URI` | MongoDB connection string | ✅ Yes | - | `mongodb://localhost:27017/blog_db` |
| `LOG_LEVEL` | Logging verbosity level | ❌ No | `info` | `error`, `warn`, `info`, `debug` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window (ms) | ❌ No | `900000` | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | ❌ No | `100` | `100` |
| `JWT_ACCESS_SECRET` | JWT access token secret | ⚠️ Production | - | `your-secret-access-key` |
| `JWT_ACCESS_EXPIRY` | Access token expiration | ❌ No | `15m` | `15m`, `1h`, `7d` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ⚠️ Production | - | `your-secret-refresh-key` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiration | ❌ No | `7d` | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins | ⚠️ Production | `*` | `http://localhost:3000` (comma-separated) |
| `DEFAULT_PAGE_SIZE` | Default pagination limit | ❌ No | `10` | `10` |
| `MAX_PAGE_SIZE` | Maximum pagination limit | ❌ No | `100` | `100` |
| `MAX_FILE_SIZE` | Max upload file size (bytes) | ❌ No | `5242880` | `5242880` (5MB) |
| `UPLOAD_DIR` | File upload directory | ❌ No | `./uploads` | `./uploads` |

### 🔒 Security Notes

- **Production**: Set strong, unique values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- **Production**: Set specific `CORS_ORIGIN` (wildcard `*` not allowed)
- **Development**: Localhost origins are allowed by default

## 🏃 How to Run

### Development Mode

Runs with nodemon for auto-restart on file changes:

```bash
npm run dev
```

Server starts at `http://localhost:3000` (or your configured PORT)

### Production Mode

```bash
npm start
```

### Run Tests

Execute Jest test suite with coverage:

```bash
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

## 📡 API Endpoints

### Health Checks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Basic API health status | ❌ No |
| GET | `/health/db` | Database connection health | ❌ No |

### Posts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/api/posts` | Retrieve all posts (paginated) | ❌ No |
| GET | `/api/v1/api/posts/:id` | Get single post by ID | ❌ No |
| POST | `/api/v1/api/posts` | Create new post | ⚠️ Planned |
| PUT | `/api/v1/api/posts/:id` | Update existing post | ⚠️ Planned |
| DELETE | `/api/v1/api/posts/:id` | Delete post (cascade deletes comments) | ⚠️ Planned |

**Query Parameters (GET /api/posts):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Request Body (POST/PUT):**
```json
{
  "title": "Post Title (3-200 chars)",
  "content": "Post content (min 10 chars)",
  "author": "Author name",
  "status": "draft | published"
}
```

### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/api/posts/:postId/comments` | Get all comments for a post | ❌ No |
| GET | `/api/v1/api/comments/:id` | Get single comment by ID | ❌ No |
| POST | `/api/v1/api/comments` | Create new comment | ⚠️ Planned |
| PUT | `/api/v1/api/comments/:id` | Update comment | ⚠️ Planned |
| DELETE | `/api/v1/api/comments/:id` | Delete comment | ⚠️ Planned |

**Request Body (POST):**
```json
{
  "content": "Comment content (3-500 chars)",
  "author": "Author name (2-100 chars)",
  "postId": "MongoDB ObjectId"
}
```

**Request Body (PUT):**
```json
{
  "content": "Updated comment content (3-500 chars)"
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Success message",
  "statusCode": 200
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "statusCode": 400,
  "errors": [ /* validation errors */ ]
}
```

## 🏗️ Architecture Overview

### Project Structure

```
blog-api/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection with retry logic
│   │   └── env.js        # Environment variable validation
│   ├── controllers/      # Request handlers
│   │   ├── commentController.js
│   │   └── postController.js
│   ├── middleware/       # Express middleware
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── rateLimiter.js     # Rate limiting configs
│   │   ├── security.js        # Security middleware setup
│   │   └── validator.js       # Request validation
│   ├── models/           # Mongoose schemas
│   │   ├── Comment.js    # Comment model with post reference
│   │   └── Post.js       # Post model with virtuals
│   ├── routes/           # API route definitions
│   │   ├── commentRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── index.js      # Route aggregator
│   │   └── postRoutes.js
│   ├── utils/            # Utility functions
│   │   ├── apiResponse.js     # Standardized responses
│   │   └── logger.js          # Winston logger
│   ├── validators/       # Validation rules
│   │   ├── commentValidator.js
│   │   └── postValidator.js
│   ├── app.js           # Express app configuration
│   └── server.js        # Server startup & shutdown
├── tests/               # Integration tests
│   ├── comment.test.js
│   ├── post.test.js
│   └── setup.js         # Test configuration
├── logs/                # Log files (auto-created)
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment template
├── .gitignore
├── package.json
└── README.md
```

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: MongoDB with Mongoose ODM 8.0
- **Security**: Helmet, CORS, express-rate-limit, express-mongo-sanitize, HPP
- **Validation**: express-validator, isomorphic-dompurify
- **Logging**: Winston 3.11 with file rotation
- **Testing**: Jest 29.7, Supertest 6.3, MongoDB Memory Server 9.1

### Data Flow

1. **Request** → Security middleware (Helmet, CORS)
2. **Rate Limiting** → IP-based request throttling
3. **Body Parsing** → JSON/URL-encoded parsing
4. **Logging** → Morgan HTTP request logging
5. **Routing** → Express routes match endpoint
6. **Validation** → express-validator checks input
7. **Controller** → Business logic execution
8. **Model** → Mongoose database operations
9. **Response** → Standardized JSON response
10. **Error Handling** → Global error middleware

### Key Design Decisions

- **Singleton Database Connection**: Single mongoose instance prevents connection leaks
- **Cascade Deletes**: Transactions ensure comments are deleted with posts
- **Input Sanitization**: DOMPurify prevents XSS attacks
- **Structured Logging**: Winston provides production-ready logging with rotation
- **Graceful Shutdown**: Proper cleanup of connections on SIGTERM/SIGINT

## 🐛 Common Issues & Troubleshooting

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
PORT=3001
```

### Database Connection Failed

**Error**: `Failed to connect to MongoDB after 5 attempts`

**Solutions**:
1. **Check MongoDB is running**:
   ```bash
   # macOS/Linux
   sudo systemctl status mongod
   
   # Or check process
   ps aux | grep mongod
   ```

2. **Verify MONGODB_URI** in `.env`:
   - Local: `mongodb://localhost:27017/blog_db`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/blog_db`

3. **Check firewall/network** settings if using remote MongoDB

4. **MongoDB not installed**:
   ```bash
   # macOS
   brew install mongodb-community
   
   # Ubuntu
   sudo apt-get install mongodb
   ```

### Environment Variable Errors

**Error**: `Missing required environment variables: MONGODB_URI`

**Solution**:
1. Ensure `.env` file exists in root directory
2. Copy from template: `cp .env.example .env`
3. Fill in required values (NODE_ENV, PORT, MONGODB_URI)

### Validation Errors

**Error**: `Validation failed: Title must be between 3 and 200 characters`

**Solution**: Check request body matches schema requirements:
- **Posts**: `title` (3-200 chars), `content` (min 10 chars), `author` (required)
- **Comments**: `content` (3-500 chars), `author` (2-100 chars), `postId` (valid ObjectId)

### Rate Limit Exceeded

**Error**: `Too many requests from this IP, please try again later`

**Solution**:
- Wait for rate limit window to reset (default: 15 minutes)
- Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env` for development
- Use different IP or wait for reset

### Test Failures

**Error**: Tests timeout or fail to connect

**Solution**:
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose

# Check MongoDB Memory Server is installed
npm install --save-dev mongodb-memory-server
```

### Log Files Growing Too Large

**Solution**: Winston automatically rotates logs at 5MB. To manually clear:
```bash
rm -rf logs/*.log
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Built with** ❤️ **using Node.js, Express, and MongoDB**