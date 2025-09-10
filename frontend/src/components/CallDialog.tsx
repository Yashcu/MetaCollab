import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { useCallStore } from "@/state/callStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer = ({
  stream,
  muted = false,
}: {
  stream: MediaStream | null;
  muted?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      playsInline
      muted={muted}
      ref={videoRef}
      autoPlay
      className="h-full w-full rounded-lg object-cover"
    />
  );
};

const CallDialog = ({ isOpen, onClose }: Props) => {
  // --- Subscribe to the new, clean state from the callStore ---
  const { status, myStream, peerStream, incomingCall, answerCall } =
    useCallStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Project Call</DialogTitle>
          <DialogDescription>
            Real-time video call with your project members.
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[calc(100%-120px)] grid-cols-1 gap-4 md:grid-cols-2">
          {/* My Video Feed */}
          <div className="relative rounded-lg bg-black">
            <VideoPlayer stream={myStream} muted />
            <p className="absolute bottom-2 left-2 rounded bg-black/50 px-2 text-white">
              You
            </p>
          </div>

          {/* Peer's Video Feed or Call Status UI */}
          <div className="relative flex items-center justify-center rounded-lg bg-black text-white">
            {status === "active" && peerStream ? (
              <>
                <VideoPlayer stream={peerStream} />
                <p className="absolute bottom-2 left-2 rounded bg-black/50 px-2 text-white">
                  {incomingCall?.from?.name || "Peer"}
                </p>
              </>
            ) : status === "ringing-incoming" ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-semibold">
                  {incomingCall?.from?.name} is calling...
                </p>
                <Button
                  onClick={answerCall}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Phone className="mr-2 h-5 w-5" /> Answer
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {status === "ringing-outgoing"
                  ? "Ringing..."
                  : "Waiting for user to connect..."}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="mx-auto flex gap-4">
            <Button variant="destructive" size="lg" onClick={onClose}>
              <PhoneOff className="mr-2 h-4 w-4" /> End Call
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CallDialog;
