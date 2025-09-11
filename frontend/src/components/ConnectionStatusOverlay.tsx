import { useSocketStore } from "@/state/socketStore";
import { useAuthStore } from "@/state/authStore";

export const ConnectionStatusOverlay = () => {
  const status = useSocketStore((s) => s.status);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return null;

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
