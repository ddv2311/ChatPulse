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
            image: image || "",
            status: "sent",
            readBy: [userId] // The sender has already "read" the message
        });
        
        const savedMessage = await newMessage.save();
        
        // Populate sender information
        const populatedMessage = await GroupMessage.findById(savedMessage._id)
            .populate("senderId", "fullName email profilePicture")
            .populate("readBy", "fullName email profilePicture");
        
        // Update group's updatedAt timestamp
        await GroupChat.findByIdAndUpdate(groupId, { updatedAt: Date.now() });
        
        // Emit socket event to all users in the group
        io.to(groupId).emit("newGroupMessage", populatedMessage);
        
        // Mark as delivered if there are other online users in the group
        if (io.sockets.adapter.rooms.get(groupId)?.size > 1) {
            populatedMessage.status = "delivered";
            await GroupMessage.findByIdAndUpdate(savedMessage._id, { status: "delivered" });
            
            // Notify about status change
            io.to(groupId).emit("groupMessageStatusUpdate", {
                messageId: populatedMessage._id,
                status: "delivered"
            });
        }
        
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
            .populate("readBy", "fullName email profilePicture")
            .sort({ createdAt: 1 });
        
        // Mark messages as read by this user
        const unreadMessages = messages.filter(msg => 
            !msg.readBy.some(user => user._id.toString() === userId.toString())
        );
        
        if (unreadMessages.length > 0) {
            // Add current user to readBy for each unread message
            for (const msg of unreadMessages) {
                await GroupMessage.findByIdAndUpdate(
                    msg._id,
                    { $addToSet: { readBy: userId } }
                );
                
                // Update the messages in the response
                msg.readBy.push(userId);
                
                // Notify group about read status
                io.to(groupId).emit("groupMessageRead", {
                    messageId: msg._id,
                    userId: userId,
                    groupId: groupId
                });
            }
        }
        
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

// Mark group message as read
export const markGroupMessageRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        
        const message = await GroupMessage.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        
        // Check if user is a member of the group
        const group = await GroupChat.findById(message.groupId);
        if (!group || !group.members.includes(userId)) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }
        
        // Add user to readBy if not already there
        if (!message.readBy.includes(userId)) {
            await GroupMessage.findByIdAndUpdate(
                messageId,
                { $addToSet: { readBy: userId } }
            );
            
            // Notify group about read status
            io.to(message.groupId.toString()).emit("groupMessageRead", {
                messageId,
                userId,
                groupId: message.groupId
            });
        }
        
        res.status(200).json({ message: "Message marked as read" });
    } catch (error) {
        console.error("Error in markGroupMessageRead controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Add reaction to a group message
export const addGroupMessageReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;
        
        if (!emoji) {
            return res.status(400).json({ error: "Emoji is required" });
        }
        
        const message = await GroupMessage.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        
        // Check if user is a member of the group
        const group = await GroupChat.findById(message.groupId);
        if (!group || !group.members.includes(userId)) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }
        
        // Remove existing reaction from this user if any
        const existingReactionIndex = message.reactions.findIndex(
            reaction => reaction.userId.toString() === userId.toString()
        );
        
        if (existingReactionIndex !== -1) {
            message.reactions.splice(existingReactionIndex, 1);
        }
        
        // Add new reaction
        message.reactions.push({ userId, emoji });
        await message.save();
        
        // Populate user info for the reaction
        const populatedMessage = await GroupMessage.findById(messageId)
            .populate("reactions.userId", "fullName email profilePicture");
        
        // Emit socket event to all users in the group
        io.to(message.groupId.toString()).emit("groupMessageReaction", {
            messageId,
            reactions: populatedMessage.reactions
        });
        
        res.status(200).json({ 
            messageId,
            reactions: populatedMessage.reactions
        });
    } catch (error) {
        console.error("Error in addGroupMessageReaction controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove reaction from a group message
export const removeGroupMessageReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        
        const message = await GroupMessage.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        
        // Check if user is a member of the group
        const group = await GroupChat.findById(message.groupId);
        if (!group || !group.members.includes(userId)) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }
        
        // Find and remove the reaction
        const existingReactionIndex = message.reactions.findIndex(
            reaction => reaction.userId.toString() === userId.toString()
        );
        
        if (existingReactionIndex === -1) {
            return res.status(400).json({ error: "No reaction found to remove" });
        }
        
        message.reactions.splice(existingReactionIndex, 1);
        await message.save();
        
        // Emit socket event to all users in the group
        io.to(message.groupId.toString()).emit("groupMessageReaction", {
            messageId,
            reactions: message.reactions
        });
        
        res.status(200).json({ 
            messageId,
            reactions: message.reactions
        });
    } catch (error) {
        console.error("Error in removeGroupMessageReaction controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Edit a group message
export const editGroupMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ error: "Message text is required" });
        }
        
        const message = await GroupMessage.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        
        // Only the sender can edit their own message
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "You can only edit your own messages" });
        }
        
        // Add edited flag and update text
        message.text = text.trim();
        message.isEdited = true;
        await message.save();
        
        // Populate sender information for the response
        const populatedMessage = await GroupMessage.findById(messageId)
            .populate("senderId", "fullName email profilePicture")
            .populate("readBy", "fullName email profilePicture");
        
        // Emit socket event to all users in the group
        io.to(message.groupId.toString()).emit("editGroupMessage", {
            messageId,
            text: populatedMessage.text,
            isEdited: true
        });
        
        res.status(200).json(populatedMessage);
    } catch (error) {
        console.error("Error in editGroupMessage controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 