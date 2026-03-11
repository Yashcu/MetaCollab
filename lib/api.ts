import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

// replaces the auth boilerplate repeated in every route
export async function requireAuth(): Promise<{ userId: string; error: null } | { userId: null; error: NextResponse }> {
    const { userId } = await auth();
    if (!userId) {
        return {
            userId: null,
            error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
        };
    }
    return { userId, error: null };
}

// replaces the repeated Zod error response pattern
export function validationError(error: ZodError): NextResponse {
    return NextResponse.json(
        { message: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
    );
}

// replaces the repeated 500 catch block
export function serverError(route: string, error: unknown): NextResponse {
    console.error(`[${route}] error:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}