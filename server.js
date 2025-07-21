// ------------------------------
// 🌐 Drift and Sip - Backend Server (for Render)
// ------------------------------

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';

import { archiveOldOrders } from './controllers/orderController.js';
import { setupOrderCleanupJob } from './cronJobs.js';
import orderRoutes from './routes/orderRoutes.js';

// 🔧 Load environment variables
dotenv.config();

// ✅ Create Express App
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Routes
app.get('/', (req, res) => {
  res.send('🚀 Drift and Sip Backend Running!');
});
app.use('/api/orders', orderRoutes);

// ✅ MongoDB Connect and start server
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

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
  }
};

startServer();
