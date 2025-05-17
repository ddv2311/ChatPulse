import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Clock, Pencil } from "lucide-react";
import ReactionPicker from "./ReactionPicker";
import MessageReactions from "./MessageReactions";
import MessageActions from "./MessageActions";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [reactionMessage, setReactionMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!selectedUser) return;
    
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleAddReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
    setReactionMessage(null);
  };

  const handleRemoveReaction = async (messageId) => {
    try {
      await removeReaction(messageId);
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  };
  
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.text || "");
  };
  
  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;
    
    try {
      await editMessage(editingMessage._id, editText);
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };
  
  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-xl text-base-content/70">Select a user to start chatting</p>
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={index === messages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePicture || "/avatar.png"
                      : selectedUser.profilePicture || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1 flex items-center gap-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
              {message.senderId === authUser._id && (
                <span className="ml-1">
                  {message.status === "sent" && <Clock className="size-3 text-zinc-400" />}
                  {message.status === "delivered" && <Check className="size-3 text-zinc-400" />}
                  {message.status === "read" && <CheckCheck className="size-3 text-emerald-500" />}
                </span>
              )}
              {message.isEdited && (
                <span className="text-xs text-zinc-500 flex items-center gap-0.5 ml-1">
                  <Pencil className="size-3" />
                  <span>edited</span>
                </span>
              )}
            </div>
            
            {editingMessage && editingMessage._id === message._id ? (
              <div className="chat-bubble flex flex-col">
                <textarea
                  className="textarea textarea-bordered w-full bg-base-200 text-base-content"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    className="btn btn-sm btn-ghost" 
                    onClick={() => setEditingMessage(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={handleSaveEdit}
                    disabled={!editText.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="chat-bubble flex flex-col relative group">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
                
                {/* Message actions (edit, delete) - only for own messages */}
                {message.senderId === authUser._id && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageActions 
                      isVisible={true}
                      onEdit={() => handleEditMessage(message)}
                      onDelete={() => handleDeleteMessage(message._id)}
                    />
                  </div>
                )}
                
                {/* Reaction button - only visible on hover */}
                <div className={`absolute ${message.senderId === authUser._id ? "left-0 -translate-x-full" : "right-0 translate-x-full"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <ReactionPicker 
                    onSelectEmoji={(emoji) => handleAddReaction(message._id, emoji)}
                    isOpen={reactionMessage === message._id}
                    setIsOpen={(isOpen) => isOpen ? setReactionMessage(message._id) : setReactionMessage(null)}
                  />
                </div>
              </div>
            )}
            
            {/* Display reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={`chat-footer ${message.senderId === authUser._id ? "text-right" : "text-left"}`}>
                <MessageReactions 
                  reactions={message.reactions} 
                  onRemoveReaction={() => handleRemoveReaction(message._id)} 
                  authUserId={authUser._id}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;