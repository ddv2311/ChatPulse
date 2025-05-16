import { formatDistanceToNow } from "date-fns";

const GroupMessage = ({ message, isOwnMessage }) => {
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  });

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
        
        {/* Timestamp */}
        <span className="text-xs text-zinc-500 mt-1">{formattedTime}</span>
      </div>
    </div>
  );
};

export default GroupMessage; 