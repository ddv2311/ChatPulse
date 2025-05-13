import express from "express";
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import messageRoutes from "./routes/message.js";
import cors from "cors";
import { io, app, server } from "./lib/socket.js";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Increase the JSON body size limit (default is ~1MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.NODE_ENV === "production" 
        ? "https://chatpulse-7dzt.onrender.com" 
        : "http://localhost:5173",
    credentials: true,
}));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve static files in production
if(process.env.NODE_ENV === "production"){
    // Serve the frontend build files
    app.use(express.static(path.join(rootDir, "frontend", "dist")));
    
    // For any other route, serve the index.html
    app.get("*", (req, res) => {
        res.sendFile(path.join(rootDir, "frontend", "dist", "index.html"));
    });
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
    connectDB();
});
