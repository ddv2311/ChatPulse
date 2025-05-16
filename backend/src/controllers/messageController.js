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