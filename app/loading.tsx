import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <LoadingSpinner size="lg" label="Loading..." />
        </div>
    );
}