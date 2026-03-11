import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { userUpdateSchema } from "@/lib/validations";
import { requireAuth, validationError, serverError } from "@/lib/api";
import { resolveRole } from "@/lib/utils";

export const runtime = "nodejs";


// GET /api/users/[id] — fetch a user's public profile by their Clerk user ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    const client = await clerkClient();
    const userObj = await client.users.getUser(id);

    const role = resolveRole(userObj.publicMetadata as Record<string, unknown>);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: userObj.id,
          email: userObj.emailAddresses[0]?.emailAddress ?? "",
          name: userObj.fullName ?? userObj.firstName ?? "Unknown User",
          avatarUrl: userObj.imageUrl,
          role,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/users/[id]] error:", error);
    // Clerk throws a 404-shaped error when the user doesn't exist
    const isNotFound =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: number }).status === 404;
    return NextResponse.json(
      { message: isNotFound ? "User not found" : "Internal server error" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

// PUT /api/users/[id] — update the authenticated user's display name
// Avatar changes go through Clerk's <UserProfile /> component, not this route.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Users can only modify their own profile
    if (userId !== id) {
      return NextResponse.json(
        { message: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { firstName, lastName } = parsed.data;

    // Build update payload dynamically — omit fields not present in the request
    const updatePayload: { firstName?: string; lastName?: string } = {};

    if (typeof firstName === "string" && firstName.trim().length > 0) {
      updatePayload.firstName = firstName.trim();
    }

    if (typeof lastName === "string") {
      // Allow empty string to clear the last name
      updatePayload.lastName = lastName.trim();
    }

    // Bail early — calling Clerk with an empty payload is a no-op and wastes a round-trip
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const updatedUser = await client.users.updateUser(id, updatePayload);

    const role = resolveRole(updatedUser.publicMetadata as Record<string, unknown>);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.emailAddresses[0]?.emailAddress ?? "",
          name: updatedUser.fullName ?? updatedUser.firstName ?? "Unknown User",
          avatarUrl: updatedUser.imageUrl,
          role,
        },
        message: "Profile updated successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("PUT /api/users/[id]", error);
  }
}
