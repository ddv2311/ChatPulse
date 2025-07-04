import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { 
    createGroup, 
    getUserGroups, 
    getGroupById, 
    updateGroup, 
    addGroupMembers, 
    removeGroupMember, 
    deleteGroup 
} from "../controllers/groupController.js";
import {
    sendGroupMessage,
    getGroupMessages,
    deleteGroupMessage,
    markGroupMessageRead,
    addGroupMessageReaction,
    removeGroupMessageReaction,
    editGroupMessage,
    forwardMessageToGroup
} from "../controllers/groupMessageController.js";

const router = express.Router();

// Group routes
router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:groupId", protectRoute, getGroupById);
router.put("/:groupId", protectRoute, updateGroup);
router.post("/:groupId/members", protectRoute, addGroupMembers);
router.delete("/:groupId/members/:memberId", protectRoute, removeGroupMember);
router.delete("/:groupId", protectRoute, deleteGroup);

// Group message routes
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.post("/:groupId/messages/forward", protectRoute, forwardMessageToGroup);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.delete("/messages/:messageId", protectRoute, deleteGroupMessage);
router.put("/messages/:messageId/read", protectRoute, markGroupMessageRead);
router.post("/messages/:messageId/reactions", protectRoute, addGroupMessageReaction);
router.delete("/messages/:messageId/reactions", protectRoute, removeGroupMessageReaction);
router.put("/messages/:messageId", protectRoute, editGroupMessage);

export default router; 