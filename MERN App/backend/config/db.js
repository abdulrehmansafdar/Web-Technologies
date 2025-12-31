/**
 * ===========================================
 * MongoDB Database Connection Configuration
 * ===========================================
 * 
 * This module handles the connection to MongoDB database using Mongoose ODM.
 * It implements connection retry logic and proper error handling.
 * 
 * @module config/db
 */

const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB database
 * 
 * Features:
 * - Automatic retry on connection failure
 * - Connection event logging
 * - Graceful shutdown handling
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Mongoose connection options
    const options = {
      // useNewUrlParser and useUnifiedTopology are now default in Mongoose 6+
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║   📦 MongoDB Connected Successfully!                      ║
    ║   🏠 Host: ${conn.connection.host}                        
    ║   📁 Database: ${conn.connection.name}                    
    ╚═══════════════════════════════════════════════════════════╝
    `);

    // Connection event listeners for monitoring
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

/**
 * Graceful shutdown handler
 * Closes MongoDB connection when the application is terminated
 */
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

module.exports = connectDB;
