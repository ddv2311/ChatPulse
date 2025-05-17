import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit, Trash, X } from "lucide-react";

const MessageActions = ({ onEdit, onDelete, isVisible }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);
  
  if (!isVisible) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded-full hover:bg-base-300 transition-colors"
      >
        <MoreHorizontal className="size-4 text-zinc-500" />
      </button>
      
      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute top-0 right-full mr-2 bg-base-200 rounded-lg shadow-lg p-1 z-10"
        >
          <div className="flex flex-col gap-1 min-w-[120px]">
            <button
              onClick={() => {
                onEdit();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-base-300 rounded-md transition-colors text-left"
            >
              <Edit className="size-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-base-300 rounded-md transition-colors text-left text-error"
            >
              <Trash className="size-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageActions; 