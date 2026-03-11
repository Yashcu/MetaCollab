import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// GET /api/users?email=xxx — look up a user by their email address
// Used by the invitation flow to find a user before inviting them
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Please provide an email query parameter" },
        { status: 400 }
      );
    }

    // Search for the user in Clerk by their email address
    const client = await clerkClient();
    const results = await client.users.getUserList({
      emailAddress: [email],
    });

    // Guard: results.data[0] is undefined if no users found
    const foundUser = results.data[0];

    if (!foundUser) {
      return NextResponse.json(
        { message: "No user found with that email address" },
        { status: 404 }
      );
    }

    // Guard: emailAddresses[0] could be undefined
    const primaryEmail = foundUser.emailAddresses[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          id: foundUser.id,
          email: primaryEmail?.emailAddress ?? email,
          // fullName can be null if not set — fall back through options
          name: foundUser.fullName ?? foundUser.firstName ?? "Unknown User",
          avatarUrl: foundUser.imageUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/users] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}