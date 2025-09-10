import { useEffect } from "react";
import { useInvitationStore } from "@/state/invitationStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, X } from "lucide-react";

const InvitationDropdown = () => {
  const {
    invitations,
    isLoading,
    fetchInvitations,
    handleAccept,
    handleDecline,
  } = useInvitationStore();

  useEffect(() => {
    // Fetch invitations when the component mounts
    fetchInvitations();
  }, [fetchInvitations]);

  const hasPendingInvitations = invitations.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasPendingInvitations && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Project Invitations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : hasPendingInvitations ? (
          invitations.map((invite) => (
            <DropdownMenuItem
              key={invite.id}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{invite.project.name}</p>
                <p className="text-xs text-muted-foreground">
                  Invited by {invite.inviter.name}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-green-500 hover:text-green-600"
                  onClick={() => handleAccept(invite.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={() => handleDecline(invite.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No pending invitations.</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InvitationDropdown;
