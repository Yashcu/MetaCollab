import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, Link } from "react-router-dom";
import { Sun, Moon, Phone, ShieldCheck } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useCallStore } from "@/state/callStore";
import { useSocketStore } from "@/state/socketStore";
import { useToast } from "./ui/use-toast";
import InvitationDropdown from "./InvitationDropdown";

interface HeaderProps {
  showCallButton?: boolean;
}

const Header = ({ showCallButton = false }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const { projectUsers } = useSocketStore();
  const { user: authUser } = useAuth();
  const { startMedia, placeCall } = useCallStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStartCall = async () => {
    if (!authUser) return;
    const otherUsers = projectUsers.filter((p) => p.userId !== authUser.id);

    if (otherUsers.length > 0) {
      toast({ description: "Starting call..." });
      await startMedia();
      placeCall(otherUsers[0].userId, otherUsers[0].userName);
    } else {
      toast({
        variant: "destructive",
        title: "No one to call",
        description: "You are the only one in the project right now.",
      });
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-2 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <Link
        to="/dashboard"
        className="text-xl font-semibold text-gray-800 dark:text-white"
      >
        MetaCollab
      </Link>

      <div className="flex items-center gap-2">
        {showCallButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStartCall}
            aria-label="Start call"
          >
            <Phone className="h-5 w-5" />
          </Button>
        )}
        <InvitationDropdown />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar>
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback className="font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              Profile
            </DropdownMenuItem>
            {user?.role === "admin" && (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
