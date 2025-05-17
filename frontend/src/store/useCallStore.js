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
        audio: true,
        video: callType === "video"
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
        audio: true,
        video: callType === "video"
      };
      
      console.log("Getting user media with constraints:", constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
        .catch(err => {
          console.error("Error getting user media:", err);
          throw new Error(`Could not access ${callType === "video" ? "camera and microphone" : "microphone"}. Please check permissions.`);
        });
      
      console.log("Got media stream:", stream);
      
      // Dynamically import simple-peer
      console.log("Importing simple-peer...");
      const SimplePeer = (await import('simple-peer')).default;
      console.log("Simple-peer imported successfully");
      
      // Create new peer
      console.log("Creating peer connection...");
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream
      });
      
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
      
      // Handle the signal from the caller
      socket.once("callAccepted", (signal) => {
        console.log("Received call accepted signal");
        peer.signal(signal);
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
      
      // Create new peer
      console.log("Creating peer connection as initiator...");
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: localStream
      });
      
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
      
      // Signal the peer with the answer
      console.log("Signaling peer with remote answer");
      peer.signal(data.signal);
      
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
    
    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (myPeer) {
      myPeer.destroy();
    }
    
    // Reset call state
    set({
      isCallActive: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      callType: null,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      callAccepted: false,
      callEnded: true,
      myPeer: null
    });
  }
})); 