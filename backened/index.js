// backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import urlRoutes from './routes/urlRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Routes
app.use('/', urlRoutes);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 URL Shortener Backend running on:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Network: http://0.0.0.0:${PORT}`);
  });
};

startServer();