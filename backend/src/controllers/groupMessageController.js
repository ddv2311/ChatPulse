import GroupMessage from "../models/groupMessages.js";
import GroupChat from "../models/groupChat.js";
import { io } from "../lib/socket.js";

// Send message to group
export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image } = req.body;
        const userId = req.user._id;
        
        if (!text && !image) {
            return res.status(400).json({ error: "Message cannot be empty" });
        }
        
        // Check if group exists and user is a member
        const group = await GroupChat.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        if (!group.members.includes(userId)) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }
        
        const newMessage = new GroupMessage({
            groupId,
            senderId: userId,
            text: text || "",
            image: image || ""
        });
        
        const savedMessage = await newMessage.save();
        
        // Populate sender information
        const populatedMessage = await GroupMessage.findById(savedMessage._id)
            .populate("senderId", "fullName email profilePicture");
        
        // Update group's updatedAt timestamp
        await GroupChat.findByIdAndUpdate(groupId, { updatedAt: Date.now() });
        
        // Emit socket event to all users in the group
        io.to(groupId).emit("newGroupMessage", populatedMessage);
        
        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error in sendGroupMessage controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get messages from a group
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;
        
        // Check if group exists and user is a member
        const group = await GroupChat.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        if (!group.members.includes(userId)) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }
        
        const messages = await GroupMessage.find({ groupId })
            .populate("senderId", "fullName email profilePicture")
            .sort({ createdAt: 1 });
        
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getGroupMessages controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete a group message
export const deleteGroupMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        
        const message = await GroupMessage.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        
        // Check if user is the sender of the message
        if (message.senderId.toString() !== userId.toString()) {
            // Check if user is the group admin
            const group = await GroupChat.findById(message.groupId);
            if (!group || group.admin.toString() !== userId.toString()) {
                return res.status(403).json({ error: "You can only delete your own messages" });
            }
        }
        
        const groupId = message.groupId;
        
        await GroupMessage.findByIdAndDelete(messageId);
        
        // Emit socket event to all users in the group
        io.to(groupId.toString()).emit("deleteGroupMessage", { messageId });
        
        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error in deleteGroupMessage controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 