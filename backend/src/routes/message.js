import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { 
  getUsersForSidebar, 
  getMessages, 
  sendMessage, 
  updateMessageStatus, 
  addMessageReaction, 
  removeMessageReaction 
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/status/:messageId", protectRoute, updateMessageStatus);
router.post("/:messageId/reactions", protectRoute, addMessageReaction);
router.delete("/:messageId/reactions", protectRoute, removeMessageReaction);

export default router;
