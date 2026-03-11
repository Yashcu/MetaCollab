import { create } from "zustand";
import Peer from "simple-peer";
import { toast } from "sonner";

// All possible states a call can be in
export type CallStatus =
  | "idle"           // no call happening
  | "getting-media"  // asking user for camera/mic permission
  | "ready"          // media acquired, ready to call
  | "ringing-outgoing" // we called someone, waiting for them to answer
  | "ringing-incoming" // someone is calling us
  | "active"         // call is connected and running
  | "failed";        // something went wrong

export interface CallInfo {
  from: { id: string; name: string };
  signal: Peer.SignalData;
}

interface CallState {
  status: CallStatus;
  peer: Peer.Instance | null;
  myStream: MediaStream | null;
  peerStream: MediaStream | null;
  incomingCall: CallInfo | null;
  error: string | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;

  setStatus: (status: CallStatus) => void;
  setIncomingCall: (callInfo: CallInfo) => void;
  setPeer: (peer: Peer.Instance | null) => void;
  setPeerStream: (stream: MediaStream | null) => void;

  startMedia: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  resetCallState: () => void;
  reset: () => void;
}

// Pulled out so resetCallState can spread it cleanly
const initialState = {
  status: "idle" as CallStatus,
  peer: null,
  myStream: null,
  peerStream: null,
  incomingCall: null,
  error: null,
  isMicEnabled: true,
  isVideoEnabled: true,
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setIncomingCall: (callInfo) => set({ incomingCall: callInfo }),
  setPeer: (peer) => set({ peer }),
  setPeerStream: (stream) => set({ peerStream: stream }),

  startMedia: async () => {
    if (get().myStream) return;

    set({ status: "getting-media", error: null });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      set({ myStream: stream, status: "ready" });
    } catch (error) {
      console.error("[callStore] Failed to get media stream:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Permission denied";

      toast.error("Camera/mic access denied", {
        description: "Please allow camera and microphone access to make calls.",
      });

      set({ status: "failed", error: errorMessage });
    }
  },

  toggleMic: () => {
    const { myStream, isMicEnabled } = get();
    myStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    set({ isMicEnabled: !isMicEnabled });
  },

  // Toggle the camera on or off without stopping the stream
  toggleCamera: () => {
    const { myStream, isVideoEnabled } = get();
    myStream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    set({ isVideoEnabled: !isVideoEnabled });
  },

  resetCallState: () => {
    const { peer, myStream } = get();
    peer?.destroy();
    myStream?.getTracks().forEach((track) => track.stop());
    set(initialState);
  },

  reset: () => get().resetCallState(),
}));