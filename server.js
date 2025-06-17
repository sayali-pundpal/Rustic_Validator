const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

// Environment variables (use `dotenv` in production)
const JWT_SECRET = 'exactspace_internship_2023';
const API_KEY = 'EXACT-API-KEY-123';
const PORT = 3000;

// Improved CORS configuration
app.use(cors({
  origin: ['http://localhost', 'http://127.0.0.1'], // Allow localhost
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json());
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mock authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "API key required" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired API key" });
  }
};

// Generate API key endpoint
app.post('/api/auth', (req, res) => {
  if (req.body.key !== API_KEY) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ access: 'greet_api' }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Protected greeting endpoint
app.post('/api/greet', authenticate, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  
  res.json({ 
    message: `Hello, ${name.trim()}!`,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substring(7)
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Test auth endpoint: curl -X POST http://localhost:${PORT}/api/auth -H "Content-Type: application/json" -d '{"key":"EXACT-API-KEY-123"}'`);
});