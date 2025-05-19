import { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { X, Search, Users, UserRound } from 'lucide-react';

const ForwardMessageModal = ({ message, isOpen, onClose }) => {
  const { users, getUsers, forwardMessage } = useChatStore();
  const { groups, getGroups, forwardMessageToGroup } = useGroupStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'
  
  useEffect(() => {
    if (isOpen) {
      getUsers();
      getGroups();
      setSelectedUsers([]);
      setSelectedGroups([]);
      setSearchTerm('');
      setActiveTab('users');
    }
  }, [isOpen, getUsers, getGroups]);
  
  if (!isOpen) return null;
  
  const filteredUsers = searchTerm.trim() === '' 
    ? users 
    : users.filter(user => user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const filteredGroups = searchTerm.trim() === ''
    ? groups
    : groups.filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const toggleUser = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };
  
  const toggleGroup = (group) => {
    setSelectedGroups(prev => {
      const isSelected = prev.some(g => g._id === group._id);
      if (isSelected) {
        return prev.filter(g => g._id !== group._id);
      } else {
        return [...prev, group];
      }
    });
  };
  
  const handleForward = async () => {
    if (activeTab === 'users' && selectedUsers.length === 0) return;
    if (activeTab === 'groups' && selectedGroups.length === 0) return;
    
    setIsForwarding(true);
    try {
      if (activeTab === 'users') {
        // Forward to users
        await forwardMessage(message, selectedUsers);
      } else {
        // Forward to groups
        for (const group of selectedGroups) {
          await forwardMessageToGroup(group._id, {
            text: message.text,
            fileUrl: message.fileUrl,
            fileType: message.fileType,
            fileName: message.fileName,
            originalSenderId: message.senderId._id
          });
        }
      }
      onClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
    } finally {
      setIsForwarding(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Forward Message</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-base-300 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 p-2">
          <a 
            className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UserRound className="size-4 mr-1" />
            Users
          </a>
          <a 
            className={`tab ${activeTab === 'groups' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <Users className="size-4 mr-1" />
            Groups
          </a>
        </div>
        
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-2 bg-base-200 rounded-lg pl-3 pr-2 py-2">
            <Search className="size-5 text-base-content/60" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'users' ? 'users' : 'groups'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent w-full outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'users' ? (
            // Users list
            filteredUsers.length > 0 ? (
              <div className="space-y-1">
                {filteredUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u._id === user._id);
                  
                  return (
                    <div 
                      key={user._id}
                      onClick={() => toggleUser(user)}
                      className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-base-200'
                      }`}
                    >
                      <div className="relative">
                        <img 
                          src={user.profilePicture || "/avatar.png"} 
                          alt={user.fullName}
                          className="size-10 rounded-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center">
                            <div className="size-5 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-content text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-base-content/60 p-4">
                <UserRound className="size-10 mb-2" />
                <p>No users found</p>
              </div>
            )
          ) : (
            // Groups list
            filteredGroups.length > 0 ? (
              <div className="space-y-1">
                {filteredGroups.map(group => {
                  const isSelected = selectedGroups.some(g => g._id === group._id);
                  
                  return (
                    <div 
                      key={group._id}
                      onClick={() => toggleGroup(group)}
                      className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-base-200'
                      }`}
                    >
                      <div className="relative">
                        {group.groupImage ? (
                          <img 
                            src={group.groupImage} 
                            alt={group.name}
                            className="size-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                            <span className="font-bold">
                              {group.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center">
                            <div className="size-5 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-content text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-base-content/60">
                          {group.members.length} members
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-base-content/60 p-4">
                <Users className="size-10 mb-2" />
                <p>No groups found</p>
              </div>
            )
          )}
        </div>
        
        <div className="p-4 border-t border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {activeTab === 'users'
                ? `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} selected`
                : `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''} selected`
              }
            </div>
            <button
              onClick={handleForward}
              disabled={(activeTab === 'users' && selectedUsers.length === 0) || 
                        (activeTab === 'groups' && selectedGroups.length === 0) || 
                        isForwarding}
              className={`btn btn-primary ${isForwarding ? 'loading' : ''}`}
            >
              {isForwarding ? 'Forwarding...' : 'Forward'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal; 