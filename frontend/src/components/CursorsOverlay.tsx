import { shallow } from "zustand/shallow";
import { useProjectStore } from "@/state/projectStore";
import { useSocketStore } from "@/state/socketStore";

const CursorsOverlay = () => {
  const cursors = useProjectStore((state) => state.cursors, shallow);
  const projectUsers = useSocketStore((state) => state.projectUsers, shallow);

  return (
    <>
      {Array.from(cursors.entries()).map(([userId, { position }]) => {
        const user = projectUsers.find((p) => p.userId === userId);

        return (
          <div
            key={userId}
            className="absolute z-50 pointer-events-none transition-transform duration-75 ease-linear"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              left: -12, // Offset to center the cursor
              top: -12, // Offset to center the cursor
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-500"
            >
              <path
                d="M5.63604 5.63604C7.19839 4.07368 9.47463 3.5 12 3.5C14.5254 3.5 16.8016 4.07368 18.364 5.63604C19.9263 7.19839 20.5 9.47463 20.5 12C20.5 14.5254 19.9263 16.8016 18.364 18.364C16.8016 19.9263 14.5254 20.5 12 20.5C9.47463 20.5 7.19839 19.9263 5.63604 18.364C4.07368 16.8016 3.5 14.5254 3.5 12C3.5 9.47463 4.07368 7.19839 5.63604 5.63604Z"
                stroke="white"
                strokeWidth="2"
              />
              <path
                d="M5.63604 5.63604C7.19839 4.07368 9.47463 3.5 12 3.5C14.5254 3.5 16.8016 4.07368 18.364 5.63604C19.9263 7.19839 20.5 9.47463 20.5 12C20.5 14.5254 19.9263 16.8016 18.364 18.364C16.8016 19.9263 14.5254 20.5 12 20.5C9.47463 20.5 7.19839 19.9263 5.63604 18.364C4.07368 16.8016 3.5 14.5254 3.5 12C3.5 9.47463 4.07368 7.19839 5.63604 5.63604Z"
                fill="currentColor"
              />
            </svg>
            <span className="ml-2 mt-1 absolute whitespace-nowrap bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
              {user?.userName || "..."}
            </span>
          </div>
        );
      })}
    </>
  );
};

export default CursorsOverlay;
