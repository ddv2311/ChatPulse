import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    groupImage: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const GroupChat = mongoose.model("GroupChat", groupChatSchema);

export default GroupChat; 