import User from "../models/users.js";

// Get user profile
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select("-password");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getUserProfile controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Block a user
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;
        
        // Make sure user is not trying to block themselves
        if (userId === currentUserId.toString()) {
            return res.status(400).json({ error: "You cannot block yourself" });
        }
        
        // Check if user exists
        const userToBlock = await User.findById(userId);
        if (!userToBlock) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Add user to blockedUsers array if not already blocked
        const currentUser = await User.findById(currentUserId);
        if (currentUser.blockedUsers.includes(userId)) {
            return res.status(400).json({ error: "User is already blocked" });
        }
        
        // Add to blocked users array
        await User.findByIdAndUpdate(
            currentUserId,
            { $addToSet: { blockedUsers: userId } },
            { new: true }
        );
        
        res.status(200).json({ message: "User blocked successfully" });
    } catch (error) {
        console.error("Error in blockUser controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Unblock a user
export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;
        
        // Check if user exists
        const userToUnblock = await User.findById(userId);
        if (!userToUnblock) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Remove user from blockedUsers array
        await User.findByIdAndUpdate(
            currentUserId,
            { $pull: { blockedUsers: userId } },
            { new: true }
        );
        
        res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
        console.error("Error in unblockUser controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get blocked users list
export const getBlockedUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        
        // Get current user with populated blocked users
        const currentUser = await User.findById(currentUserId)
            .populate("blockedUsers", "fullName email profilePicture");
        
        res.status(200).json(currentUser.blockedUsers);
    } catch (error) {
        console.error("Error in getBlockedUsers controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 