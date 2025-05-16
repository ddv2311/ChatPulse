import { useEffect, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { UsersRound, Plus } from "lucide-react";
import CreateGroupModal from "./modals/CreateGroupModal";

const GroupSidebar = () => {
  const { 
    getGroups, 
    groups, 
    selectedGroup, 
    setSelectedGroup, 
    isGroupsLoading 
  } = useGroupStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    getGroups();
  }, [getGroups]);

  if (isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="size-6" />
            <span className="font-medium hidden lg:block">Groups</span>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-sm btn-circle btn-ghost"
            title="Create new group"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {groups.length > 0 ? (
          groups.map((group) => (
            <button
              key={group._id}
              onClick={() => setSelectedGroup(group)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <div className={`
                  size-12 rounded-full flex items-center justify-center 
                  ${group.groupImage ? "" : "bg-primary text-primary-content"}
                `}>
                  {group.groupImage ? (
                    <img
                      src={group.groupImage}
                      alt={group.name}
                      className="size-12 object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-bold">
                      {group.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Group info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{group.name}</div>
                <div className="text-sm text-zinc-400">
                  {group.members.length} members
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center text-zinc-500 py-4">
            No groups yet. Create one!
          </div>
        )}
      </div>
      
      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </aside>
  );
};

export default GroupSidebar; 