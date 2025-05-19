import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useUserStore = create((set, get) => ({
  blockedUsers: [],
  isBlockingUser: false,
  isUnblockingUser: false,
  isLoadingBlockedUsers: false,
  
  // Get all blocked users
  getBlockedUsers: async () => {
    set({ isLoadingBlockedUsers: true });
    try {
      const res = await axiosInstance.get("/users/blocked/list");
      set({ blockedUsers: res.data });
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      toast.error(error.response?.data?.error || "Error fetching blocked users");
    } finally {
      set({ isLoadingBlockedUsers: false });
    }
  },
  
  // Block a user
  blockUser: async (userId) => {
    set({ isBlockingUser: true });
    try {
      await axiosInstance.post(`/users/block/${userId}`);
      
      // Add to blocked users list locally
      set(state => ({
        blockedUsers: [...state.blockedUsers, { _id: userId }]
      }));
      
      toast.success("User blocked successfully");
      return true;
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(error.response?.data?.error || "Error blocking user");
      return false;
    } finally {
      set({ isBlockingUser: false });
    }
  },
  
  // Unblock a user
  unblockUser: async (userId) => {
    set({ isUnblockingUser: true });
    try {
      await axiosInstance.post(`/users/unblock/${userId}`);
      
      // Remove from blocked users list locally
      set(state => ({
        blockedUsers: state.blockedUsers.filter(user => user._id !== userId)
      }));
      
      toast.success("User unblocked successfully");
      return true;
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error(error.response?.data?.error || "Error unblocking user");
      return false;
    } finally {
      set({ isUnblockingUser: false });
    }
  },
  
  // Check if a user is blocked
  isUserBlocked: (userId) => {
    return get().blockedUsers.some(user => user._id === userId);
  }
})); 