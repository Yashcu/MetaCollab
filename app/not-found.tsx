import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
            <span className="font-sans text-8xl font-bold text-foreground/10 select-none">
                404
            </span>
            <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
            <p className="max-w-xs text-sm text-muted-foreground">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
                href="/dashboard"
                className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#070b14] hover:bg-cyan-300 transition-colors"
            >
                Back to Dashboard
            </Link>
        </div>
    );
}