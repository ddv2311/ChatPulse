import { useState, useEffect, useRef } from "react";import { useGroupStore } from "../store/useGroupStore";import { useAuthStore } from "../store/useAuthStore";import { Send, Image as ImageIcon, Loader, Users, Info, X } from "lucide-react";import GroupMessage from "./GroupMessage";import GroupInfoModal from "./modals/GroupInfoModal";import GroupCallButton from "./GroupCallButton";

const GroupChatContainer = () => {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    selectedGroup,
    groupMessages,
    sendGroupMessage,
    isGroupMessagesLoading,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();

  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);

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
      <div className="p-4 border-b border-base-300 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`
            size-10 rounded-full flex items-center justify-center
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
            <h3 className="font-medium">{selectedGroup.name}</h3>
            <div className="text-xs text-zinc-500 flex items-center gap-1">
              <Users className="size-3" />
              <span>{selectedGroup.members.length} members</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Group call buttons */}
          <GroupCallButton group={selectedGroup} type="audio" />
          <GroupCallButton group={selectedGroup} type="video" />
          
          {/* Group info button */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="btn btn-sm btn-ghost btn-circle"
            title="Group Info"
          >
            <Info className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isGroupMessagesLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="size-10 animate-spin" />
          </div>
        ) : groupMessages.length > 0 ? (
          <div className="space-y-4">
            {groupMessages.map((msg) => (
              <GroupMessage
                key={msg._id}
                message={msg}
                isOwnMessage={msg.senderId._id === authUser._id}
              />
            ))}
            <div ref={messagesEndRef} />
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