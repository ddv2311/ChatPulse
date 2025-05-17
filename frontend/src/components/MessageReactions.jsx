import { useState } from "react";

const MessageReactions = ({ reactions, onRemoveReaction, authUserId }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // If no reactions, don't render anything
  if (!reactions || reactions.length === 0) return null;
  
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});
  
  // Check if current user has reacted
  const userReaction = reactions.find(r => r.userId._id === authUserId || r.userId === authUserId);
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, users]) => (
        <button
          key={emoji}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs 
            ${userReaction && userReaction.emoji === emoji 
              ? "bg-primary/20 text-primary" 
              : "bg-base-300 text-base-content/80"
            } hover:bg-base-300/80 transition-colors`}
          onClick={() => {
            if (userReaction && userReaction.emoji === emoji) {
              onRemoveReaction();
            }
          }}
          onMouseEnter={() => setShowTooltip(emoji)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span>{emoji}</span>
          <span>{users.length}</span>
          
          {/* Tooltip with user names */}
          {showTooltip === emoji && (
            <div className="absolute bottom-full mb-1 bg-base-300 rounded-md p-1 text-xs z-10 whitespace-nowrap">
              {users.map(reaction => (
                <div key={reaction.userId._id || reaction.userId}>
                  {reaction.userId.fullName || "User"}
                </div>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default MessageReactions; 