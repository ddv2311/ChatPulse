import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useCallStore = create((set, get) => ({
  // Call state
  isCallActive: false,
  isIncomingCall: false,
  isOutgoingCall: false,
  callType: null, // "audio" or "video"
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  callAccepted: false,
  callEnded: false,
  
  // WebRTC state
  myPeer: null,
  
  // Call methods
  initiateCall: async (user, callType) => {
    try {
      const { socket } = useAuthStore.getState();
      const { authUser } = useAuthStore.getState();
      
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected");
      }
      
      if (!user || !user._id) {
        throw new Error("Invalid user information");
      }
      
      console.log(`Initiating ${callType} call to user:`, user.fullName);
      
      // Get media stream based on call type
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === "video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };
      
      console.log("Requesting media access with constraints:", constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
        .catch(err => {
          console.error("Error getting user media:", err);
          throw new Error(`Could not access ${callType === "video" ? "camera and microphone" : "microphone"}. Please check permissions.`);
        });
      
      console.log("Media access granted:", stream);
      
      set({
        isCallActive: true,
        isOutgoingCall: true,
        callType,
        remoteUser: user,
        localStream: stream,
        callAccepted: false,
        callEnded: false
      });
      
      // Emit call request to the server
      console.log("Emitting call request to server");
      socket.emit("callUser", {
        userToCall: user._id,
        from: authUser._id,
        name: authUser.fullName,
        callType
      });
      
      console.log("Call request sent");
    } catch (error) {
      console.error("Error initiating call:", error);
      get().endCall();
      throw error; // Re-throw to handle in UI
    }
  },
  
  // Handle incoming call
  handleIncomingCall: (data) => {
    set({
      isCallActive: true,
      isIncomingCall: true,
      callType: data.callType,
      remoteUser: data.from,
      callAccepted: false,
      callEnded: false
    });
  },
  
  // Accept incoming call
  acceptCall: async () => {
    try {
      const { socket } = useAuthStore.getState();
      const { authUser } = useAuthStore.getState();
      const { remoteUser, callType } = get();
      
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected");
      }
      
      if (!remoteUser) {
        throw new Error("No remote user information");
      }
      
      console.log("Accepting call from:", remoteUser);
      
      // Get media stream based on call type
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === "video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };
      
      console.log("Getting user media with constraints:", constraints);
      
      // First, ensure no active tracks are running by stopping them
      const { localStream } = get();
      if (localStream) {
        try {
          const tracks = localStream.getTracks();
          console.log(`Stopping ${tracks.length} existing tracks before requesting new ones`);
          tracks.forEach(track => {
            try {
              track.stop();
              console.log(`Stopped existing ${track.kind} track`);
            } catch (err) {
              console.warn(`Error stopping ${track.kind} track:`, err);
            }
          });
          
          // Set localStream to null to prevent any references to the old stream
          set({ localStream: null });
          
          // Small delay to ensure tracks are fully released
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.warn("Error stopping existing tracks:", err);
        }
      }
      
      // Try to get media with better error handling
      let stream;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Media access attempt ${retryCount + 1}/${maxRetries + 1}`);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log("Successfully got media stream:", stream);
          break; // Exit the loop if successful
        } catch (err) {
          console.error(`Media access attempt ${retryCount + 1} failed:`, err);
          
          if (retryCount < maxRetries) {
            // Wait longer between each retry
            const delay = 500 * (retryCount + 1);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
          } else {
            // All retries failed
            console.error("All media access attempts failed");
            throw new Error(`Could not access ${callType === "video" ? "camera and microphone" : "microphone"}. Please check permissions.`);
          }
        }
      }
      
      console.log("Got media stream with tracks:", stream.getTracks().map(t => t.kind).join(', '));
      
      // Dynamically import simple-peer
      console.log("Importing simple-peer...");
      const SimplePeer = (await import('simple-peer')).default;
      console.log("Simple-peer imported successfully");
      
      // Create new peer with ICE servers for NAT traversal
      console.log("Creating peer connection...");
      const peer = new SimplePeer({
        initiator: false,
        trickle: true, // Enable trickle ICE for better connection establishment
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
          ]
        }
      });
      
      // Store direct access to internal RTCPeerConnection for stats
      if (peer._pc) {
        // Simple-peer exposes the RTCPeerConnection as _pc
        console.log("Successfully accessed internal RTCPeerConnection");
      } else {
        console.warn("Could not access internal RTCPeerConnection");
      }
      
      // Handle peer events
      peer.on("signal", (data) => {
        console.log("Got signal data to send:", data);
        socket.emit("answerCall", {
          signal: data,
          to: remoteUser._id,
          from: authUser._id
        });
      });
      
      peer.on("stream", (remoteStream) => {
        console.log("Received remote stream");
        set({ remoteStream });
      });
      
      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        get().endCall();
      });
      
      peer.on("connect", () => {
        console.log("Peer connection established!");
      });
      
      // Handle connection state changes for diagnostics
      if (peer._pc) {
        peer._pc.onconnectionstatechange = (event) => {
          console.log("Connection state change:", peer._pc.connectionState);
        };
        
        peer._pc.oniceconnectionstatechange = (event) => {
          console.log("ICE connection state change:", peer._pc.iceConnectionState);
        };
      }
      
      // Listen for ICE candidates from the caller
      socket.on("receiveSignal", (data) => {
        console.log("Received signal data:", data);
        if (data.signal && peer) {
          peer.signal(data.signal);
        }
      });
      
      set({
        myPeer: peer,
        localStream: stream,
        callAccepted: true,
        isIncomingCall: false
      });
      
      console.log("Call accepted successfully");
    } catch (error) {
      console.error("Error accepting call:", error);
      get().endCall();
      throw error; // Re-throw to handle in UI
    }
  },
  
  // Handle call accepted by remote user
  handleCallAccepted: async (data) => {
    try {
      const { localStream } = get();
      const { socket } = useAuthStore.getState();
      
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected");
      }
      
      if (!localStream) {
        throw new Error("No local stream available");
      }
      
      if (!data || !data.signal) {
        throw new Error("Invalid signal data received");
      }
      
      console.log("Call accepted by remote user:", data.from);
      
      // Dynamically import simple-peer
      console.log("Importing simple-peer for accepted call...");
      const SimplePeer = (await import('simple-peer')).default;
      console.log("Simple-peer imported successfully");
      
      // Create new peer with ICE servers for NAT traversal
      console.log("Creating peer connection as initiator...");
      const peer = new SimplePeer({
        initiator: true,
        trickle: true, // Enable trickle ICE for better connections
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
          ]
        }
      });
      
      // Handle connection state changes for diagnostics
      if (peer._pc) {
        peer._pc.onconnectionstatechange = (event) => {
          console.log("Connection state change:", peer._pc.connectionState);
        };
        
        peer._pc.oniceconnectionstatechange = (event) => {
          console.log("ICE connection state change:", peer._pc.iceConnectionState);
        };
      }
      
      // Handle peer events
      peer.on("signal", (signal) => {
        console.log("Sending signal to remote peer");
        socket.emit("callSignal", {
          signal,
          to: data.from
        });
      });
      
      peer.on("stream", (remoteStream) => {
        console.log("Received remote stream from accepted call");
        set({ remoteStream });
      });
      
      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        get().endCall();
      });
      
      peer.on("connect", () => {
        console.log("Peer connection established as initiator!");
      });
      
      // Signal the peer with the answer received from callee
      console.log("Signaling peer with remote answer");
      peer.signal(data.signal);
      
      // Listen for additional ICE candidates
      socket.on("receiveSignal", (data) => {
        console.log("Received additional signal data:", data);
        if (data.signal && peer) {
          peer.signal(data.signal);
        }
      });
      
      set({
        myPeer: peer,
        callAccepted: true,
        isOutgoingCall: false
      });
      
      console.log("Call connection established");
    } catch (error) {
      console.error("Error handling accepted call:", error);
      get().endCall();
    }
  },
  
  // Handle received WebRTC signal (like ICE candidates)
  handleReceiveSignal: (data) => {
    const { myPeer } = get();
    if (myPeer && data.signal) {
      console.log("Received signal data, passing to peer:", data.signal);
      myPeer.signal(data.signal);
    } else {
      console.warn("Received signal but no active peer connection found");
    }
  },
  
  // Reject incoming call
  rejectCall: () => {
    const { socket } = useAuthStore.getState();
    const { authUser } = useAuthStore.getState();
    const { remoteUser } = get();
    
    socket.emit("rejectCall", {
      from: authUser._id,
      to: remoteUser._id
    });
    
    get().endCall();
  },
  
  // End active call
  endCall: () => {
    const { socket } = useAuthStore.getState();
    const { authUser } = useAuthStore.getState();
    const { remoteUser, localStream, myPeer } = get();
    
    // Notify other user that call has ended
    if (remoteUser && socket?.connected) {
      socket.emit("endCall", {
        from: authUser._id,
        to: remoteUser._id
      });
    }
    
    // Close peer connection first to stop all RTP senders
    if (myPeer) {
      try {
        myPeer.destroy();
      } catch (err) {
        console.warn("Error destroying peer:", err);
      }
    }
    
    // Stop local media tracks
    if (localStream) {
      try {
        const tracks = localStream.getTracks();
        console.log(`Stopping ${tracks.length} local tracks`);
        
        // Stop each track individually and log any errors
        tracks.forEach(track => {
          try {
            track.stop();
            console.log(`Stopped ${track.kind} track`);
          } catch (err) {
            console.warn(`Error stopping ${track.kind} track:`, err);
          }
        });
      } catch (err) {
        console.warn("Error stopping tracks:", err);
      }
    }
    
    // Make sure to reset localStream reference
    set({ localStream: null });
    
    // Clean up socket listeners to prevent memory leaks
    if (socket) {
      socket.off("receiveSignal");
      socket.off("callAccepted");
    }
    
    // Reset call state
    set({
      isCallActive: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      callType: null,
      remoteUser: null,
      remoteStream: null,
      callAccepted: false,
      callEnded: true,
      myPeer: null
    });
  }
})); 