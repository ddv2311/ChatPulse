import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

import Sidebar from "../components/Sidebar";
import GroupSidebar from "../components/GroupSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import { MessageSquare, Users } from "lucide-react";

const HomePage = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { selectedGroup, clearSelectedGroup } = useGroupStore();
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "groups"

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Clear selections when switching tabs
    if (tab === "direct") {
      clearSelectedGroup();
    } else {
      setSelectedUser(null);
    }
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden flex-col">
            {/* Tabs */}
            <div className="flex border-b border-base-300">
              <button
                onClick={() => handleTabChange("direct")}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors
                  ${activeTab === "direct" ? "border-b-2 border-primary text-primary" : "text-base-content/70 hover:bg-base-200"}`}
              >
                <MessageSquare className="size-4" />
                <span>Direct Messages</span>
              </button>
              <button
                onClick={() => handleTabChange("groups")}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors
                  ${activeTab === "groups" ? "border-b-2 border-primary text-primary" : "text-base-content/70 hover:bg-base-200"}`}
              >
                <Users className="size-4" />
                <span>Group Chats</span>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex flex-1 h-[calc(100%-3rem)] overflow-hidden">
              {activeTab === "direct" ? (
                <>
                  <Sidebar />
                  {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
                </>
              ) : (
                <>
                  <GroupSidebar />
                  {!selectedGroup ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                      <Users className="size-16 mb-2" />
                      <p className="text-lg font-medium">No group selected</p>
                      <p>Select a group from the sidebar or create a new one</p>
                    </div>
                  ) : (
                    <GroupChatContainer />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;