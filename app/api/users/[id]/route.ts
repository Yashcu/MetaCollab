import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// GET /api/users/[id] — fetch a single user's profile by their Clerk user ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clerkClient();
    const userObj = await client.users.getUser(id);

    const rawRole = userObj.publicMetadata.role;
    const role = rawRole === "admin" ? "admin" : "user";

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
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }
}

// PUT /api/users/[id] — update the current user's display name
// Users can only update their OWN profile — not anyone else's.
// Avatar/image changes are handled by Clerk's <UserProfile /> component.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Users can only edit their own profile
    if (userId !== id) {
      return NextResponse.json(
        { message: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const firstName: unknown = body.firstName;
    const lastName: unknown = body.lastName;

    // At least one field must be provided
    if (
      (firstName === undefined || firstName === null) &&
      (lastName === undefined || lastName === null)
    ) {
      return NextResponse.json(
        { message: "At least one field (firstName or lastName) is required" },
        { status: 400 }
      );
    }

    // Build the update payload — only include fields that were actually sent
    const updatePayload: { firstName?: string; lastName?: string } = {};

    if (typeof firstName === "string" && firstName.trim().length > 0) {
      updatePayload.firstName = firstName.trim();
    }

    if (typeof lastName === "string") {
      // lastName can be empty string (to remove it)
      updatePayload.lastName = lastName.trim();
    }

    const client = await clerkClient();
    const updatedUser = await client.users.updateUser(id, updatePayload);

    const rawRole = updatedUser.publicMetadata.role;
    const role = rawRole === "admin" ? "admin" : "user";

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
    console.error("[PUT /api/users/[id]] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}