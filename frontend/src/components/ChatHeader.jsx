import { Search, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import CallButton from "./CallButton";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, setSearchQuery, clearSearch, searchQuery } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  
  const isUserOnline = onlineUsers.includes(selectedUser._id);
  
  const handleSearchToggle = () => {
    if (showSearch) {
      clearSearch();
    }
    setShowSearch(!showSearch);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
            {/* Search button */}
            <button 
              onClick={handleSearchToggle} 
              className="btn btn-sm btn-ghost btn-circle"
              aria-label="Search messages"
            >
              <Search className="size-4" />
            </button>
            
            {/* Call buttons (only show if user is online) */}
            {isUserOnline && (
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