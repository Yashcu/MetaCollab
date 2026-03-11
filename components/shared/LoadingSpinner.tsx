import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    label?: string;
    className?: string;
}

const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
    size = "md",
    label,
    className,
}: LoadingSpinnerProps) {
    return (
        <div
            className={cn("flex flex-col items-center justify-center gap-2", className)}
            role="status"
            aria-label={label ?? "Loading"}
        >
            <div
                className={cn(
                    "animate-spin rounded-full border-muted border-t-primary",
                    sizeClasses[size]
                )}
            />
            {label && (
                <p className="text-sm text-muted-foreground">{label}</p>
            )}
        </div>
    );
}