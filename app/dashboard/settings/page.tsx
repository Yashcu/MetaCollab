"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2, User, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/services/userService";
import { useUIStore } from "@/store/uiStore";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
    { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
];

export default function SettingsPage() {
    const { user } = useUser();
    const { theme, setTheme } = useUIStore();

    const [firstName, setFirstName] = useState(user?.firstName ?? "");
    const [lastName, setLastName] = useState(user?.lastName ?? "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            await updateUserProfile(user.id, { firstName, lastName });
            toast.success("Profile updated!");
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to update profile";
            toast.error("Update failed", { description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-full px-8 py-8 max-w-2xl">
            <div className="mb-10">
                <h1
                    className="text-white text-3xl font-bold leading-tight mb-1"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                >
                    Settings
                </h1>
                <p className="text-white/30 text-sm">Manage your account preferences</p>
            </div>

            {/* Profile section */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-5">
                    <User className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Profile</h2>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 flex flex-col gap-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        {user?.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.imageUrl}
                                alt="Avatar"
                                className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
                            />
                        )}
                        <div>
                            <p className="text-white font-medium text-sm">
                                {user?.fullName ?? "User"}
                            </p>
                            <p className="text-white/30 text-xs mt-0.5">
                                {user?.emailAddresses[0]?.emailAddress}
                            </p>
                            <p className="text-white/20 text-xs mt-1">
                                Avatar is managed via Clerk
                            </p>
                        </div>
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-white/50 text-xs uppercase tracking-wider">First Name</Label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-0"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-white/50 text-xs uppercase tracking-wider">Last Name</Label>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-0"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="self-start bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-semibold"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </div>
            </section>

            {/* Theme section */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <Moon className="w-4 h-4 text-violet-400" />
                    <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Appearance</h2>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
                    <p className="text-white/50 text-sm mb-4">Choose your preferred color scheme</p>
                    <div className="flex gap-3">
                        {themes.map(({ value, label, icon }) => (
                            <button
                                key={value}
                                onClick={() => setTheme(value)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${theme === value
                                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                                        : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/20"
                                    }`}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}