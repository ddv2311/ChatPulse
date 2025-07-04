import { create } from "zustand";import toast from "react-hot-toast";import { axiosInstance } from "../lib/axios";import { useAuthStore } from "./useAuthStore";import notificationService from "../lib/notificationService";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  searchQuery: "",
  searchResults: [],

  // Search functions
  setSearchQuery: (query) => {
    const { messages } = get();
    const results = query.trim() === "" ? [] : messages.filter(message => 
      message.text && message.text.toLowerCase().includes(query.toLowerCase())
    );
    set({ searchQuery: query, searchResults: results });
  },
  
  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error getting users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error getting messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending message");
    }
  },

  updateMessageStatus: async (messageId, status) => {
    try {
      await axiosInstance.put(`/messages/status/${messageId}`, { status });
      
      // Update message status in local state
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, status } : msg
        )
      }));
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  },
  
  // Add reaction to a message
  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/${messageId}/reactions`, { emoji });
      
      // Update message reactions in local state
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        )
      }));
      
      return res.data;
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error(error.response?.data?.error || "Failed to add reaction");
    }
  },
  
  // Remove reaction from a message
  removeReaction: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}/reactions`);
      
      // Update message reactions in local state
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        )
      }));
      
      return res.data;
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error(error.response?.data?.error || "Failed to remove reaction");
    }
  },

  // Edit a message
  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text });
      
      // Update message in local state
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, text: res.data.text, isEdited: true } : msg
        )
      }));
      
      // Notify the receiver via socket
      const socket = useAuthStore.getState().socket;
      const selectedUser = get().selectedUser;
      if (socket && selectedUser) {
        socket.emit("editMessage", {
          messageId,
          text,
          receiverId: selectedUser._id
        });
      }
      
      return res.data;
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error(error.response?.data?.error || "Failed to edit message");
      throw error;
    }
  },
  
  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Remove message from local state
      set(state => ({
        messages: state.messages.filter(msg => msg._id !== messageId)
      }));
      
      // Notify the receiver via socket
      const socket = useAuthStore.getState().socket;
      const selectedUser = get().selectedUser;
      if (socket && selectedUser) {
        socket.emit("deleteMessage", {
          messageId,
          receiverId: selectedUser._id
        });
      }
      
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },
  
  // Forward a message to selected users
  forwardMessage: async (message, recipients) => {
    try {
      // Create base message data without message-specific IDs
      const baseMessageData = {
        text: message.text,
        fileUrl: message.fileUrl,
        fileType: message.fileType,
        fileName: message.fileName,
        isForwarded: true,
        originalSenderId: message.senderId
      };
      
      // Send message to each recipient
      const promises = recipients.map(recipient => 
        axiosInstance.post(`/messages/forward/${recipient._id}`, baseMessageData)
      );
      
      const results = await Promise.all(promises);
      
      // If current selected user is one of the recipients, add message to the current chat
      const selectedUser = get().selectedUser;
      if (selectedUser && recipients.some(r => r._id === selectedUser._id)) {
        const newMessageForCurrentChat = results.find(
          msg => msg.data.receiverId === selectedUser._id
        );
        
        if (newMessageForCurrentChat) {
          set(state => ({
            messages: [...state.messages, newMessageForCurrentChat.data]
          }));
        }
      }
      
      toast.success(`Message forwarded to ${recipients.length} user(s)`);
      return results.map(res => res.data);
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error(error.response?.data?.error || "Failed to forward message");
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // First, unsubscribe from any existing listeners to prevent duplicates
    socket.off("newMessage");
    socket.off("messageStatusUpdate");
    socket.off("messageReaction");
    socket.off("messageEdited");
    socket.off("messageDeleted");
    
    // Then add new listeners
    socket.on("newMessage", (message) => {
      // Only add messages that involve the currently selected user
      const isRelevantMessage = 
        message.senderId === selectedUser._id || 
        message.receiverId === selectedUser._id;
        
      if (isRelevantMessage) {
        // Check if this message already exists in our state
        const messageExists = get().messages.some(m => m._id === message._id);
        
        // Only add if it doesn't exist
        if (!messageExists) {
          set((state) => ({
            messages: [...state.messages, message],
          }));
          
          // If the message is from the selected user, mark it as read
          if (message.senderId === selectedUser._id) {
            get().updateMessageStatus(message._id, "read");
            
            // Notify the sender that we've read their message
            socket.emit("messageRead", {
              messageId: message._id,
              senderId: message.senderId
            });
          }
          
          // Show notifications for all incoming messages that aren't from the current user
          const authUser = useAuthStore.getState().authUser;
          if (message.senderId !== authUser._id) {
            // Find sender info from users list
            const sender = get().users.find(u => u._id === message.senderId) || selectedUser;
            notificationService.showMessageNotification(message, sender);
          }
        }
      }
    });
    
    // Listen for message status updates
    socket.on("messageStatusUpdate", ({ messageId, status }) => {
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, status } : msg
        )
      }));
    });
    
    // Listen for message reaction updates
    socket.on("messageReaction", ({ messageId, reactions }) => {
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      }));
    });
    
    // Listen for message edit updates
    socket.on("messageEdited", ({ messageId, text, isEdited }) => {
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, text, isEdited } : msg
        )
      }));
    });
    
    // Listen for message deletion
    socket.on("messageDeleted", ({ messageId }) => {
      set(state => ({
        messages: state.messages.filter(msg => msg._id !== messageId)
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageStatusUpdate");
      socket.off("messageReaction");
      socket.off("messageEdited");
      socket.off("messageDeleted");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));