import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Clock, Eye } from "lucide-react";
import { useState } from "react";

const GroupMessage = ({ message, isOwnMessage }) => {
  const [showReadBy, setShowReadBy] = useState(false);
  
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  });
  
  // Calculate read count (excluding sender)
  const readCount = message.readBy ? 
    message.readBy.filter(user => user._id !== message.senderId._id).length : 0;

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

        <div
          className={`rounded-lg p-3 ${
            isOwnMessage
              ? "bg-primary text-primary-content"
              : "bg-base-300 text-base-content"
          }`}
        >
          {/* Message content */}
          {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
          
          {/* Image if present */}
          {message.image && (
            <img
              src={message.image}
              alt="Message attachment"
              className="mt-2 rounded-md max-w-full max-h-60 object-contain"
            />
          )}
        </div>
        
        {/* Timestamp and read status */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-zinc-500">{formattedTime}</span>
          
          {/* Show message status for own messages */}
          {isOwnMessage && (
            <div className="flex items-center">
              {message.status === "sent" && <Clock className="size-3 text-zinc-400 ml-1" />}
              {message.status === "delivered" && <Check className="size-3 text-zinc-400 ml-1" />}
              
              {/* Read indicator with count */}
              {readCount > 0 && (
                <button 
                  className="flex items-center ml-1 text-xs text-zinc-500 hover:text-zinc-400"
                  onClick={() => setShowReadBy(!showReadBy)}
                  title={`Read by ${readCount} ${readCount === 1 ? 'person' : 'people'}`}
                >
                  <Eye className="size-3 mr-0.5" />
                  {readCount}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Read by tooltip */}
        {showReadBy && readCount > 0 && (
          <div className="mt-1 p-2 bg-base-200 rounded-md text-xs">
            <div className="font-medium mb-1">Read by:</div>
            <ul>
              {message.readBy
                .filter(user => user._id !== message.senderId._id)
                .map(user => (
                  <li key={user._id} className="flex items-center gap-1 mb-1">
                    <img 
                      src={user.profilePicture || "/avatar.png"} 
                      alt={user.fullName}
                      className="w-4 h-4 rounded-full"
                    />
                    <span>{user.fullName}</span>
                  </li>
                ))
              }
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMessage; 