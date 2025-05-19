import { Search, X, Shield, ShieldAlert } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useUserStore } from "../store/useUserStore";
import CallButton from "./CallButton";
import { useState, useEffect } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, setSearchQuery, clearSearch, searchQuery } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { blockedUsers, getBlockedUsers, blockUser, unblockUser, isUserBlocked } = useUserStore();
  const [showSearch, setShowSearch] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const isUserOnline = onlineUsers.includes(selectedUser._id);
  
  // Load blocked users when component mounts
  useEffect(() => {
    getBlockedUsers();
  }, [getBlockedUsers]);
  
  // Check if selected user is blocked
  useEffect(() => {
    if (selectedUser && blockedUsers.length > 0) {
      setIsBlocked(isUserBlocked(selectedUser._id));
    }
  }, [selectedUser, blockedUsers, isUserBlocked]);
  
  const handleSearchToggle = () => {
    if (showSearch) {
      clearSearch();
    }
    setShowSearch(!showSearch);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleBlockToggle = async () => {
    if (isBlocked) {
      await unblockUser(selectedUser._id);
    } else {
      await blockUser(selectedUser._id);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      {showSearch ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="input input-bordered w-full pr-10 input-sm sm:input-md"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => clearSearch()}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button 
            onClick={handleSearchToggle} 
            className="btn btn-ghost btn-circle btn-sm sm:btn-md"
            aria-label="Close search"
          >
            <X />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-8 sm:size-10 rounded-full relative">
                <img src={selectedUser.profilePicture || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium text-sm sm:text-base">{selectedUser.fullName}</h3>
              <p className="text-xs sm:text-sm text-base-content/70">
                {isUserOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Block/Unblock button */}
            <button 
              onClick={handleBlockToggle} 
              className={`btn btn-sm btn-ghost btn-circle tooltip tooltip-left`}
              data-tip={isBlocked ? "Unblock user" : "Block user"}
              aria-label={isBlocked ? "Unblock user" : "Block user"}
            >
              {isBlocked ? (
                <ShieldAlert className="size-4 text-error" />
              ) : (
                <Shield className="size-4" />
              )}
            </button>
            
            {/* Search button */}
            <button 
              onClick={handleSearchToggle} 
              className="btn btn-sm btn-ghost btn-circle"
              aria-label="Search messages"
            >
              <Search className="size-4" />
            </button>
            
            {/* Call buttons (only show if user is online and not blocked) */}
            {isUserOnline && !isBlocked && (
              <>
                <CallButton user={selectedUser} type="audio" />
                <CallButton user={selectedUser} type="video" />
              </>
            )}
            
            {/* Close button */}
            <button onClick={() => setSelectedUser(null)} className="btn btn-sm btn-ghost btn-circle">
              <X />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader; 