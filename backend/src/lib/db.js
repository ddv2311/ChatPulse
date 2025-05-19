import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // Connection options
            serverSelectionTimeoutMS: 30000, // Increased timeout (default 30s)
            socketTimeoutMS: 45000, // Increased socket timeout
            connectTimeoutMS: 30000, // Connection timeout
            maxPoolSize: 10, // Maximum number of connections in the pool
            minPoolSize: 2, // Minimum number of connections to maintain
            maxIdleTimeMS: 60000, // Maximum time a connection can remain idle
            heartbeatFrequencyMS: 10000, // Heartbeat frequency
            family: 4, // Use IPv4, skip trying IPv6
        });
        
        console.log("MongoDB connected successfully");
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully');
        });
        
    } catch (error) {
        console.error("MongoDB connection error:", error);
        // Retry connection after delay
        console.log("Retrying connection in 5 seconds...");
        setTimeout(() => connectDB(), 5000);
    }
}
