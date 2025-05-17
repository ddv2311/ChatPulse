import { Phone, Video, Check, X, Volume2 } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

// Function to generate ringtone using Web Audio API
const createRingtone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // Create oscillator for the ringtone
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    
    // Create a repeating pattern that sounds like a phone ringtone
    const ringPattern = () => {
      const now = audioCtx.currentTime;
      
      // First ring
      oscillator.frequency.setValueAtTime(1200, now);
      gainNode.gain.setValueAtTime(0.2, now);
      
      oscillator.frequency.setValueAtTime(1000, now + 0.1);
      gainNode.gain.setValueAtTime(0, now + 0.3);
      
      // Pause
      gainNode.gain.setValueAtTime(0, now + 0.4);
      
      // Second ring
      gainNode.gain.setValueAtTime(0.2, now + 0.5);
      oscillator.frequency.setValueAtTime(1200, now + 0.5);
      
      oscillator.frequency.setValueAtTime(1000, now + 0.6);
      gainNode.gain.setValueAtTime(0, now + 0.8);
      
      // Long pause
      gainNode.gain.setValueAtTime(0, now + 1.5);
    };
    
    // Schedule the ringtone pattern
    ringPattern();
    
    // Repeat the pattern every 2 seconds
    const interval = setInterval(() => {
      ringPattern();
    }, 2000);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    return {
      start: () => {
        oscillator.start();
      },
      stop: () => {
        try {
          clearInterval(interval);
          oscillator.stop();
          audioCtx.close();
        } catch (err) {
          console.error("Error stopping ringtone:", err);
        }
      }
    };
  } catch (err) {
    console.error("Error creating ringtone:", err);
    return {
      start: () => {},
      stop: () => {}
    };
  }
};

const IncomingCallNotification = () => {
  const { isIncomingCall, callType, remoteUser, acceptCall, rejectCall } = useCallStore();
  const [isPulse, setIsPulse] = useState(true);
  const ringtoneRef = useRef(null);
  
  // Toggle pulse animation every 1 second
  useEffect(() => {
    if (isIncomingCall) {
      const interval = setInterval(() => {
        setIsPulse(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isIncomingCall]);
  
  useEffect(() => {
    // Play ringtone when there's an incoming call
    if (isIncomingCall) {
      try {
        // Try Web Audio API first
        const ringtone = createRingtone();
        ringtoneRef.current = ringtone;
        ringtone.start();
        
        // Show toast notification for incoming call
        toast.custom(
          (t) => (
            <div className="bg-primary text-primary-content px-4 py-2 rounded-md flex items-center gap-2">
              {callType === "audio" ? <Phone className="size-4" /> : <Video className="size-4" />}
              <span>Incoming call from {remoteUser?.fullName}</span>
            </div>
          ),
          { duration: 3000 }
        );
      } catch (err) {
        console.error("Error playing ringtone:", err);
        toast.error("Enable sound to hear incoming call ringtone");
      }
    }
    
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }
    };
  }, [isIncomingCall, callType, remoteUser]);
  
  const handleAcceptCall = () => {
    try {
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }
      
      acceptCall();
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to accept call. Please try again.");
    }
  };
  
  const handleRejectCall = () => {
    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current = null;
    }
    
    rejectCall();
  };
  
  if (!isIncomingCall) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className={`w-96 bg-base-100 rounded-lg shadow-2xl overflow-hidden ${isPulse ? 'animate-pulse' : ''}`}>
        <div className="p-4 bg-primary text-primary-content flex items-center justify-between">
          <div className="flex items-center gap-2">
            {callType === "audio" ? (
              <Phone className="size-5" />
            ) : (
              <Video className="size-5" />
            )}
            <span className="text-lg font-bold">Incoming {callType === "audio" ? "Voice" : "Video"} Call</span>
          </div>
          <Volume2 className={`size-5 ${isPulse ? 'animate-bounce' : ''}`} />
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div className="avatar">
            <div className={`size-24 rounded-full border-4 ${isPulse ? 'border-primary' : 'border-transparent'}`}>
              <img 
                src={remoteUser?.profilePicture || "/avatar.png"} 
                alt={remoteUser?.fullName} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h3 className="mt-4 text-xl font-bold">{remoteUser?.fullName}</h3>
          <p className="mt-1 text-base-content/70">is calling you...</p>
          
          <div className="mt-6 flex justify-center gap-8 w-full">
            <button 
              onClick={handleRejectCall}
              className="btn btn-lg btn-circle btn-error"
              aria-label="Reject call"
            >
              <X className="size-6" />
            </button>
            <button 
              onClick={handleAcceptCall}
              className="btn btn-lg btn-circle btn-success"
              aria-label="Accept call"
            >
              <Check className="size-6" />
            </button>
          </div>
          
          <div className="mt-4 text-sm text-center text-base-content/70">
            {callType === "audio" ? "Voice" : "Video"} call · Tap to {callType === "audio" ? "talk" : "see"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification; 