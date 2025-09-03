import { Outlet } from "react-router-dom";
import Header from "./Header";

/**
 * The main application layout, now without a sidebar.
 * It consists of a header and the main content area where pages are rendered.
 */
const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
