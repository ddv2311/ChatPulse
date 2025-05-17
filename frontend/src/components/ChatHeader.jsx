import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import CallButton from "./CallButton";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  
  const isUserOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePicture || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {isUserOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
    </div>
  );
};
export default ChatHeader;