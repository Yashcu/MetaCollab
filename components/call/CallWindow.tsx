"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Peer from "simple-peer";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePusher } from "@/components/realtime/usePusher";
import { useCallStore } from "@/store/callStore";
import { getPusherClient } from "@/lib/pusher-client";
import type { CallInfo } from "@/store/callStore";

interface CallWindowProps {
    projectId: string;
}

export function CallWindow({ projectId }: CallWindowProps) {
    const { user } = useUser();
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const peerVideoRef = useRef<HTMLVideoElement>(null);
    const channelName = `private-project-${projectId}`;

    const {
        status,
        myStream,
        peerStream,
        incomingCall,
        isMicEnabled,
        isVideoEnabled,
        peer,
        startMedia,
        toggleMic,
        toggleCamera,
        setStatus,
        setIncomingCall,
        setPeer,
        setPeerStream,
        resetCallState,
    } = useCallStore();

    // Attach local stream to video element
    useEffect(() => {
        if (myVideoRef.current && myStream) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [myStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (peerVideoRef.current && peerStream) {
            peerVideoRef.current.srcObject = peerStream;
        }
    }, [peerStream]);

    // Listen for incoming calls from project members
    usePusher<CallInfo>(channelName, "call:incoming", (data) => {
        if (data.from.id !== user?.id) {
            setIncomingCall(data);
            setStatus("ringing-incoming");
        }
    });

    // Listen for call answers
    usePusher<{ signal: Peer.SignalData }>(channelName, "call:answer", (data) => {
        peer?.signal(data.signal);
    });

    // Listen for call end
    usePusher(channelName, "call:ended", () => {
        resetCallState();
    });

    const startCall = async () => {
        await startMedia();
        const stream = useCallStore.getState().myStream;
        if (!stream) return;

        setStatus("ringing-outgoing");

        const newPeer = new Peer({ initiator: true, trickle: false, stream });

        newPeer.on("signal", (signal) => {
            // Broadcast call offer to project channel
            getPusherClient().channel(channelName)?.trigger("client-call:incoming", {
                from: { id: user?.id, name: user?.fullName ?? "User" },
                signal,
            });
        });

        newPeer.on("stream", (remoteStream) => {
            setPeerStream(remoteStream);
            setStatus("active");
        });

        setPeer(newPeer);
    };

    const answerCall = async () => {
        if (!incomingCall) return;
        await startMedia();
        const stream = useCallStore.getState().myStream;
        if (!stream) return;

        const newPeer = new Peer({ initiator: false, trickle: false, stream });

        newPeer.on("signal", (signal) => {
            getPusherClient().channel(channelName)?.trigger("client-call:answer", { signal });
        });

        newPeer.on("stream", (remoteStream) => {
            setPeerStream(remoteStream);
            setStatus("active");
        });

        newPeer.signal(incomingCall.signal);
        setPeer(newPeer);
        setStatus("active");
    };

    const endCall = () => {
        getPusherClient().channel(channelName)?.trigger("client-call:ended", {});
        resetCallState();
    };

    const isIdle = status === "idle" || status === "ready";
    const isActive = status === "active";
    const isIncoming = status === "ringing-incoming";
    const isOutgoing = status === "ringing-outgoing";

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#070b14] relative">
            {/* Remote video — fullscreen background when active */}
            {isActive && (
                <video
                    ref={peerVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover rounded-none"
                />
            )}

            {/* Idle/waiting state */}
            {isIdle && (
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Video className="w-8 h-8 text-white/20" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-lg mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                            Video Call
                        </p>
                        <p className="text-white/30 text-sm">Start a call with your team</p>
                    </div>
                    <Button
                        onClick={startCall}
                        className="bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-semibold gap-2"
                    >
                        <Phone className="w-4 h-4" />
                        Start Call
                    </Button>
                </div>
            )}

            {/* Outgoing ring state */}
            {isOutgoing && (
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center animate-pulse">
                        <Phone className="w-7 h-7 text-cyan-400" />
                    </div>
                    <p className="text-white/60 text-sm">Calling...</p>
                    <Button
                        onClick={endCall}
                        variant="ghost"
                        className="text-red-400 hover:bg-red-400/10 gap-2"
                    >
                        <PhoneOff className="w-4 h-4" />
                        Cancel
                    </Button>
                </div>
            )}

            {/* Incoming call */}
            {isIncoming && incomingCall && (
                <div className="flex flex-col items-center gap-5 text-center p-8 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                    <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-violet-400">
                            {incomingCall.from.name[0]?.toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="text-white font-semibold text-base">{incomingCall.from.name}</p>
                        <p className="text-white/40 text-sm">is calling...</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={endCall}
                            className="w-12 h-12 p-0 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </Button>
                        <Button
                            onClick={answerCall}
                            className="w-12 h-12 p-0 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
                        >
                            <Phone className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Local video PiP — shown when call is active */}
            {isActive && (
                <div className="absolute bottom-24 right-5 w-40 rounded-xl overflow-hidden border border-white/10 shadow-xl">
                    <video ref={myVideoRef} autoPlay playsInline muted className="w-full" />
                </div>
            )}

            {/* Call controls — shown during active call */}
            {isActive && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#070b14]/80 backdrop-blur-md border border-white/10">
                    <Button
                        onClick={toggleMic}
                        size="sm"
                        className={`w-10 h-10 p-0 rounded-full transition-all ${isMicEnabled
                                ? "bg-white/10 hover:bg-white/20 text-white"
                                : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            }`}
                    >
                        {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>

                    <Button
                        onClick={toggleCamera}
                        size="sm"
                        className={`w-10 h-10 p-0 rounded-full transition-all ${isVideoEnabled
                                ? "bg-white/10 hover:bg-white/20 text-white"
                                : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            }`}
                    >
                        {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>

                    <Button
                        onClick={endCall}
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full bg-red-500 hover:bg-red-400 text-white"
                    >
                        <PhoneOff className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}