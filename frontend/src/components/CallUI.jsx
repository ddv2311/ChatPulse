import { useEffect, useRef } from "react";
import { Phone, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useState } from "react";

const CallUI = () => {
  const {
    isCallActive,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    callAccepted,
    endCall,
    isOutgoingCall,
    isIncomingCall
  } = useCallStore();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const toggleVideo = () => {
    if (localStream && callType === "video") {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  if (!isCallActive) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
        {/* Call header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full">
                <img 
                  src={remoteUser?.profilePicture || "/avatar.png"} 
                  alt={remoteUser?.fullName} 
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium">{remoteUser?.fullName}</h3>
              <p className="text-xs text-base-content/70">
                {callAccepted ? "Connected" : isOutgoingCall ? "Calling..." : "Incoming call"}
              </p>
            </div>
          </div>
          <button 
            onClick={endCall}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X className="size-5" />
          </button>
        </div>
        
        {/* Call content */}
        <div className="p-4">
          {callType === "video" ? (
            <div className="relative aspect-video bg-base-300 rounded-lg overflow-hidden">
              {/* Remote video (large) */}
              {callAccepted && remoteStream && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Local video (small overlay) */}
              <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-base-200 rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Call status overlay if not connected */}
              {!callAccepted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-center text-white">
                    <div className="avatar">
                      <div className="size-24 rounded-full">
                        <img 
                          src={remoteUser?.profilePicture || "/avatar.png"} 
                          alt={remoteUser?.fullName} 
                        />
                      </div>
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{remoteUser?.fullName}</h3>
                    <p className="mt-2">
                      {isOutgoingCall ? "Calling..." : "Incoming video call"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Audio call UI */
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="avatar">
                <div className="size-32 rounded-full">
                  <img 
                    src={remoteUser?.profilePicture || "/avatar.png"} 
                    alt={remoteUser?.fullName} 
                  />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-bold">{remoteUser?.fullName}</h3>
              <p className="mt-2 text-base-content/70">
                {callAccepted ? "Connected" : isOutgoingCall ? "Calling..." : "Incoming voice call"}
              </p>
              
              {/* Audio element for remote stream */}
              {callAccepted && remoteStream && (
                <audio ref={remoteVideoRef} autoPlay />
              )}
            </div>
          )}
        </div>
        
        {/* Call controls */}
        <div className="p-4 border-t border-base-300 flex justify-center gap-4">
          {/* Mute button */}
          <button 
            onClick={toggleMute}
            className={`btn btn-circle ${isMuted ? 'btn-error' : 'btn-ghost'}`}
          >
            {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
          
          {/* End call button */}
          <button 
            onClick={endCall}
            className="btn btn-circle btn-error"
          >
            <Phone className="size-5 rotate-135" />
          </button>
          
          {/* Video toggle (only for video calls) */}
          {callType === "video" && (
            <button 
              onClick={toggleVideo}
              className={`btn btn-circle ${isVideoOff ? 'btn-error' : 'btn-ghost'}`}
            >
              {isVideoOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallUI; 