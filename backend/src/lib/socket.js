import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? ["https://chatpulse-7dzt.onrender.com"] 
      : ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}
// used to track users in group rooms
const groupRooms = {}; // {groupId: [userId1, userId2, ...]}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join a group chat room
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);
    
    // Track user in group room
    if (!groupRooms[groupId]) {
      groupRooms[groupId] = [];
    }
    
    if (!groupRooms[groupId].includes(userId)) {
      groupRooms[groupId].push(userId);
    }
    
    // Notify group members about online users in the group
    io.to(groupId).emit("groupOnlineUsers", {
      groupId,
      onlineUsers: groupRooms[groupId].filter(id => Object.keys(userSocketMap).includes(id))
    });
  });
  
  // Leave a group chat room
  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`User ${userId} left group ${groupId}`);
    
    // Remove user from group room tracking
    if (groupRooms[groupId]) {
      groupRooms[groupId] = groupRooms[groupId].filter(id => id !== userId);
      
      // Notify remaining group members
      io.to(groupId).emit("groupOnlineUsers", {
        groupId,
        onlineUsers: groupRooms[groupId].filter(id => Object.keys(userSocketMap).includes(id))
      });
    }
  });

  // Message status update events
  socket.on("messageDelivered", ({ messageId, senderId }) => {
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatusUpdate", {
        messageId,
        status: "delivered"
      });
    }
  });

  socket.on("messageRead", ({ messageId, senderId }) => {
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatusUpdate", {
        messageId,
        status: "read"
      });
    }
  });

  // Message reaction events
  socket.on("addReaction", ({ messageId, emoji, senderId }) => {
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReaction", {
        messageId,
        emoji,
        userId
      });
    }
  });

  // Message edit event (client-side)
  socket.on("editMessage", ({ messageId, text, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", {
        messageId,
        text,
        isEdited: true
      });
    }
  });

  // Message delete event (client-side)
  socket.on("deleteMessage", ({ messageId, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", {
        messageId
      });
    }
  });

  // WebRTC signaling events
  // Call request event
  socket.on("callUser", ({ userToCall, from, name, callType }) => {
    const userSocketId = getReceiverSocketId(userToCall);
    if (userSocketId) {
      io.to(userSocketId).emit("incomingCall", {
        from,
        name,
        callType
      });
    }
  });

    // Call answer event  socket.on("answerCall", ({ to, signal, from }) => {    const userSocketId = getReceiverSocketId(to);    console.log("Received call answer from", from, "forwarding to", to, "at socket", userSocketId);    if (userSocketId) {      io.to(userSocketId).emit("callAccepted", {        signal,        from      });    } else {      console.warn("Could not find socket ID for user", to);    }  });

    // Call signal event for WebRTC  socket.on("callSignal", ({ to, signal }) => {    const userSocketId = getReceiverSocketId(to);    console.log("Received call signal, forwarding to", to, "at socket", userSocketId);    if (userSocketId) {      io.to(userSocketId).emit("receiveSignal", {        signal,        from: userId      });    } else {      console.warn("Could not find socket ID for user", to);    }  });

  // Call reject event
  socket.on("rejectCall", ({ to, from }) => {
    const userSocketId = getReceiverSocketId(to);
    if (userSocketId) {
      io.to(userSocketId).emit("callRejected", {
        from
      });
    }
  });

  // Call end event
  socket.on("endCall", ({ to, from }) => {
    const userSocketId = getReceiverSocketId(to);
    if (userSocketId) {
      io.to(userSocketId).emit("callEnded", {
        from
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    
    // Update all group rooms the user was part of
    Object.keys(groupRooms).forEach(groupId => {
      if (groupRooms[groupId].includes(userId)) {
        groupRooms[groupId] = groupRooms[groupId].filter(id => id !== userId);
        
        // Notify remaining group members
        io.to(groupId).emit("groupOnlineUsers", {
          groupId,
          onlineUsers: groupRooms[groupId].filter(id => Object.keys(userSocketMap).includes(id))
        });
      }
    });
    
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };