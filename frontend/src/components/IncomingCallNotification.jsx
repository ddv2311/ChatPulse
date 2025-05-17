import { Phone, Video, Check, X, Volume2 } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

// Function to generate ringtone using Web Audio API
const createRingtone = (hasUserInteracted) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // AudioContext needs user interaction to start in modern browsers
    if (audioCtx.state === 'suspended' && !hasUserInteracted) {
      console.log('AudioContext suspended, waiting for user interaction');
      
      // Return a non-functional ringtone until we get user interaction
      return {
        start: () => {
          console.log('Ringtone waiting for user interaction');
        },
        stop: () => {}
      };
    }
    
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
    
    let hasStarted = false;
    
    return {
      start: () => {
        try {
          if (audioCtx.state === 'suspended') {
            if (hasUserInteracted) {
              audioCtx.resume().then(() => {
                oscillator.start();
                hasStarted = true;
              }).catch(err => {
                console.warn('Failed to resume AudioContext:', err);
              });
            }
          } else {
            oscillator.start();
            hasStarted = true;
          }
        } catch (err) {
          console.warn('Error starting ringtone:', err);
        }
      },
      stop: () => {
        try {
          clearInterval(interval);
          if (hasStarted) {
            oscillator.stop();
          }
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

// Create vibration pattern for mobile devices
const vibrateDevice = (hasInteracted) => {
  if (!navigator.vibrate) return null;
  
  // Create WhatsApp-like vibration pattern (short, pause, long)
  const pattern = [300, 100, 500];
  
  // Flag to track if vibration has been attempted
  let hasTriedVibrate = false;
  
  // Only start vibration after user has interacted with the page
  const tryVibrate = () => {
    try {
      // Only vibrate if user has interacted with the page
      if (hasInteracted && !hasTriedVibrate) {
        navigator.vibrate(pattern);
      }
    } catch (err) {
      // If vibration fails, log once and don't try again
      if (!hasTriedVibrate) {
        console.warn('Vibration failed:', err);
        hasTriedVibrate = true;
      }
    }
  };
  
  const intervalId = setInterval(tryVibrate, 2000);
  
  return {
    stop: () => {
      clearInterval(intervalId);
      try {
        if (hasInteracted) {
          navigator.vibrate(0); // Stop any ongoing vibration
        }
      } catch (err) {
        // Ignore errors when stopping vibration
      }
    }
  };
};

const IncomingCallNotification = () => {
  const { isIncomingCall, callType, remoteUser, acceptCall, rejectCall } = useCallStore();
  const [isPulse, setIsPulse] = useState(true);
  const [ringCount, setRingCount] = useState(0);
  const ringtoneRef = useRef(null);
  const vibrationRef = useRef(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Detect user interaction to enable vibration
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      
      // After capturing interaction, we can remove listeners
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
    
    // Add event listeners to detect user interaction
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);
  
  // Toggle pulse animation every 1 second
  useEffect(() => {
    if (isIncomingCall) {
      const interval = setInterval(() => {
        setIsPulse(prev => !prev);
      }, 1000);
      
      // Count rings for auto-reject after 30 seconds
      const ringInterval = setInterval(() => {
        setRingCount(prev => {
          if (prev >= 14) { // Auto-reject after ~30 seconds
            rejectCall();
            return 0;
          }
          return prev + 1;
        });
      }, 2000);
      
      return () => {
        clearInterval(interval);
        clearInterval(ringInterval);
      };
    }
  }, [isIncomingCall, rejectCall]);
  
  useEffect(() => {
    // Play ringtone and vibrate when there's an incoming call
    if (isIncomingCall) {
      try {
        // Try Web Audio API first
        const ringtone = createRingtone(hasUserInteracted);
        ringtoneRef.current = ringtone;
        ringtone.start();
        
        // Start vibration for mobile devices - only if user has interacted
        if (hasUserInteracted) {
          vibrationRef.current = vibrateDevice(true);
        }
        
        // Show toast notification for incoming call
        toast.custom(
          (t) => (
            <div className="bg-primary text-primary-content px-4 py-2 rounded-md flex items-center gap-2 shadow-lg">
              <div className={`${isPulse ? 'animate-ping' : ''} size-3 rounded-full bg-success absolute opacity-75`}></div>
              <div className="size-3 rounded-full bg-success relative"></div>
              {callType === "audio" ? <Phone className="size-4 ml-2" /> : <Video className="size-4 ml-2" />}
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
      if (vibrationRef.current) {
        vibrationRef.current.stop();
        vibrationRef.current = null;
      }
    };
  }, [isIncomingCall, callType, remoteUser, isPulse, hasUserInteracted]);
  
  // Handle hasUserInteracted changes to start vibration when appropriate
  useEffect(() => {
    // If user interacted and there's an incoming call but no vibration yet
    if (hasUserInteracted && isIncomingCall && !vibrationRef.current) {
      vibrationRef.current = vibrateDevice(true);
    }
  }, [hasUserInteracted, isIncomingCall]);
  
  // Update ringtone when user interaction state changes
  useEffect(() => {
    if (isIncomingCall && hasUserInteracted && ringtoneRef.current) {
      // If we have a non-functional ringtone (waiting for user interaction),
      // recreate it now that we have user interaction
      const newRingtone = createRingtone(true);
      
      // Stop the old ringtone if it exists
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
      }
      
      // Start the new ringtone
      ringtoneRef.current = newRingtone;
      newRingtone.start();
    }
  }, [hasUserInteracted, isIncomingCall]);
  
  const handleAcceptCall = async () => {
    try {
      // Set flag to indicate user interaction has occurred
      setHasUserInteracted(true);
      
      // Stop ringtone and vibration
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }
      if (vibrationRef.current) {
        vibrationRef.current.stop();
        vibrationRef.current = null;
      }
      
      // For video calls, ensure permissions are granted by requesting them first
      // This ensures the permission request happens during user interaction
      if (callType === "video") {
        try {
          // Just to get temporary access during the user interaction
          const tempStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          // Stop tracks immediately - we just needed the permissions
          tempStream.getTracks().forEach(track => track.stop());
          
          // Small delay to ensure tracks are fully released
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          // Log but continue - the acceptCall function will handle errors
          console.warn("Could not get preliminary camera access:", err);
        }
      } else if (callType === "audio") {
        try {
          // Get audio-only permission
          const tempStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          
          // Stop audio track
          tempStream.getTracks().forEach(track => track.stop());
          
          // Small delay to ensure tracks are fully released
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.warn("Could not get preliminary microphone access:", err);
        }
      }
      
      // Now accept the call - permissions should be granted
      acceptCall();
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to accept call. Please try again.");
    }
  };
  
  const handleRejectCall = () => {
    // Stop ringtone and vibration
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current = null;
    }
    if (vibrationRef.current) {
      vibrationRef.current.stop();
      vibrationRef.current = null;
    }
    
    // Set flag to indicate user interaction has occurred
    setHasUserInteracted(true);
    
    rejectCall();
  };
  
  if (!isIncomingCall) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className={`w-96 bg-base-100 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isPulse ? 'scale-100' : 'scale-95'}`}>
        <div className="p-4 bg-primary text-primary-content flex items-center justify-between">
          <div className="flex items-center gap-2">
            {callType === "audio" ? (
              <Phone className="size-5" />
            ) : (
              <Video className="size-5" />
            )}
            <span className="text-lg font-bold">Incoming {callType === "audio" ? "Voice" : "Video"} Call</span>
          </div>
          
          {/* Animated sound waves */}
          <div className="flex items-center gap-1">
            <div className={`h-3 w-1 bg-primary-content rounded ${isPulse ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }}></div>
            <div className={`h-4 w-1 bg-primary-content rounded ${isPulse ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.2s' }}></div>
            <div className={`h-5 w-1 bg-primary-content rounded ${isPulse ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.3s' }}></div>
            <div className={`h-4 w-1 bg-primary-content rounded ${isPulse ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.4s' }}></div>
            <div className={`h-3 w-1 bg-primary-content rounded ${isPulse ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>
        
        <div className="p-8 flex flex-col items-center">
          <div className="relative">
            {/* Ripple effect around avatar */}
            <div className={`absolute inset-0 rounded-full border-4 border-primary ${isPulse ? 'animate-ping opacity-75' : 'opacity-0'}`}></div>
            <div className="avatar">
              <div className="size-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img 
                  src={remoteUser?.profilePicture || "/avatar.png"} 
                  alt={remoteUser?.fullName} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          <h3 className="mt-6 text-2xl font-bold">{remoteUser?.fullName}</h3>
          <p className="mt-2 text-base-content/70 text-lg">
            is calling you...
          </p>
          
          <div className="mt-10 flex justify-between w-full px-6">
            {/* Two-row layout for accept/reject buttons */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleRejectCall}
                className="btn btn-lg btn-circle btn-error animate-pulse"
                aria-label="Reject call"
              >
                <X className="size-8" />
              </button>
              <span className="mt-3 font-medium text-base-content/70">Decline</span>
            </div>
            
            <div className="flex flex-col items-center">
              <button 
                onClick={handleAcceptCall}
                className="btn btn-lg btn-circle btn-success animate-pulse"
                aria-label="Accept call"
              >
                <Check className="size-8" />
              </button>
              <span className="mt-3 font-medium text-base-content/70">Answer</span>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-center text-base-content/70">
            {callType === "audio" ? "Voice" : "Video"} call · Swipe up to message
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification; 