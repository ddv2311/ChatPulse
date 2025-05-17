import User from "../models/users.js";
import Message from "../models/messages.js";

import { cloudinary } from "../lib/claudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });
    
    // Mark messages as read if they were sent to the current user
    const unreadMessages = messages.filter(
      msg => msg.receiverId.toString() === myId.toString() && msg.status !== "read"
    );
    
    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(msg => msg._id) } },
        { $set: { status: "read" } }
      );
      
      // Notify the sender that their messages have been read
      for (const msg of unreadMessages) {
        const senderSocketId = getReceiverSocketId(msg.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdate", {
            messageId: msg._id,
            status: "read"
          });
        }
      }
      
      // Update the messages in the response to show they've been read
      unreadMessages.forEach(msg => {
        msg.status = "read";
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status: "sent"
    });

    await newMessage.save();

    // Get the receiver's socket ID and emit only to them
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // Only emit to the specific receiver
      io.to(receiverSocketId).emit("newMessage", newMessage);
      
      // Update status to delivered since we know the receiver is online
      newMessage.status = "delivered";
      await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });
      
      // Notify the sender that the message was delivered
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", {
          messageId: newMessage._id,
          status: "delivered"
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint to update message status
export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    
    if (!["delivered", "read"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Only the receiver can update the message status
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to update this message" });
    }
    
    // Don't downgrade status (e.g., from "read" to "delivered")
    if (message.status === "read" && status === "delivered") {
      return res.status(400).json({ error: "Cannot downgrade message status" });
    }
    
    message.status = status;
    await message.save();
    
    // Notify the sender about the status update
    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatusUpdate", {
        messageId: message._id,
        status
      });
    }
    
    res.status(200).json({ message: "Message status updated" });
  } catch (error) {
    console.log("Error in updateMessageStatus controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint to add reaction to a message
export const addMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    
    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Check if user is either the sender or receiver of the message
    if (message.senderId.toString() !== userId.toString() && 
        message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to react to this message" });
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
    const populatedMessage = await Message.findById(messageId)
      .populate("reactions.userId", "fullName profilePicture");
    
    // Notify the other user about the reaction
    const otherUserId = userId.toString() === message.senderId.toString() 
      ? message.receiverId.toString() 
      : message.senderId.toString();
    
    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId,
        reactions: populatedMessage.reactions
      });
    }
    
    res.status(200).json({ 
      messageId,
      reactions: populatedMessage.reactions
    });
  } catch (error) {
    console.log("Error in addMessageReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint to remove reaction from a message
export const removeMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Check if user is either the sender or receiver of the message
    if (message.senderId.toString() !== userId.toString() && 
        message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to remove reaction from this message" });
    }
    
    // Remove reaction
    const existingReactionIndex = message.reactions.findIndex(
      reaction => reaction.userId.toString() === userId.toString()
    );
    
    if (existingReactionIndex === -1) {
      return res.status(400).json({ error: "No reaction found to remove" });
    }
    
    message.reactions.splice(existingReactionIndex, 1);
    await message.save();
    
    // Notify the other user about the reaction removal
    const otherUserId = userId.toString() === message.senderId.toString() 
      ? message.receiverId.toString() 
      : message.senderId.toString();
    
    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId,
        reactions: message.reactions
      });
    }
    
    res.status(200).json({ 
      messageId,
      reactions: message.reactions
    });
  } catch (error) {
    console.log("Error in removeMessageReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit a message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }
    
    const message = await Message.findById(messageId);
    
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
    
    // Notify the receiver about the edit
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", {
        messageId,
        text: message.text,
        isEdited: true
      });
    }
    
    res.status(200).json({ 
      messageId,
      text: message.text,
      isEdited: true
    });
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Only the sender can delete their own message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    // Notify the receiver about the deletion
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", {
        messageId
      });
    }
    
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};