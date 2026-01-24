import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8 animate-in fade-in zoom-in duration-500">
                    <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-semibold text-white mb-2">
                        Page Not Found
                    </h2>
                    <p className="text-gray-400">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom duration-700">
                    <Link to="/dashboard">
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                            <Home className="h-4 w-4 mr-2" />
                            Go to Dashboard
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
