"use client";

import { useEffect } from "react";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error("[GlobalError]", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">
                Something went wrong
            </h1>

            <p className="max-w-md text-sm text-muted-foreground">
                An unexpected error occurred. This has been logged automatically.
                You can try again or refresh the page.
            </p>

            {/* Only expose raw error details locally — never in production */}
            {process.env.NODE_ENV === "development" && (
                <pre className="max-w-lg overflow-auto rounded-md bg-muted p-4 text-left text-xs text-muted-foreground border border-border">
                    {error.message}
                </pre>
            )}

            <button
                onClick={reset}
                className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#070b14] hover:bg-cyan-300 transition-colors"
            >
                Try again
            </button>
        </div>
    );
}