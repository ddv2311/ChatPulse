import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  isCreatingGroup: false,
  searchQuery: "",
  searchResults: [],
  
  // Search functions
  setSearchQuery: (query) => {
    const { groupMessages } = get();
    const results = query.trim() === "" ? [] : groupMessages.filter(message => 
      message.text && message.text.toLowerCase().includes(query.toLowerCase())
    );
    set({ searchQuery: query, searchResults: results });
  },
  
  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },
  
  // Get all groups the user is a member of
  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Error getting groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },
  
  // Get messages for a specific group
  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Error getting group messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },
  
  // Create a new group
  createGroup: async (groupData) => {
    set({ isCreatingGroup: true });
    try {
      const res = await axiosInstance.post("/groups", groupData);
      set((state) => ({ groups: [...state.groups, res.data] }));
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Error creating group");
      return null;
    } finally {
      set({ isCreatingGroup: false });
    }
  },
  
  // Send a message to a group
  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    try {
      const res = await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, messageData);
      set({ groupMessages: [...groupMessages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Error sending message");
    }
  },
  
  // Add members to a group
  addGroupMembers: async (groupId, members) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { members });
      
      // Update the group in the groups array
      set((state) => ({
        groups: state.groups.map(group => 
          group._id === groupId ? res.data : group
        ),
        // If this is the currently selected group, update it too
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
      }));
      
      toast.success("Members added successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error adding members");
    }
  },
  
  // Remove a member from a group
  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
      
      // Update the group in the groups array
      set((state) => ({
        groups: state.groups.map(group => 
          group._id === groupId ? res.data : group
        ),
        // If this is the currently selected group, update it too
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
      }));
      
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error removing member");
    }
  },
  
  // Delete a group
  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      
      // Remove the group from the groups array
      set((state) => ({
        groups: state.groups.filter(group => group._id !== groupId),
        // If this was the selected group, clear the selection
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        // Clear messages if this was the selected group
        groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages
      }));
      
      toast.success("Group deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error deleting group");
    }
  },
  
  // Update group details
  updateGroup: async (groupId, groupData) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, groupData);
      
      // Update the group in the groups array
      set((state) => ({
        groups: state.groups.map(group => 
          group._id === groupId ? res.data : group
        ),
        // If this is the currently selected group, update it too
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
      }));
      
      toast.success("Group updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating group");
    }
  },
  
  // Add reaction to a group message
  addGroupMessageReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/groups/messages/${messageId}/reactions`, { emoji });
      
      // Update message reactions in local state
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        )
      }));
      
      return res.data;
    } catch (error) {
      console.error("Error adding reaction to group message:", error);
      toast.error(error.response?.data?.error || "Failed to add reaction");
    }
  },
  
  // Remove reaction from a group message
  removeGroupMessageReaction: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/groups/messages/${messageId}/reactions`);
      
      // Update message reactions in local state
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        )
      }));
      
      return res.data;
    } catch (error) {
      console.error("Error removing reaction from group message:", error);
      toast.error(error.response?.data?.error || "Failed to remove reaction");
    }
  },
  
  // Edit a group message
  editGroupMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/groups/messages/${messageId}`, { text });
      
      // Update message in local state
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === messageId ? { ...res.data } : msg
        )
      }));
      
      return res.data;
    } catch (error) {
      console.error("Error editing group message:", error);
      toast.error(error.response?.data?.error || "Failed to edit message");
      throw error;
    }
  },
  
  // Delete a group message
  deleteGroupMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/groups/messages/${messageId}`);
      
      // Remove message from local state
      set(state => ({
        groupMessages: state.groupMessages.filter(msg => msg._id !== messageId)
      }));
      
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting group message:", error);
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },
  
  // Subscribe to socket events for group messages
  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // Join the group room
    socket.emit("joinGroup", selectedGroup._id);
    
    // First, unsubscribe from any existing listeners to prevent duplicates
    socket.off("newGroupMessage");
    socket.off("deleteGroupMessage");
    socket.off("groupOnlineUsers");
    socket.off("groupMessageStatusUpdate");
    socket.off("groupMessageRead");
    socket.off("groupMessageReaction");
    socket.off("editGroupMessage");
    
    // Listen for new messages
    socket.on("newGroupMessage", (message) => {
      // Only add messages for the currently selected group
      if (message.groupId === selectedGroup._id) {
        // Check if this message already exists in our state
        const messageExists = get().groupMessages.some(m => m._id === message._id);
        
        // Only add if it doesn't exist
        if (!messageExists) {
          set((state) => ({
            groupMessages: [...state.groupMessages, message],
          }));
          
          // Mark the message as read if it wasn't sent by the current user
          const authUser = useAuthStore.getState().authUser;
          if (message.senderId._id !== authUser._id) {
            // Call API to mark as read
            axiosInstance.put(`/groups/messages/${message._id}/read`).catch(err => {
              console.error("Error marking message as read:", err);
            });
          }
        }
      }
    });
    
    // Listen for deleted messages
    socket.on("deleteGroupMessage", ({ messageId }) => {
      set((state) => ({
        groupMessages: state.groupMessages.filter(m => m._id !== messageId)
      }));
    });
    
    // Listen for message status updates
    socket.on("groupMessageStatusUpdate", ({ messageId, status }) => {
      set((state) => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === messageId ? { ...msg, status } : msg
        )
      }));
    });
    
    // Listen for message read updates
    socket.on("groupMessageRead", ({ messageId, userId }) => {
      set((state) => ({
        groupMessages: state.groupMessages.map(msg => {
          if (msg._id === messageId) {
            // Add the user to the readBy array if not already there
            const userAlreadyRead = msg.readBy.some(user => user._id === userId);
            if (!userAlreadyRead) {
              return {
                ...msg,
                readBy: [...msg.readBy, { _id: userId }]
              };
            }
          }
          return msg;
        })
      }));
    });
    
    // Listen for online users in the group
    socket.on("groupOnlineUsers", ({ groupId, onlineUsers }) => {
      if (groupId === selectedGroup._id) {
        // You can store this information if needed
        // For now we'll just log it
        console.log("Online users in group:", onlineUsers);
      }
    });
    
    // Listen for message reaction updates
    socket.on("groupMessageReaction", ({ messageId, reactions }) => {
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      }));
    });
    
    // Listen for message edit updates
    socket.on("editGroupMessage", ({ messageId, text, isEdited }) => {
      set(state => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === messageId ? { ...msg, text, isEdited } : msg
        )
      }));
    });
  },
  
  // Unsubscribe from group message events
  unsubscribeFromGroupMessages: () => {
    const { selectedGroup } = get();
    const socket = useAuthStore.getState().socket;
    
    if (socket && selectedGroup) {
      // Leave the group room
      socket.emit("leaveGroup", selectedGroup._id);
      
      // Unsubscribe from events
      socket.off("newGroupMessage");
      socket.off("deleteGroupMessage");
      socket.off("groupOnlineUsers");
      socket.off("groupMessageStatusUpdate");
      socket.off("groupMessageRead");
      socket.off("groupMessageReaction");
      socket.off("editGroupMessage");
    }
  },
  
  // Set the selected group
  setSelectedGroup: (group) => {
    // If we're changing groups, unsubscribe from the old one first
    const currentGroup = get().selectedGroup;
    if (currentGroup && currentGroup._id !== group?._id) {
      get().unsubscribeFromGroupMessages();
    }
    
    set({ selectedGroup: group });
    
    // Subscribe to the new group if one is selected
    if (group) {
      // Clear messages when changing groups
      set({ groupMessages: [] });
      
      // Load messages for the new group
      get().getGroupMessages(group._id);
      
      // Subscribe to socket events for the new group
      setTimeout(() => {
        get().subscribeToGroupMessages();
      }, 0);
    }
  },
  
  // Clear selected group
  clearSelectedGroup: () => {
    get().unsubscribeFromGroupMessages();
    set({ selectedGroup: null, groupMessages: [] });
  }
})); 