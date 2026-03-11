"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMember } from "@/services/projectService";
import { useProjectStore } from "@/store/projectStore";

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const activeProject = useProjectStore((s) => s.activeProject);

    const handleInvite = async () => {
        if (!email.trim() || !activeProject) return;
        setIsLoading(true);
        try {
            await inviteMember(activeProject.id, email.trim());
            toast.success("Invitation sent!", { description: `Invited ${email}` });
            setEmail("");
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to send invitation";
            toast.error("Could not invite member", { description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0d1424] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Invite Member
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 pt-2">
                    <p className="text-white/40 text-sm leading-relaxed">
                        Enter the email address of the person you want to invite to{" "}
                        <span className="text-white/70">{activeProject?.name}</span>.
                    </p>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-white/50 text-xs uppercase tracking-wider">Email Address</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-0"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="ghost"
                            className="flex-1 text-white/40 hover:text-white hover:bg-white/[0.04]"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-semibold"
                            onClick={handleInvite}
                            disabled={isLoading || !email.trim()}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-1.5" />
                                    Send Invite
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}