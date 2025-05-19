import express from "express";
import { 
    getUserProfile, 
    blockUser, 
    unblockUser, 
    getBlockedUsers 
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to get user profile
router.get("/:id", protectRoute, getUserProfile);

// Routes for blocking/unblocking users
router.post("/block/:userId", protectRoute, blockUser);
router.post("/unblock/:userId", protectRoute, unblockUser);
router.get("/blocked/list", protectRoute, getBlockedUsers);

export default router; 