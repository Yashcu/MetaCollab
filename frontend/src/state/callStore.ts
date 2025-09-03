import { create } from 'zustand';
import Peer from 'simple-peer';
import { useSocketStore } from './socketStore';
import { useAuthStore } from './authStore';
import { toast } from '@/components/ui/use-toast';

interface CallInfo {
  isReceivingCall: boolean;
  from: { id: string; name: string } | null;
  signal: any;
}

interface CallState {
  stream: MediaStream | null;
  call: CallInfo;
  callAccepted: boolean;
  callEnded: boolean;
  myVideo: React.RefObject<HTMLVideoElement> | null;
  userVideo: React.RefObject<HTMLVideoElement> | null;
  setStream: (stream: MediaStream | null) => void;
  setCall: (callData: CallInfo) => void;
  setCallAccepted: (accepted: boolean) => void;
  setCallEnded: (ended: boolean) => void;
  setMyVideoRef: (ref: React.RefObject<HTMLVideoElement>) => void;
  setUserVideoRef: (ref: React.RefObject<HTMLVideoElement>) => void;
  answerCall: () => void;
  callUser: (id: string) => void;
  leaveCall: () => void;
}

let peerConnection: Peer.Instance | null = null;

export const useCallStore = create<CallState>((set, get) => ({
  stream: null,
  call: { isReceivingCall: false, from: null, signal: null },
  callAccepted: false,
  callEnded: false,
  myVideo: null,
  userVideo: null,

  setStream: (stream) => set({ stream }),
  setCall: (callData) => set({ call: callData }),
  setCallAccepted: (accepted) => set({ callAccepted: accepted }),
  setCallEnded: (ended) => set({ callEnded: ended }),
  setMyVideoRef: (ref) => set({ myVideo: ref }),
  setUserVideoRef: (ref) => set({ userVideo: ref }),

  answerCall: () => {
    const { stream, call, userVideo } = get();
    const { socket } = useSocketStore.getState();

    if (!stream) {
      toast({
        variant: "destructive",
        title: "Cannot Answer Call",
        description: "Media permissions are required to answer a call.",
      });
      console.error("Attempted to answer call without a media stream.");
      get().leaveCall();
      return;
    }

    set({ callAccepted: true, call: { ...call, isReceivingCall: false } });

    peerConnection = new Peer({ initiator: false, trickle: false, stream: stream! });

    peerConnection.on('signal', (data) => {
      socket?.emit('call:accepted', { signal: data, to: call.from });
    });

    peerConnection.on('stream', (currentStream) => {
      if (userVideo?.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peerConnection.signal(call.signal);
  },

  callUser: (id: string) => {
    const { stream, userVideo } = get();
    const { socket } = useSocketStore.getState();
    const { user } = useAuthStore.getState();

    // Set callAccepted to true immediately for the caller
    set({ callAccepted: true });

    peerConnection = new Peer({ initiator: true, trickle: false, stream: stream! });

    peerConnection.on('signal', (data) => {
      socket?.emit('call:user', {
        to: id,
        signal: data,
        from: { id: user?.id, name: user?.name },
      });
    });

    peerConnection.on('stream', (currentStream) => {
       if (userVideo?.current) { // <-- Use the userVideo ref from the store
         userVideo.current.srcObject = currentStream;
       }
    });

    socket?.on('call:accepted', (signal: any) => {
      // The call is already considered "accepted" on the caller's side.
      // We just need to signal the peer.
      peerConnection!.signal(signal);
    });
  },

  leaveCall: () => {
    set({ callEnded: true, callAccepted: false, call: { isReceivingCall: false, from: null, signal: null } });
    peerConnection?.destroy();
    get().stream?.getTracks().forEach(track => track.stop());
    set({ stream: null });
    // Reset peerConnection to null after destroying
    peerConnection = null;
  },
}));
