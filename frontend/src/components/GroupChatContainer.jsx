import { useState, useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Image as ImageIcon, Loader, Users, ArrowDownCircle, ArrowUpCircle, X, Plus, FileText, Film, Music } from "lucide-react";
import GroupMessage from "./GroupMessage";
import GroupInfoModal from "./modals/GroupInfoModal";
import GroupChatHeader from "./GroupChatHeader";
import ForwardMessageModal from "./ForwardMessageModal";
import toast from "react-hot-toast";

const GroupChatContainer = () => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);  const [isSubmitting, setIsSubmitting] = useState(false);  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);  const [forwardMessage, setForwardMessage] = useState(null);  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

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
    if ((!message.trim() && !file) || isSubmitting) return;

    setIsSubmitting(true);

    // Check file size
    if (file && file.size > 10 * 1024 * 1024) { // If larger than 10MB
      toast.error("File is too large. Please select a file smaller than 10MB.");
      setIsSubmitting(false);
      return;
    }

    // Convert file to base64 if present
    let fileBase64 = "";
    if (file) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve) => {
          reader.onload = () => {
            fileBase64 = reader.result;
            resolve();
          };
        });
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Error processing file. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    await sendGroupMessage({
      text: message.trim(),
      file: fileBase64,
      fileType: fileType,
      fileName: file ? file.name : null
    });

    setMessage("");
    setFile(null);
    setFileType(null);
    setIsSubmitting(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Check file size - 10MB limit
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSizeInBytes) {
      toast.error(`File is too large. Maximum size is 10MB.`);
      e.target.value = null; // Clear the input
      return;
    }

    // Determine file type based on MIME type
    let type;
    if (selectedFile.type.startsWith("image/")) {
      type = "image";
    } else if (selectedFile.type.startsWith("video/")) {
      type = "video";
    } else if (selectedFile.type.startsWith("audio/")) {
      type = "audio";
    } else if (selectedFile.type.includes("pdf") || selectedFile.type.includes("document") || 
               selectedFile.type.includes("sheet") || selectedFile.type.includes("text")) {
      type = "document";
      
      // Special handling for PDFs
      if (selectedFile.type.includes("pdf") && selectedFile.size > 5 * 1024 * 1024) {
        toast.warning("Large PDF files may take longer to upload. Please be patient.");
      }
    } else {
      toast.error("Unsupported file type");
      e.target.value = null; // Clear the input
      return;
    }

    setFileType(type);
    setFile(selectedFile);
  };

  const renderFilePreview = () => {
    if (!file) return null;

    switch (fileType) {
      case "image":
        return (
          <img
            src={URL.createObjectURL(file)}
            alt="Selected"
            className="h-20 rounded-md object-cover"
          />
        );
      case "video":
        return (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-base-300 border border-zinc-700">
            <Film className="size-5 text-accent" />
            <span className="text-xs truncate max-w-32">{file.name}</span>
          </div>
        );
      case "audio":
        return (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-base-300 border border-zinc-700">
            <Music className="size-5 text-accent" />
            <span className="text-xs truncate max-w-32">{file.name}</span>
          </div>
        );
      case "document":
        return (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-base-300 border border-zinc-700">
            <FileText className="size-5 text-accent" />
            <span className="text-xs truncate max-w-32">{file.name}</span>
          </div>
        );
      default:
        return null;
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
                                    <GroupMessage                    message={msg}                    isOwnMessage={isOwnMessage}                    highlightText={highlightSearchText}                    onForward={(message) => {                      setForwardMessage(message);                      setIsForwardModalOpen(true);                    }}                  />
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
        {file && (
          <div className="mb-2 relative inline-block">
            {renderFilePreview()}
            <button
              type="button"
              onClick={() => { setFile(null); setFileType(null); }}
              className="absolute -top-2 -right-2 bg-base-100 rounded-full p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="dropdown dropdown-top">
            <label tabIndex={0} className="btn btn-circle btn-sm">
              <Plus className="size-5" />
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
              <li>
                <label className="flex items-center gap-2">
                  <ImageIcon size={16} />
                  <span>Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </li>
              <li>
                <label className="flex items-center gap-2">
                  <Film size={16} />
                  <span>Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </li>
              <li>
                <label className="flex items-center gap-2">
                  <Music size={16} />
                  <span>Audio</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </li>
              <li>
                <label className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>Document</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </li>
            </ul>
          </div>
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
            disabled={(!message.trim() && !file) || isSubmitting}
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
      
      {/* Forward Message Modal */}
      <ForwardMessageModal 
        message={forwardMessage}
        isOpen={isForwardModalOpen}
        onClose={() => {
          setIsForwardModalOpen(false);
          setForwardMessage(null);
        }}
      />
    </div>
  );
};

export default GroupChatContainer; 