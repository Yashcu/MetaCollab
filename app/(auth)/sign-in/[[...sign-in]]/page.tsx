import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Give the sign-in tab its own title
export const metadata: Metadata = {
  title: "Sign In — MetaCollab",
};

export default async function SignInPage() {
  // If the user is already logged in, don't show them the sign-in form.
  // Send them straight to their dashboard instead.
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      {/* Simple branding above the form */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          MetaCollab
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your workspace
        </p>
      </div>
      <SignIn forceRedirectUrl="/dashboard" />
    </div>
  );
}