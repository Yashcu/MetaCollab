import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import type { ZodError } from "zod";
import { resolveRole } from "@/lib/utils";

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

// Admin guard — wraps requireAuth and adds a Clerk metadata role check
export async function requireAdmin(): Promise<{ userId: string; error: null } | { userId: null; error: NextResponse }> {
    const authResult = await requireAuth();
    if (authResult.error) return authResult;

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(authResult.userId);
    const role = resolveRole(clerkUser.publicMetadata as Record<string, unknown>);

    if (role !== "admin") {
        return {
            userId: null,
            error: NextResponse.json({ message: "Access denied. Admins only." }, { status: 403 }),
        };
    }
    return { userId: authResult.userId, error: null };
}

// Returns an error response if the request Content-Type is not application/json
export function validateJsonContentType(req: NextRequest): NextResponse | null {
    const ct = req.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
        return NextResponse.json(
            { message: "Content-Type must be application/json" },
            { status: 415 }
        );
    }
    return null;
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
    if (error instanceof Error) {
        console.error(`[${route}]`, error.message, error.stack);
    } else {
        console.error(`[${route}]`, JSON.stringify(error));
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}