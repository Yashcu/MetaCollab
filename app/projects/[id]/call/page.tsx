"use client";

import { useParams } from "next/navigation";
import { CallWindow } from "@/components/call/CallWindow";

export default function CallPage() {
    const params = useParams();
    const projectId = params.id as string;

    return (
        <div className="h-full bg-[#070b14]">
            <CallWindow projectId={projectId} />
        </div>
    );
}