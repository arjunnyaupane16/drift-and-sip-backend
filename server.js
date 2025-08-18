import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';

import { archiveOldOrders } from './controllers/orderController.js';
import { setupOrderCleanupJob } from './cronJobs.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();

// ✅ CORS setup for Vercel frontend
app.use(cors({
  origin: [
    'https://drift-and-sip-user-app.vercel.app',  // user frontend
    'https://admin-app-rose.vercel.app',          // admin frontend
    'http://localhost:19006',                     // Expo web
    'http://127.0.0.1:19006',
    'http://localhost:3000',                      // Next/CRA
    'http://localhost:5173',                      // Vite
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// ✅ Routes
app.get('/', (req, res) => {
  res.send('🚀 Drift and Sip Backend Running!');
});
app.use('/api/orders', orderRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    setupOrderCleanupJob();

    // ⏱️ Daily Cron Job
    cron.schedule('0 0 * * *', async () => {
      console.log('⏳ Running daily archiving...');
      await archiveOldOrders();
    });

    let PORT = process.env.PORT || 5000;

    const tryListen = (port) => {
      const server = app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`⚠️ Port ${port} busy, trying ${port + 1}...`);
          tryListen(port + 1);
        } else {
          throw err;
        }
      });
    };

    tryListen(PORT);

  } catch (error) {
    console.error('❌ Server failed to start:', error);
  }
};

startServer();
