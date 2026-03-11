import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { requireAuth, serverError } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/users?email=xxx
// Used by the invitation flow to resolve a Clerk user from an email address.
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Please provide an email query parameter" },
        { status: 400 }
      );
    }

    // validate format before hitting Clerk — bad emails cause unexpected 500s
    const emailParsed = z.string().email().safeParse(email);
    if (!emailParsed.success) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const results = await client.users.getUserList({
      emailAddress: [email],
    });

    const foundUser = results.data[0];

    if (!foundUser) {
      return NextResponse.json(
        { message: "No user found with that email address" },
        { status: 404 }
      );
    }

    const primaryEmail = foundUser.emailAddresses[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          id: foundUser.id,
          email: primaryEmail?.emailAddress ?? email,
          // fullName is null when first/last name aren't set
          name: foundUser.fullName ?? foundUser.firstName ?? "Unknown User",
          avatarUrl: foundUser.imageUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/users", error);
  }
}