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
  origin: ['https://drift-and-sip-user-app.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
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

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
  }
};

startServer();
