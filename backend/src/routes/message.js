import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  updateMessageStatus,
  addMessageReaction,
  removeMessageReaction,
  editMessage,
  deleteMessage,
  forwardMessage
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/forward/:id", protectRoute, forwardMessage);
router.put("/status/:messageId", protectRoute, updateMessageStatus);
router.post("/:messageId/reactions", protectRoute, addMessageReaction);
router.delete("/:messageId/reactions", protectRoute, removeMessageReaction);
router.put("/:messageId", protectRoute, editMessage);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
