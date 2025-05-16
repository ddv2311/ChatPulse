import express from "express";
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import messageRoutes from "./routes/message.js";
import groupRoutes from "./routes/group.js";
import cors from "cors";
import { io, app, server } from "./lib/socket.js";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// For Render deployment, the frontend build is in a different location
const rootDir = process.env.NODE_ENV === "production" 
  ? path.resolve(process.cwd(), '..') 
  : path.resolve(__dirname, '..');

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
app.use("/api/groups", groupRoutes);

// Serve static files in production
if(process.env.NODE_ENV === "production"){
    console.log("Running in production mode");
    console.log("Current directory:", process.cwd());
    console.log("Root directory:", rootDir);
    
    try {
        // Possible paths for frontend build
        const possiblePaths = [
            path.join(rootDir, "frontend", "dist"),           // Standard path
            path.join(process.cwd(), "frontend", "dist"),     // Within backend folder
            path.join(rootDir, "dist"),                       // Direct in root
            path.join(process.cwd(), "..", "frontend", "dist") // Up one level
        ];
        
        let distPath = null;
        
        // Find the first path that exists
        for (const p of possiblePaths) {
            console.log(`Checking path: ${p}`);
            if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
                console.log(`Found frontend build at: ${p}`);
                distPath = p;
                break;
            }
        }
        
        if (distPath) {
            app.use(express.static(distPath));
            
            // For any other route, serve the index.html
            app.get("*", (req, res) => {
                res.sendFile(path.join(distPath, "index.html"));
            });
        } else {
            console.error("ERROR: Could not find frontend build directory!");
            // API-only mode if frontend build not found
            app.get("/", (req, res) => {
                res.send("API is running. Frontend build not found.");
            });
        }
    } catch (error) {
        console.error("Error serving static files:", error);
    }
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
    connectDB();
});
