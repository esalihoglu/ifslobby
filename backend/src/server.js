const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const setupSocket = require('./services/socketHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BussUp API' });
});

// Socket.IO
setupSocket(io);

// MongoDB baglantisi ve sunucu baslatma
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB bagantisi basarili');
    server.listen(config.port, () => {
      console.log(`BussUp API sunucusu ${config.port} portunda calisiyor`);
    });
  })
  .catch((err) => {
    console.error('MongoDB baglanti hatasi:', err.message);
    process.exit(1);
  });
