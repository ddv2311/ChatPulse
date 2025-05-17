import { useState } from "react";
import { Search, Info, X, Users } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import GroupCallButton from "./GroupCallButton";

const GroupChatHeader = ({ onInfoModalOpen }) => {
  const { selectedGroup, setSearchQuery, clearSearch, searchQuery } = useGroupStore();
  const [showSearch, setShowSearch] = useState(false);
  
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
            <div className={`
              size-8 sm:size-10 rounded-full flex items-center justify-center
              ${selectedGroup.groupImage ? "" : "bg-primary text-primary-content"}
            `}>
              {selectedGroup.groupImage ? (
                <img
                  src={selectedGroup.groupImage}
                  alt={selectedGroup.name}
                  className="size-10 object-cover rounded-full"
                />
              ) : (
                <span className="text-lg font-bold">
                  {selectedGroup.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm sm:text-base">{selectedGroup.name}</h3>
              <div className="text-xs sm:text-sm text-base-content/70 flex items-center gap-1">
                <Users className="size-3" />
                <span>{selectedGroup.members.length} members</span>
              </div>
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
            
            {/* Group call buttons */}
            <GroupCallButton group={selectedGroup} type="audio" />
            <GroupCallButton group={selectedGroup} type="video" />
            
            {/* Group info button */}
            <button
              onClick={onInfoModalOpen}
              className="btn btn-sm btn-ghost btn-circle"
              title="Group Info"
            >
              <Info className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatHeader; 