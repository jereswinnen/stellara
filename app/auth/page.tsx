"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Rainbow } from "lucide-react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup") {
      setMode("signup");
    } else if (modeParam === "reset") {
      setMode("reset");
    } else {
      setMode("signin");
    }
  }, [searchParams]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <Rainbow className="size-4" />
            </div>
            Arcova
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            {mode === "signin" && <SignInForm />}
            {mode === "signup" && <SignUpForm />}
            {mode === "reset" && <PasswordResetForm />}
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/authCover.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
