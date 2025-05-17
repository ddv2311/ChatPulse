import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GroupChat",
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String
    },
    image: {
        type: String
    },
    status: {
        type: String,
        enum: ["sent", "delivered"],
        default: "sent"
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        emoji: {
            type: String,
            required: true
        }
    }]
}, { timestamps: true });

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage; 