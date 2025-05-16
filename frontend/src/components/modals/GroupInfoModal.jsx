import { useState, useEffect } from "react";
import { X, Users, Pencil, Trash2, UserMinus, UserPlus, Loader } from "lucide-react";
import { useGroupStore } from "../../store/useGroupStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

const GroupInfoModal = ({ isOpen, onClose, group }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateGroup, deleteGroup, addGroupMembers, removeGroupMember } = useGroupStore();
  const { authUser } = useAuthStore();
  const { users, getUsers, isUsersLoading } = useChatStore();
  
  const isAdmin = group?.admin?._id === authUser?._id;
  
  // Reset form when group changes
  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
    }
  }, [group]);
  
  const handleUpdateGroup = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    await updateGroup(group._id, {
      name: name.trim(),
      description: description.trim()
    });
    setIsSubmitting(false);
    setIsEditing(false);
  };
  
  const handleDeleteGroup = async () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      setIsSubmitting(true);
      await deleteGroup(group._id);
      setIsSubmitting(false);
      onClose();
    }
  };
  
  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      await removeGroupMember(group._id, memberId);
    }
  };
  
  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;
    
    setIsSubmitting(true);
    await addGroupMembers(group._id, selectedMembers);
    setIsSubmitting(false);
    setIsAddMemberOpen(false);
    setSelectedMembers([]);
  };
  
  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };
  
  const openAddMemberPanel = () => {
    getUsers();
    setIsAddMemberOpen(true);
  };
  
  if (!isOpen || !group) return null;

  // Filter out users who are already members
  const nonMemberUsers = users.filter(
    user => !group.members.some(member => member._id === user._id)
  );
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-bold">Group Info</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Group Details */}
          <div className="mb-6">
            {isEditing ? (
              <>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Group Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea textarea-bordered w-full"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="btn btn-ghost btn-sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateGroup} 
                    className="btn btn-primary btn-sm"
                    disabled={!name.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-zinc-500 mt-1">{group.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="btn btn-ghost btn-sm btn-circle"
                      title="Edit group"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  Created by {group.admin.fullName}
                </div>
              </>
            )}
          </div>

          {/* Members List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium flex items-center gap-1">
                <Users className="size-4" />
                <span>Members ({group.members.length})</span>
              </h3>
              {isAdmin && !isAddMemberOpen && (
                <button 
                  onClick={openAddMemberPanel}
                  className="btn btn-ghost btn-sm"
                >
                  <UserPlus className="size-4 mr-1" />
                  Add
                </button>
              )}
            </div>

            {/* Add Member Panel */}
            {isAddMemberOpen && (
              <div className="mb-4 border border-base-300 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Add Members</h4>
                <div className="max-h-40 overflow-y-auto mb-3">
                  {isUsersLoading ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader className="size-6 animate-spin" />
                    </div>
                  ) : nonMemberUsers.length > 0 ? (
                    nonMemberUsers.map((user) => (
                      <div key={user._id} className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-md">
                        <input
                          type="checkbox"
                          id={`add-user-${user._id}`}
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => toggleMemberSelection(user._id)}
                          className="checkbox checkbox-sm"
                        />
                        <label htmlFor={`add-user-${user._id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                          <img
                            src={user.profilePicture || "/avatar.png"}
                            alt={user.fullName}
                            className="size-8 rounded-full object-cover"
                          />
                          <span>{user.fullName}</span>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-zinc-500 py-2">No users to add</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setIsAddMemberOpen(false);
                      setSelectedMembers([]);
                    }} 
                    className="btn btn-ghost btn-sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddMembers} 
                    className="btn btn-primary btn-sm"
                    disabled={selectedMembers.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="size-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Selected'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {group.members.map((member) => (
                <div 
                  key={member._id} 
                  className="flex items-center justify-between p-2 hover:bg-base-200 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={member.profilePicture || "/avatar.png"}
                      alt={member.fullName}
                      className="size-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">
                        {member.fullName}
                        {member._id === group.admin._id && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                        {member._id === authUser._id && (
                          <span className="ml-2 text-xs bg-base-300 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove member button (admin only, can't remove self if admin) */}
                  {isAdmin && member._id !== authUser._id && (
                    <button 
                      onClick={() => handleRemoveMember(member._id)}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                      title="Remove member"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delete Group Button (admin only) */}
          {isAdmin && (
            <div className="mt-8 pt-4 border-t border-base-300">
              <button 
                onClick={handleDeleteGroup}
                className="btn btn-error btn-sm w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4 mr-1" />
                    Delete Group
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal; 