"use client";

import { useEffect } from "react";
import { Mail, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInvitationStore } from "@/store/invitationStore";
import { Skeleton } from "@/components/ui/skeleton";

export function InvitationsPanel() {
    const { invitations, isLoading, fetchInvitations, handleAccept, handleDecline } =
        useInvitationStore();

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full bg-white/[0.04] rounded-lg" />
                ))}
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-white/20">
                <Mail className="w-8 h-8 mb-2" />
                <p className="text-sm">No pending invitations</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {invitations.map((invitation) => (
                <div
                    key={invitation.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                Project invitation
                            </p>
                            <p className="text-white/30 text-xs truncate">
                                Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDecline(invitation.id)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 px-3 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-400/20 text-xs font-medium"
                            onClick={() => handleAccept(invitation.id)}
                        >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Accept
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}