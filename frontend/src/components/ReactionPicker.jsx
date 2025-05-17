import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

const ReactionPicker = ({ onSelectEmoji, isOpen, setIsOpen }) => {
  const pickerRef = useRef(null);
  
  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-base-300 transition-colors"
      >
        <Smile className="size-4 text-zinc-500" />
      </button>
      
      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute bottom-full mb-2 bg-base-200 rounded-lg shadow-lg p-2 z-10"
        >
          <div className="flex gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelectEmoji(emoji);
                  setIsOpen(false);
                }}
                className="text-lg hover:bg-base-300 p-1 rounded-md transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionPicker; 