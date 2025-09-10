import { create } from "zustand";
import Peer from "simple-peer";
import { useSocketStore } from "./socketStore";
import { useAuthStore } from "./authStore";
import { toast } from "@/components/ui/use-toast";

type CallStatus =
  | "idle"
  | "getting-media"
  | "ringing-outgoing"
  | "ringing-incoming"
  | "active"
  | "failed";

interface CallInfo {
  from: { id: string; name: string };
  signal: Peer.SignalData;
}

interface CallState {

  status: CallStatus;
  peer: Peer.Instance | null;
  myStream: MediaStream | null;
  peerStream: MediaStream | null;
  incomingCall: CallInfo | null;

  startMedia: () => Promise<void>;
  placeCall: (peerId: string, peerName: string) => void;
  answerCall: () => void;
  endCall: (shouldEmit?: boolean) => void;
  toggleMic: () => void;
  init: () => void;
  cleanup: () => void;
}

const initialState = {
  status: "idle" as CallStatus,
  peer: null,
  myStream: null,
  peerStream: null,
  incomingCall: null,
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  startMedia: async () => {
    if (get().myStream) return;
    set({ status: "getting-media" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({ myStream: stream, status: "idle" });
    } catch (error) {
      console.error("Failed to get media stream:", error);
      toast({
        variant: "destructive",
        title: "Media Permission Denied",
        description: "Camera and microphone access is required for video calls.",
      });
      set({ status: "failed" });
    }
  },

  placeCall: (peerId, peerName) => {
    const { myStream } = get();
    const { socket } = useSocketStore.getState();
    const { user } = useAuthStore.getState();

    if (!myStream || !socket || !user) {
      return toast({ variant: "destructive", title: "Cannot place call" });
    }

    if (peerId === user.id) {
      return toast({ variant: "destructive", title: "Cannot Call Yourself" });
    }

    toast({ description: `Calling ${peerName}...` });
    const newPeer = new Peer({ initiator: true, trickle: false, stream: myStream });
    set({ peer: newPeer, status: "ringing-outgoing" });

    newPeer.on("signal", (offer) => {
      socket.emit("call:offer", { to: peerId, offer });
    });
    newPeer.on("stream", (stream) => set({ peerStream: stream, status: "active" }));
    newPeer.on("close", () => get().endCall(false)); // Don't emit 'end' if we are the one closing
    newPeer.on("error", () => get().endCall(true));
  },

  answerCall: () => {
    const { myStream, incomingCall } = get();
    const { socket } = useSocketStore.getState();

    if (!myStream || !incomingCall || !socket) {
      return toast({ variant: "destructive", title: "Cannot answer call" });
    }
    set({ status: 'active' });

    const newPeer = new Peer({ initiator: false, trickle: false, stream: myStream });
    set({ peer: newPeer });

    newPeer.signal(incomingCall.signal);

    newPeer.on("signal", (answer) => {
      socket.emit("call:answer", { to: incomingCall.from.id, answer });
    });
    newPeer.on("stream", (stream) => set({ peerStream: stream }));
    newPeer.on("close", () => get().endCall(false));
    newPeer.on("error", () => get().endCall(true));
  },

  endCall: (shouldEmit = true) => {
    const { peer, myStream, incomingCall } = get();
    const { socket } = useSocketStore.getState();

    if (shouldEmit && socket && peer) {
      const peerId = (peer as any)._remoteAddress || incomingCall?.from.id;
      if (peerId) {
        socket.emit("call:end", { to: peerId });
      }
    }

    peer?.destroy();
    myStream?.getTracks().forEach((track) => track.stop());
    set(initialState);
  },

  toggleMic: () => {
    const { myStream } = get();
    myStream?.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
  },

  init: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.on('call:offer', (payload: CallInfo) => {
      set({ status: 'ringing-incoming', incomingCall: payload });
      toast({
        title: "Incoming Call",
        description: `${payload.from.name} is calling.`,
        duration: 20000,
      });
    });

    socket.on('call:answer', (payload: { signal: Peer.SignalData }) => {
      get().peer?.signal(payload.signal);
    });

    socket.on('call:end', () => {
      toast({ title: "Call Ended", description: "The other user has left the call." });
      get().endCall(false);
    });
  },

  cleanup: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;
    get().endCall(true);
    socket.off('call:offer');
    socket.off('call:answer');
    socket.off('call:end');
  },
}));
