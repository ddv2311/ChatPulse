import { useEffect, useRef, useState } from "react";
import { Phone, Mic, MicOff, Video, VideoOff, X, Wifi, WifiOff, FlipVertical, Volume, Volume2 } from "lucide-react";
import { useCallStore } from "../store/useCallStore";

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
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState("good"); // good, fair, poor
  const [isCameraFront, setIsCameraFront] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const timerRef = useRef(null);
  const connectionCheckRef = useRef(null);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  
  // Drag functionality
  const onDragStart = (e) => {
    if (e.target.closest('.pip-handle')) {
      setIsDragging(true);
      
      // Handle both mouse and touch events
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      
      const initialX = clientX - position.x;
      const initialY = clientY - position.y;

      const onDragMove = (moveEvent) => {
        if (isDragging) {
          // Prevent default to avoid scrolling while dragging on mobile
          moveEvent.preventDefault();
          
          // Handle both mouse and touch events
          const moveClientX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
          const moveClientY = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;
          
          const newX = moveClientX - initialX;
          const newY = moveClientY - initialY;
          
          // Apply bounds if needed
          const parentRect = dragRef.current?.parentElement?.getBoundingClientRect();
          const elemRect = dragRef.current?.getBoundingClientRect();
          
          if (parentRect && elemRect) {
            const maxX = parentRect.width - elemRect.width;
            const maxY = parentRect.height - elemRect.height;
            
            setPosition({
              x: Math.min(Math.max(0, newX), maxX),
              y: Math.min(Math.max(0, newY), maxY)
            });
          } else {
            setPosition({ x: newX, y: newY });
          }
        }
      };

      const onDragEnd = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove, { passive: false });
        document.removeEventListener('touchend', onDragEnd);
      };

      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd);
    }
  };
  
  // Format call duration in MM:SS format
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start call timer when call is accepted
  useEffect(() => {
    if (callAccepted) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Check network connection quality
      connectionCheckRef.current = setInterval(() => {
        checkNetworkQuality();
      }, 5000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
        connectionCheckRef.current = null;
      }
    };
  }, [callAccepted]);
  
  // Check network quality based on RTCPeerConnection stats
  const checkNetworkQuality = async () => {
    const { myPeer } = useCallStore.getState();
    if (!myPeer || !callAccepted) return;
    
    try {
      // Make sure _pc exists before accessing it
      if (!myPeer._pc) {
        console.warn("RTCPeerConnection not accessible");
        return;
      }
      
      const stats = await myPeer._pc.getStats();
      let totalPacketsLost = 0;
      let totalPackets = 0;
      let rtt = 0;
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
            totalPacketsLost += report.packetsLost;
            totalPackets += report.packetsReceived + report.packetsLost;
          }
        }
        
        if (report.type === 'remote-inbound-rtp') {
          if (report.roundTripTime !== undefined) {
            rtt = report.roundTripTime;
          }
        }
      });
      
      // Calculate packet loss rate
      const packetLossRate = totalPackets > 0 ? (totalPacketsLost / totalPackets) : 0;
      
      // Determine network quality
      if (packetLossRate > 0.1 || rtt > 500) {
        setNetworkQuality("poor");
        adaptToNetworkQuality("poor");
      } else if (packetLossRate > 0.05 || rtt > 200) {
        setNetworkQuality("fair");
        adaptToNetworkQuality("fair");
      } else {
        setNetworkQuality("good");
        adaptToNetworkQuality("good");
      }
    } catch (error) {
      console.error("Error checking network quality:", error);
      // Fallback to a simple ping-based quality check
      simpleQualityCheck();
    }
  };
  
  // Simple quality check fallback if getStats() fails
  const simpleQualityCheck = () => {
    // Use navigator.connection if available
    if (navigator.connection) {
      const conn = navigator.connection;
      
      if (conn.effectiveType === '4g' || conn.effectiveType === '3g') {
        setNetworkQuality("good");
      } else if (conn.effectiveType === '2g') {
        setNetworkQuality("fair");
      } else if (conn.effectiveType === 'slow-2g') {
        setNetworkQuality("poor");
      }
      
      // Also listen for connection changes
      conn.addEventListener('change', simpleQualityCheck);
    }
  };
  
  // Adapt video quality based on network conditions
  const adaptToNetworkQuality = (quality) => {
    if (!localStream || callType !== "video") return;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;
    
    const videoTrack = videoTracks[0];
    const { myPeer } = useCallStore.getState();
    
    if (!myPeer || !myPeer._pc) return;
    
    const sender = myPeer._pc.getSenders()
      .find(s => s.track && s.track.kind === "video");
    
    if (!sender) return;
    
    try {
      const parameters = sender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      
      // Adapt based on quality
      switch (quality) {
        case "poor":
          parameters.encodings[0].maxBitrate = 100000; // 100 kbps
          parameters.encodings[0].scaleResolutionDownBy = 4.0; // 1/4 resolution
          break;
        case "fair":
          parameters.encodings[0].maxBitrate = 500000; // 500 kbps
          parameters.encodings[0].scaleResolutionDownBy = 2.0; // 1/2 resolution
          break;
        case "good":
          parameters.encodings[0].maxBitrate = 2500000; // 2.5 Mbps
          parameters.encodings[0].scaleResolutionDownBy = 1.0; // Full resolution
          break;
      }
      
      sender.setParameters(parameters).catch(err => {
        console.error("Error setting encoding parameters:", err);
      });
    } catch (error) {
      console.error("Error adapting to network quality:", error);
    }
  };
  
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      
      // Ensure audio is properly initialized
      if (callType === "audio") {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = true;
        });
      }
    }
    
    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [localStream, callType]);
  
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Ensure audio output is properly routed
      if (remoteVideoRef.current.setSinkId && typeof remoteVideoRef.current.setSinkId === 'function') {
        remoteVideoRef.current.setSinkId('default').catch(err => {
          console.warn('Failed to set audio output device:', err);
        });
      }
    }
    
    return () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [remoteStream]);
  
  // Toggle microphone mute/unmute
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video on/off
  const toggleVideo = () => {
    if (localStream && callType === "video") {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // Toggle speaker mode
  const toggleSpeaker = async () => {
    try {
      const audioEl = document.createElement('audio');
      if (!audioEl.setSinkId) {
        console.warn('Audio output device selection not supported');
        return;
      }
      
      // Get available audio output devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
      
      if (audioOutputDevices.length <= 1) {
        console.warn('No alternative audio output devices found');
        return;
      }
      
      // Find a speakerphone device or use the default device
      const newIsSpeaker = !isSpeaker;
      const targetDevice = newIsSpeaker ? 
        audioOutputDevices.find(d => d.label.toLowerCase().includes('speaker')) || audioOutputDevices[1] :
        audioOutputDevices.find(d => d.deviceId === 'default') || audioOutputDevices[0];
      
      // Apply the audio output to the remote audio/video element
      if (remoteVideoRef.current && remoteVideoRef.current.setSinkId) {
        await remoteVideoRef.current.setSinkId(targetDevice.deviceId);
        setIsSpeaker(newIsSpeaker);
        console.log(`Switched to ${newIsSpeaker ? 'speaker' : 'earpiece'}: ${targetDevice.label}`);
      }
    } catch (error) {
      console.error('Error toggling speaker:', error);
    }
  };
  
  // Switch between front and rear cameras (for mobile)
  const switchCamera = async () => {
    if (!localStream || callType !== "video") return;
    
    try {
      // Get current video track
      const videoTrack = localStream.getVideoTracks()[0];
      if (!videoTrack) return;
      
      // Get all video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      // If less than 2 cameras, can't switch
      if (videoDevices.length < 2) {
        console.warn('Not enough cameras to switch between');
        return;
      }
      
      // Get current camera settings
      const currentSettings = videoTrack.getSettings();
      const currentDeviceId = currentSettings.deviceId;
      
      // Find next camera (different from current)
      const nextCamera = videoDevices.find(d => d.deviceId !== currentDeviceId) || videoDevices[0];
      
      // Get new stream with new camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextCamera.deviceId } },
        audio: false
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track in all existing connections
      const { myPeer } = useCallStore.getState();
      if (myPeer && myPeer._pc) {
        const sender = myPeer._pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }
      
      // Replace track in local stream for local preview
      localStream.removeTrack(videoTrack);
      localStream.addTrack(newVideoTrack);
      
      // Stop old track to release camera
      videoTrack.stop();
      
      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      
      // Toggle camera state
      setIsCameraFront(!isCameraFront);
      
      console.log(`Switched to ${nextCamera.label}`);
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };
  
  // Touch event handlers for mobile
  const onTouchStart = (e) => {
    // Forward touch events to the drag handler
    onDragStart(e);
  };
  
  if (!isCallActive) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className={`${callType === "video" ? "w-full h-full" : "bg-base-100 rounded-lg shadow-xl w-full max-w-md overflow-hidden"}`}>
        {/* Call header - only show for audio calls or when video call not connected */}
        {(callType !== "video" || !callAccepted) && (
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
                <div className="flex items-center gap-1 text-xs text-base-content/70">
                  <span>
                    {callAccepted ? `Connected · ${formatDuration(callDuration)}` : 
                     isOutgoingCall ? "Calling..." : "Incoming call"}
                  </span>
                  
                  {/* Network quality indicator (only when connected) */}
                  {callAccepted && (
                    <div className="ml-2 flex items-center">
                      {networkQuality === "good" ? (
                        <Wifi className="size-3 text-success" />
                      ) : networkQuality === "fair" ? (
                        <Wifi className="size-3 text-warning" />
                      ) : (
                        <WifiOff className="size-3 text-error" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={endCall}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        
        {/* Call content */}
        <div className={`${callType === "video" ? "h-full" : "p-4"}`}>
          {callType === "video" ? (
            <div className="relative h-full bg-base-300">
              {/* Remote video (fullscreen) */}
              {callAccepted && remoteStream && (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* WhatsApp-like calling UI overlay over video */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="size-10 rounded-full">
                          <img 
                            src={remoteUser?.profilePicture || "/avatar.png"} 
                            alt={remoteUser?.fullName} 
                            className="border-2 border-white"
                          />
                        </div>
                      </div>
                      <div className="text-white">
                        <h3 className="font-medium">{remoteUser?.fullName}</h3>
                        <div className="flex items-center gap-1 text-xs text-white/80">
                          <span>{formatDuration(callDuration)}</span>
                          <div className="ml-2 flex items-center">
                            {networkQuality === "good" ? (
                              <Wifi className="size-3 text-success" />
                            ) : networkQuality === "fair" ? (
                              <Wifi className="size-3 text-warning" />
                            ) : (
                              <WifiOff className="size-3 text-error" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Local video (movable PiP) */}
              <div 
                ref={dragRef}
                className="absolute bottom-24 right-4 w-1/3 max-w-52 aspect-video bg-base-200 rounded-lg overflow-hidden shadow-lg"
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: 10
                }}
                onMouseDown={onDragStart}
                onTouchStart={onTouchStart}
              >
                <div className="pip-handle w-full h-full cursor-move">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Network quality overlay for poor connection */}
              {callAccepted && networkQuality === "poor" && (
                <div className="absolute top-20 left-4 bg-error text-error-content px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                  <WifiOff className="size-3" />
                  <span>Poor connection</span>
                </div>
              )}
              
              {/* Call status overlay if not connected */}
              {!callAccepted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
                  <div className="text-center text-white">
                    <div className="avatar">
                      <div className="size-32 rounded-full">
                        <img 
                          src={remoteUser?.profilePicture || "/avatar.png"} 
                          alt={remoteUser?.fullName} 
                        />
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-bold">{remoteUser?.fullName}</h3>
                    <p className="mt-3 text-white/80">
                      {isOutgoingCall ? "Calling..." : "Incoming video call"}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Video call controls - WhatsApp style (at bottom) */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
                <button 
                  onClick={toggleMute}
                  className={`btn btn-circle ${isMuted ? 'bg-error text-white' : 'bg-black/60 hover:bg-black/80 text-white'}`}
                >
                  {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>
                
                <button 
                  onClick={toggleVideo}
                  className={`btn btn-circle ${isVideoOff ? 'bg-error text-white' : 'bg-black/60 hover:bg-black/80 text-white'}`}
                >
                  {isVideoOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
                </button>
                
                <button 
                  onClick={switchCamera}
                  className="btn btn-circle bg-black/60 hover:bg-black/80 text-white"
                >
                  <FlipVertical className="size-5" />
                </button>
                
                <button 
                  onClick={endCall}
                  className="btn btn-circle bg-error text-white"
                >
                  <Phone className="size-5 rotate-135" />
                </button>
              </div>
            </div>
          ) : (
            /* WhatsApp-style Audio call UI */
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="avatar">
                <div className={`size-32 rounded-full ${callAccepted ? 'border-4 border-primary animate-pulse' : ''}`}>
                  <img 
                    src={remoteUser?.profilePicture || "/avatar.png"} 
                    alt={remoteUser?.fullName} 
                  />
                </div>
              </div>
              <h3 className="mt-5 text-xl font-bold">{remoteUser?.fullName}</h3>
              <p className="mt-2 text-base-content/70">
                {callAccepted ? `Connected · ${formatDuration(callDuration)}` : 
                 isOutgoingCall ? "Calling..." : "Incoming voice call"}
              </p>
              
              {/* Network quality indicator for audio calls */}
              {callAccepted && (
                <div className="mt-3 flex items-center gap-1">
                  {networkQuality === "good" ? (
                    <><Wifi className="size-4 text-success" /> <span className="text-sm">Good connection</span></>
                  ) : networkQuality === "fair" ? (
                    <><Wifi className="size-4 text-warning" /> <span className="text-sm">Fair connection</span></>
                  ) : (
                    <><WifiOff className="size-4 text-error" /> <span className="text-sm">Poor connection</span></>
                  )}
                </div>
              )}
              
              {/* Audio element for remote stream */}
              {callAccepted && remoteStream && (
                <audio ref={remoteVideoRef} autoPlay controls={false} />
              )}
              
              {/* Audio call status messages */}
              {!callAccepted && (
                <div className="mt-6 bg-base-200 px-4 py-2 rounded-full text-sm animate-pulse">
                  {isOutgoingCall ? "Ringing..." : "Incoming call..."}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Audio call controls - only show for audio calls or when video call not connected */}
        {(callType === "audio" && callAccepted) && (
          <div className="p-6 border-t border-base-300">
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={toggleMute}
                className="flex flex-col items-center gap-2"
              >
                <div className={`btn btn-circle ${isMuted ? 'btn-error' : 'btn-ghost'}`}>
                  {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </div>
                <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              
              <button 
                onClick={toggleSpeaker}
                className="flex flex-col items-center gap-2"
              >
                <div className={`btn btn-circle ${isSpeaker ? 'btn-primary' : 'btn-ghost'}`}>
                  {isSpeaker ? <Volume2 className="size-5" /> : <Volume className="size-5" />}
                </div>
                <span className="text-xs">{isSpeaker ? 'Speaker' : 'Earpiece'}</span>
              </button>
              
              <button 
                onClick={endCall}
                className="flex flex-col items-center gap-2"
              >
                <div className="btn btn-circle btn-error">
                  <Phone className="size-5 rotate-135" />
                </div>
                <span className="text-xs">End</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallUI; 