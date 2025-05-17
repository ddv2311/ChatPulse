import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

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

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // First, unsubscribe from any existing listeners to prevent duplicates
    socket.off("newMessage");
    socket.off("messageStatusUpdate");
    socket.off("messageReaction");
    
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
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageStatusUpdate");
      socket.off("messageReaction");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));