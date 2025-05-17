import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
   text:{
    type:String,
   },
   image:{
    type:String,
   },
   status:{
    type:String,
    enum:["sent", "delivered", "read"],
    default:"sent"
   },
   isEdited: {
    type: Boolean,
    default: false
   },
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
},
{timestamps:true}
)

const Message = mongoose.model("Message",messageSchema);

export default Message;
