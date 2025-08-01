// -----------------------------
// Load Environment Variables
// -----------------------------
import dotenv from 'dotenv';
dotenv.config();

// -----------------------------
// Built-in & Third-party Imports
// -----------------------------
import express from 'express';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// -----------------------------
// Internal Module Imports
// -----------------------------
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import notificationRoutes from './routes/notificationRoute.js';
import contactRoutes from './routes/contactRoutes.js'
import { createNotification } from './controllers/NotificationController/notifyController.js';

// -----------------------------
// Create Uploads Directory if Missing
// -----------------------------
const uploadsPath = path.resolve('uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// -----------------------------
// App Initialization
// -----------------------------
const app = express();
const server = http.createServer(app);

// -----------------------------
// Middleware
// -----------------------------
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:8080"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsPath));

// -----------------------------
// API Routes
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', contactRoutes);

// -----------------------------
// Socket.io Setup
// -----------------------------
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

export { io };

io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  socket.on('sendNotification', async ({ userId, message }) => {
    try {
      await createNotification(userId, message);
      socket.emit('newNotification', { userId, message });
    } catch (error) {
      console.error('❌ Notification error:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// -----------------------------
// 🔥 Serve React Frontend (Production Build)
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const frontendPath = path.join(__dirname, 'build');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 5000;

connectDB();

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});