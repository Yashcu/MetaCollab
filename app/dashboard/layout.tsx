// Server component — auth() runs on the server before the page renders.
// We never call useUser() here because React context (ClerkProvider)
// doesn't exist on the server. auth() reads the session token directly.
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/DashboardShell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Protect the entire dashboard — unauthenticated users go to sign-in.
    // Doing this in the layout means every child page is covered automatically.
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    return <DashboardShell userId={userId}>{children}</DashboardShell>;
}