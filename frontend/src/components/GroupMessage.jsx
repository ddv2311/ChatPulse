import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Clock, Eye, Pencil, FileText, Film, Music, Download } from "lucide-react";
import { useState } from "react";
import ReactionPicker from "./ReactionPicker";
import MessageReactions from "./MessageReactions";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import MessageActions from "./MessageActions";
import { handleFile } from "../lib/utils";

const GroupMessage = ({ message, isOwnMessage, highlightText, onForward }) => {
  const [showReadBy, setShowReadBy] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  
  const { 
    addGroupMessageReaction, 
    removeGroupMessageReaction, 
    editGroupMessage, 
    deleteGroupMessage 
  } = useGroupStore();
  
  const { authUser } = useAuthStore();
  
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  });
  
  // Calculate read count (excluding sender)
  const readCount = message.readBy ? 
    message.readBy.filter(user => user._id !== message.senderId._id).length : 0;

  const handleAddReaction = async (emoji) => {
    try {
      await addGroupMessageReaction(message._id, emoji);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
    setShowReactionPicker(false);
  };

  const handleRemoveReaction = async () => {
    try {
      await removeGroupMessageReaction(message._id);
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditText(message.text || "");
  };
  
  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    
    try {
      await editGroupMessage(message._id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteGroupMessage(message._id);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  // Process message text with highlighting if needed
  const processMessageText = (text) => {
    return highlightText ? highlightText(text) : text;
  };
  
  // Render file attachment based on file type
  const renderFileContent = () => {
    if (!message.fileUrl) return null;

    switch (message.fileType) {
      case "image":
        return (
          <img
            src={message.fileUrl}
            alt="Image attachment"
            className="mt-2 rounded-md max-w-full max-h-60 object-contain"
          />
        );
      case "video":
        return (
          <div className="mt-2">
            <video
              src={message.fileUrl}
              controls
              className="rounded-md max-w-full max-h-60"
            />
          </div>
        );
      case "audio":
        return (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-base-200 bg-opacity-60">
            <Music className="size-4 flex-shrink-0" />
            <audio src={message.fileUrl} controls className="max-w-full" />
          </div>
        );
      case "document":
        const isPdf = message.fileName?.toLowerCase().endsWith('.pdf') || message.fileUrl.toLowerCase().includes('.pdf');
        
        return (
          <div className="mt-2 flex flex-col gap-1">
            {/* Document preview/download UI */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleFile(message.fileUrl, message.fileName, "document", false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg bg-base-200 bg-opacity-60 hover:bg-opacity-80 transition-colors"
            >
              <FileText className="size-5 flex-shrink-0" />
              <div className="overflow-hidden">
                <span className="block truncate">{message.fileName || "Document"}</span>
                <span className="text-xs opacity-70">
                  {isPdf ? "Click to preview" : "Click to download"}
                </span>
              </div>
            </a>
            
            {/* Only show download button for PDFs, since other docs auto-download */}
            {isPdf && (
              <button
                onClick={() => handleFile(message.fileUrl, message.fileName, "document", true)}
                className="text-xs flex items-center gap-1 text-primary hover:underline self-start"
              >
                <Download className="size-3" />
                <span>Download</span>
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } gap-2 max-w-full`}
    >
      {/* Show sender's avatar only for messages from others */}
      {!isOwnMessage && (
        <div className="avatar">
          <div className="w-8 h-8 rounded-full">
            <img
              src={message.senderId.profilePicture || "/avatar.png"}
              alt={message.senderId.fullName}
            />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col ${
          isOwnMessage ? "items-end" : "items-start"
        } max-w-[75%]`}
      >
        {/* Show sender name only for messages from others */}
        {!isOwnMessage && (
          <span className="text-xs font-medium text-zinc-500 mb-1">
            {message.senderId.fullName}
          </span>
        )}

        {isEditing ? (
          <div className={`rounded-lg p-3 ${
            isOwnMessage
              ? "bg-primary/10 text-primary-content"
              : "bg-base-300 text-base-content"
          }`}>
            <textarea
              className="textarea textarea-bordered w-full bg-base-200 text-base-content"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => setIsEditing(false)}
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
          <div
            className={`rounded-lg p-3 relative group ${
              isOwnMessage
                ? "bg-primary text-primary-content"
                : "bg-base-300 text-base-content"
            }`}
          >
            {/* Forwarded message indicator */}
            {message.isForwarded && (
              <div className={`text-xs mb-1 flex items-center gap-1 ${isOwnMessage ? 'text-primary-content/70' : 'text-base-content/70'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 17 4 12 9 7"></polyline>
                  <path d="M20 12H4"></path>
                </svg>
                <span>
                  Forwarded
                  {message.originalSenderId && message.originalSenderId._id !== message.senderId._id && (
                    <span> · {message.originalSenderId.fullName}</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Message content */}
            {message.text && <p className="whitespace-pre-wrap break-words">{processMessageText(message.text)}</p>}
            
            {/* File content */}
            {renderFileContent()}
            
            {/* Legacy support for old image messages */}
            {!message.fileUrl && message.image && (
              <img
                src={message.image}
                alt="Message attachment"
                className="mt-2 rounded-md max-w-full max-h-60 object-contain"
              />
            )}
            
            {/* Message actions - edit/delete for own messages, forward for all */}
            <div className="absolute top-0 right-0 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageActions 
                isVisible={true}
                onEdit={isOwnMessage ? handleEdit : undefined}
                onDelete={isOwnMessage ? handleDelete : undefined}
                onForward={() => {
                  // Pass message to the parent component for forwarding
                  if (typeof onForward === 'function') {
                    onForward(message);
                  }
                }}
              />
            </div>
            
            {/* Reaction button - only visible on hover */}
            <div className={`absolute ${isOwnMessage ? "left-0 -translate-x-full" : "right-0 translate-x-full"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <ReactionPicker 
                onSelectEmoji={handleAddReaction}
                isOpen={showReactionPicker}
                setIsOpen={setShowReactionPicker}
              />
            </div>
          </div>
        )}

        {/* Display reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1">
            <MessageReactions
              reactions={message.reactions}
              onRemoveReaction={handleRemoveReaction}
              authUserId={authUser._id}
            />
          </div>
        )}

        {/* Show time in footer with read status for own messages */}
        <div className={`mt-1 text-xs text-zinc-500 ${isOwnMessage ? "text-right" : "text-left"} flex items-center ${isOwnMessage ? "justify-end" : "justify-start"} gap-2`}>
          <span>{formattedTime}</span>
          
          {/* Read indicator inline with timestamp */}
          {isOwnMessage && readCount > 0 && (
            <div className="relative">
              <button 
                className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-700 transition-colors"
                onClick={() => setShowReadBy(!showReadBy)}
              >
                <Eye className="size-3" />
                {readCount}
              </button>
              
              {showReadBy && (
                <div className="absolute bottom-full right-0 mb-1 bg-base-100 rounded-lg shadow-md p-2 z-10 min-w-32 border border-base-300">
                  <h4 className="text-xs font-medium mb-1">
                    {message.isForwarded ? "Seen in this chat by" : "Read by"}
                  </h4>
                  <ul className="text-xs space-y-1">
                    {message.readBy
                      .filter(user => user._id !== message.senderId._id)
                      .map(user => (
                        <li key={user._id} className="flex items-center gap-1">
                          <div className="avatar">
                            <div className="w-4 h-4 rounded-full">
                              <img
                                src={user.profilePicture || "/avatar.png"}
                                alt={user.fullName}
                              />
                            </div>
                          </div>
                          <span>{user.fullName}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupMessage; 