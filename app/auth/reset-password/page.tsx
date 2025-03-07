"use client";

import { Rainbow } from "lucide-react";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export default function PasswordResetPage() {
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
            <PasswordResetForm />
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block" />
    </div>
  );
}
