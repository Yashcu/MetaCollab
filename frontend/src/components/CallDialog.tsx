import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { PhoneOff } from "lucide-react";
import { useCallStore } from "@/state/callStore";
import { useToast } from "./ui/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CallDialog = ({ isOpen, onClose }: Props) => {
  const {
    stream,
    call,
    callAccepted,
    callEnded,
    setStream,
    setMyVideoRef,
    setUserVideoRef,
    answerCall,
  } = useCallStore();

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMyVideoRef(myVideoRef);
    setUserVideoRef(userVideoRef);
  }, [setMyVideoRef, setUserVideoRef]);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
          setStream(currentStream);
          if (myVideoRef.current) {
            myVideoRef.current.srcObject = currentStream;
          }
        })
        .catch((err) => {
          console.error("Failed to get media stream:", err);
          if (err.name === "NotAllowedError") {
            toast({
              variant: "destructive",
              title: "Permission Denied",
              description:
                "You need to allow camera and microphone access to join a call.",
            });
          }
          onClose();
        });
    } else {
      stream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen, setStream, onClose, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Project Call</DialogTitle>
          <DialogDescription>
            A real-time video call with your project members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-120px)]">
          {/* My Video */}
          <div className="bg-black rounded-lg relative">
            <video
              playsInline
              muted
              ref={myVideoRef}
              autoPlay
              className="w-full h-full object-cover rounded-lg"
            />
            <p className="absolute bottom-2 left-2 text-white bg-black/50 px-2 rounded">
              You
            </p>
          </div>

          {/* User's Video or Call Prompt */}
          <div className="bg-black rounded-lg relative">
            {callAccepted && !callEnded ? (
              <>
                <video
                  playsInline
                  ref={userVideoRef}
                  autoPlay
                  className="w-full h-full object-cover rounded-lg"
                />
                <p className="absolute bottom-2 left-2 text-white bg-black/50 px-2 rounded">
                  {call.from?.name || "Peer"}
                </p>
              </>
            ) : call.isReceivingCall && !callAccepted ? (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <p>{call.from?.name} is calling...</p>
                <Button onClick={answerCall} className="mt-4">
                  Answer Call
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Waiting for other user to join...</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <div className="flex gap-4 mx-auto">
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
