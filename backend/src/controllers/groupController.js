import GroupChat from "../models/groupChat.js";
import GroupMessage from "../models/groupMessages.js";
import User from "../models/users.js";

// Create a new group chat
export const createGroup = async (req, res) => {
    try {
        const { name, members, description } = req.body;
        const userId = req.user._id;

        if (!name || !members || members.length < 1) {
            return res.status(400).json({ error: "Please provide all required fields" });
        }

        // Add the creator to the members list if not already included
        if (!members.includes(userId.toString())) {
            members.push(userId.toString());
        }

        const newGroupChat = new GroupChat({
            name,
            admin: userId,
            members,
            description: description || ""
        });

        const savedGroupChat = await newGroupChat.save();
        
        // Populate the members information
        const populatedGroup = await GroupChat.findById(savedGroupChat._id)
            .populate("members", "fullName email profilePicture")
            .populate("admin", "fullName email profilePicture");

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error("Error in createGroup controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const groups = await GroupChat.find({ members: userId })
            .populate("members", "fullName email profilePicture")
            .populate("admin", "fullName email profilePicture")
            .sort({ updatedAt: -1 });
        
        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getUserGroups controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get a specific group by ID
export const getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;
        
        const group = await GroupChat.findById(groupId)
            .populate("members", "fullName email profilePicture")
            .populate("admin", "fullName email profilePicture");
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        // Check if user is a member of the group
        if (!group.members.some(member => member._id.toString() === userId.toString())) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }
        
        res.status(200).json(group);
    } catch (error) {
        console.error("Error in getGroupById controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Update group details
export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, groupImage } = req.body;
        const userId = req.user._id;
        
        const group = await GroupChat.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        // Check if user is the admin of the group
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only the group admin can update group details" });
        }
        
        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (description !== undefined) updatedFields.description = description;
        if (groupImage) updatedFields.groupImage = groupImage;
        
        const updatedGroup = await GroupChat.findByIdAndUpdate(
            groupId,
            { $set: updatedFields },
            { new: true }
        ).populate("members", "fullName email profilePicture")
         .populate("admin", "fullName email profilePicture");
        
        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Error in updateGroup controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Add members to group
export const addGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { members } = req.body;
        const userId = req.user._id;
        
        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ error: "Please provide valid member IDs" });
        }
        
        const group = await GroupChat.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        // Check if user is the admin of the group
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only the group admin can add members" });
        }
        
        // Add new members that aren't already in the group
        const updatedGroup = await GroupChat.findByIdAndUpdate(
            groupId,
            { $addToSet: { members: { $each: members } } },
            { new: true }
        ).populate("members", "fullName email profilePicture")
         .populate("admin", "fullName email profilePicture");
        
        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Error in addGroupMembers controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove member from group
export const removeGroupMember = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user._id;
        
        const group = await GroupChat.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        // Check if user is the admin of the group or removing themselves
        if (group.admin.toString() !== userId.toString() && userId.toString() !== memberId) {
            return res.status(403).json({ error: "You don't have permission to remove this member" });
        }
        
        // Prevent removing the admin
        if (memberId === group.admin.toString() && userId.toString() === memberId) {
            return res.status(400).json({ error: "Admin cannot leave the group. Transfer admin role first or delete the group" });
        }
        
        const updatedGroup = await GroupChat.findByIdAndUpdate(
            groupId,
            { $pull: { members: memberId } },
            { new: true }
        ).populate("members", "fullName email profilePicture")
         .populate("admin", "fullName email profilePicture");
        
        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Error in removeGroupMember controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete group
export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;
        
        const group = await GroupChat.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        
        // Check if user is the admin of the group
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Only the group admin can delete the group" });
        }
        
        // Delete all messages in the group
        await GroupMessage.deleteMany({ groupId });
        
        // Delete the group
        await GroupChat.findByIdAndDelete(groupId);
        
        res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error("Error in deleteGroup controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 