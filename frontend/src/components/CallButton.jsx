import { Phone, Video } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import toast from "react-hot-toast";

const CallButton = ({ user, type }) => {
  const { initiateCall } = useCallStore();

  const handleCall = async () => {
    try {
      await initiateCall(user, type);
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error(error.message || `Could not start ${type} call. Please try again.`);
    }
  };

  return (
    <button
      onClick={handleCall}
      className="btn btn-sm btn-ghost btn-circle"
      title={`${type === "audio" ? "Voice" : "Video"} Call`}
    >
      {type === "audio" ? (
        <Phone className="size-5" />
      ) : (
        <Video className="size-5" />
      )}
    </button>
  );
};

export default CallButton; 