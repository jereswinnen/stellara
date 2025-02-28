"use client";

import { useState } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="container max-w-lg mx-auto p-8">
      <div className="flex justify-center mb-8">
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={mode === "signin" ? "default" : "ghost"}
            onClick={() => setMode("signin")}
          >
            Sign In
          </Button>
          <Button
            variant={mode === "signup" ? "default" : "ghost"}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </Button>
        </div>
      </div>

      {mode === "signin" ? <SignInForm /> : <SignUpForm />}
    </div>
  );
}
