import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    logger.info('Attempting to connect to MongoDB Atlas...');
    const conn = await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — attempting to reconnect');
    });
  } catch (error) {
    logger.warn(`MongoDB Atlas connection failed: ${error.message}`);
    if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
      logger.info('Attempting to start local in-memory MongoDB database (mongodb-memory-server)...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const localUri = mongoMemoryServer.getUri();
        logger.info(`Local in-memory MongoDB started. Connecting to: ${localUri}`);
        
        const conn = await mongoose.connect(localUri, {
          maxPoolSize: 10,
        });
        logger.info(`MongoDB connected locally (in-memory): ${conn.connection.host}`);
        
        mongoose.connection.on('connected', () => {
          logger.info('MongoDB local connection established');
        });

        mongoose.connection.on('error', (err) => {
          logger.error(`MongoDB local connection error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB local disconnected');
        });
      } catch (memError) {
        logger.error(`Failed to start local in-memory MongoDB: ${memError.message}`);
        throw error;
      }
    } else {
      throw error;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      logger.info('Local in-memory MongoDB stopped');
    } else {
      logger.info('MongoDB connection closed');
    }
  } catch (err) {
    logger.error(`Error during DB disconnect: ${err.message}`);
  }
};

export default mongoose;
