import { useState, useEffect } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useChatStore } from "../../store/useChatStore";
import { X, Loader } from "lucide-react";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createGroup, isCreatingGroup } = useGroupStore();
  const { users, getUsers, isUsersLoading } = useChatStore();

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setSelectedMembers([]);
      getUsers();
    }
  }, [isOpen, getUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedMembers.length === 0) return;

    setIsSubmitting(true);
    const groupData = {
      name: name.trim(),
      description: description.trim(),
      members: selectedMembers
    };

    const result = await createGroup(groupData);
    setIsSubmitting(false);
    
    if (result) {
      onClose();
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-bold">Create New Group</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto">
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Description (optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              className="textarea textarea-bordered w-full"
              rows={3}
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Select Members</span>
            </label>
            <div className="border border-base-300 rounded-lg p-2 max-h-40 overflow-y-auto">
              {isUsersLoading ? (
                <div className="flex justify-center items-center p-4">
                  <Loader className="size-6 animate-spin" />
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <div key={user._id} className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-md">
                    <input
                      type="checkbox"
                      id={`user-${user._id}`}
                      checked={selectedMembers.includes(user._id)}
                      onChange={() => toggleMemberSelection(user._id)}
                      className="checkbox checkbox-sm"
                    />
                    <label htmlFor={`user-${user._id}`} className="flex items-center gap-2 cursor-pointer flex-1">
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
                <p className="text-center text-zinc-500 py-2">No users found</p>
              )}
            </div>
            {selectedMembers.length > 0 && (
              <div className="text-sm text-zinc-500 mt-1">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </form>

        <div className="p-4 border-t border-base-300 flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-ghost"
            disabled={isSubmitting || isCreatingGroup}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="btn btn-primary"
            disabled={!name.trim() || selectedMembers.length === 0 || isSubmitting || isCreatingGroup}
          >
            {isSubmitting || isCreatingGroup ? (
              <>
                <Loader className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal; 