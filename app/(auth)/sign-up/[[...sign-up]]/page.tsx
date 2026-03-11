import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Account — MetaCollab",
};

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          MetaCollab
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account to get started
        </p>
      </div>
      <SignUp forceRedirectUrl="/dashboard" />
    </div>
  );
}