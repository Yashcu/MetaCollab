// Server component — validates auth server-side before rendering the project shell.
// useParams() and usePathname() live in ProjectShell (client component) instead.
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProjectShell } from "@/components/shared/ProjectShell";

export default async function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Await params — required in Next.js 15 (params is now a Promise)
    const { id: projectId } = await params;

    return <ProjectShell projectId={projectId}>{children}</ProjectShell>;
}