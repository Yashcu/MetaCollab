import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

export default function RenderWarningBanner() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 50 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 50000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-sm border-b border-amber-500/30">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-center gap-3 relative">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
                    <p className="text-sm md:text-base font-medium text-center text-amber-100">
                        Render service is inactive, please wait for 50 seconds
                    </p>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute right-0 p-1 hover:bg-white/10 rounded-md transition-colors text-amber-200 hover:text-white"
                        aria-label="Dismiss banner"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
