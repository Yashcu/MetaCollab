import { useSocketStore } from "@/state/socketStore";

export const ConnectionStatusOverlay = () => {
  const status = useSocketStore((s) => s.status);
  if (status !== "connected") {
    return (
      <div className="fixed top-0 inset-x-0 z-50 bg-red-700 text-white text-center py-2 font-bold animate-pulse">
        {status === "connecting"
          ? "Connecting…"
          : "Offline! Trying to reconnect…"}
      </div>
    );
  }
  return null;
};
