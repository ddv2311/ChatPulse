import { Phone, Video } from "lucide-react";
import { useCallStore } from "../store/useCallStore";

const GroupCallButton = ({ group, type }) => {
  // For now, we'll just show a notification that group calls are not yet implemented
  // This can be expanded later to support group calling functionality
  
  const handleGroupCall = () => {
    alert(`Group ${type === "audio" ? "voice" : "video"} calls will be implemented in a future update!`);
  };

  return (
    <button
      onClick={handleGroupCall}
      className="btn btn-sm btn-ghost btn-circle"
      title={`Group ${type === "audio" ? "Voice" : "Video"} Call`}
    >
      {type === "audio" ? (
        <Phone className="size-5" />
      ) : (
        <Video className="size-5" />
      )}
    </button>
  );
};

export default GroupCallButton; 