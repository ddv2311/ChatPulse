import { useState, useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Image as ImageIcon, Loader, Users, ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import GroupMessage from "./GroupMessage";
import GroupInfoModal from "./modals/GroupInfoModal";
import GroupChatHeader from "./GroupChatHeader";

const GroupChatContainer = () => {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const {
    selectedGroup,
    groupMessages,
    sendGroupMessage,
    isGroupMessagesLoading,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    searchQuery,
    searchResults,
    clearSearch
  } = useGroupStore();

  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  
  // Refs for search result navigation
  const searchResultRefs = useRef({});

  // Subscribe to socket events when component mounts or selected group changes
  useEffect(() => {
    if (selectedGroup) {
      subscribeToGroupMessages();
    }

    return () => {
      unsubscribeFromGroupMessages();
    };
  }, [selectedGroup, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);
  
  // Reset search index when search results change
  useEffect(() => {
    setCurrentSearchIndex(0);
    // Scroll to first result if available
    if (searchResults.length > 0) {
      setTimeout(() => {
        scrollToSearchResult(0);
      }, 100);
    }
  }, [searchResults]);

  // Handle scrolling to search result
  const scrollToSearchResult = (index) => {
    if (searchResults.length === 0) return;
    
    // Keep index within bounds
    const boundedIndex = Math.max(0, Math.min(index, searchResults.length - 1));
    setCurrentSearchIndex(boundedIndex);
    
    // Get the element and scroll to it
    const messageId = searchResults[boundedIndex]._id;
    const element = searchResultRefs.current[messageId];
    
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };
  
  // Handle navigation buttons for search
  const handlePrevResult = () => {
    scrollToSearchResult(currentSearchIndex - 1);
  };
  
  const handleNextResult = () => {
    scrollToSearchResult(currentSearchIndex + 1);
  };
  
  // Highlight search terms in message text
  const highlightSearchText = (text) => {
    if (!searchQuery || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-warning text-warning-content px-0.5 rounded">{part}</mark>
        : part
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !image) || isSubmitting) return;

    setIsSubmitting(true);

    // Convert image to base64 if present
    let imageBase64 = "";
    if (image) {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      await new Promise((resolve) => {
        reader.onload = () => {
          imageBase64 = reader.result;
          resolve();
        };
      });
    }

    await sendGroupMessage({
      text: message.trim(),
      image: imageBase64,
    });

    setMessage("");
    setImage(null);
    setIsSubmitting(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
    }
  };

  if (!selectedGroup) return null;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <GroupChatHeader onInfoModalOpen={() => setIsInfoModalOpen(true)} />
      
      {/* Search results navigation */}
      {searchResults.length > 0 && (
        <div className="p-2 bg-base-200 border-b border-base-300 flex items-center justify-between text-xs sm:text-sm">
          <span>
            {currentSearchIndex + 1} of {searchResults.length}
          </span>
          <div className="flex gap-1 sm:gap-2">
            <button 
              onClick={handlePrevResult}
              className="btn btn-sm btn-ghost btn-circle btn-xs sm:btn-sm"
              disabled={currentSearchIndex === 0}
              aria-label="Previous result"
            >
              <ArrowUpCircle className="size-4 sm:size-5" />
            </button>
            <button 
              onClick={handleNextResult}
              className="btn btn-sm btn-ghost btn-circle btn-xs sm:btn-sm"
              disabled={currentSearchIndex >= searchResults.length - 1}
              aria-label="Next result"
            >
              <ArrowDownCircle className="size-4 sm:size-5" />
            </button>
            <button 
              onClick={() => clearSearch()}
              className="btn btn-xs sm:btn-sm btn-ghost text-xs sm:text-sm"
              aria-label="Clear search"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isGroupMessagesLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="size-10 animate-spin" />
          </div>
        ) : groupMessages.length > 0 ? (
          <div className="space-y-4">
            {groupMessages.map((msg) => {
              // Check if this message is in search results
              const isSearchResult = searchQuery && searchResults.some(m => m._id === msg._id);
              // Check if this is the current focused search result
              const isCurrentResult = searchResults[currentSearchIndex]?._id === msg._id;
              const isOwnMessage = msg.senderId._id === authUser._id;
              
              return (
                <div
                  key={msg._id}
                  ref={(el) => {
                    // Store reference if it's a search result
                    if (isSearchResult) {
                      searchResultRefs.current[msg._id] = el;
                    }
                    // Last message reference for auto-scroll
                    if (msg._id === groupMessages[groupMessages.length - 1]._id) {
                      messagesEndRef.current = el;
                    }
                  }}
                  className={`${
                    isSearchResult ? "opacity-100" : searchQuery ? "opacity-70" : "opacity-100"
                  } ${isCurrentResult ? "ring-2 ring-warning ring-offset-2 rounded-lg" : ""}`}
                >
                  <GroupMessage
                    message={msg}
                    isOwnMessage={isOwnMessage}
                    highlightText={highlightSearchText}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Users className="size-16 mb-2" />
            <p className="text-lg font-medium">No messages yet</p>
            <p>Be the first to send a message in this group!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-base-300">
        {image && (
          <div className="mb-2 relative inline-block">
            <img
              src={URL.createObjectURL(image)}
              alt="Selected"
              className="h-20 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-base-100 rounded-full p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <label className="btn btn-circle btn-sm">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <ImageIcon className="size-5" />
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${selectedGroup.name}...`}
            className="input input-bordered flex-1"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="btn btn-primary btn-circle"
            disabled={(!message.trim() && !image) || isSubmitting}
          >
            {isSubmitting ? (
              <Loader className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </div>
      </form>

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        group={selectedGroup}
      />
    </div>
  );
};

export default GroupChatContainer; 