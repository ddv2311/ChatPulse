import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, ShieldOff } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { blockedUsers, getBlockedUsers, isUserBlocked } = useUserStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  useEffect(() => {
    getUsers();
    getBlockedUsers();
  }, [getUsers, getBlockedUsers]);

  // First filter based on online status
  let filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;
    
  // Then filter based on blocked status
  filteredUsers = showBlockedUsers 
    ? filteredUsers 
    : filteredUsers.filter((user) => !isUserBlocked(user._id));

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        
        {/* Filter controls */}
        <div className="mt-3 hidden lg:flex flex-col gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </label>
          
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showBlockedUsers}
              onChange={(e) => setShowBlockedUsers(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show blocked users</span>
            <span className="text-xs text-zinc-500">({blockedUsers.length} blocked)</span>
          </label>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const isBlocked = isUserBlocked(user._id);
          
          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                ${isBlocked ? "opacity-60" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePicture || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && !isBlocked && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
                {isBlocked && (
                  <span
                    className="absolute -top-1 -right-1 size-5 bg-error 
                    rounded-full ring-2 ring-zinc-900 flex items-center justify-center"
                  >
                    <ShieldOff className="size-3 text-white" />
                  </span>
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">
                  {user.fullName}
                  {isBlocked && (
                    <span className="ml-2 text-xs bg-error/10 text-error px-1.5 py-0.5 rounded">
                      Blocked
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400">
                  {isBlocked 
                    ? "Blocked" 
                    : onlineUsers.includes(user._id) 
                      ? "Online" 
                      : "Offline"}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            {showOnlineOnly 
              ? "No online users" 
              : showBlockedUsers 
                ? "No users to display" 
                : "No contacts found"}
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar; 