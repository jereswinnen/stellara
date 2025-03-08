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
    <div className="min-h-svh grid lg:grid-cols-[1fr_1.5fr]">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <svg className="size-8" viewBox="0 0 110 110">
              <path
                d="M101.128 53.4683L62.058 46.9371L55.5307 7.87109C55.4526 7.37109 55.0112 7 54.4995 7C53.9878 7 53.5503 7.37109 53.4683 7.87109L46.9371 46.9411L7.87109 53.4684C7.37109 53.5465 7 53.9879 7 54.4996C7 55.0113 7.37109 55.4488 7.87109 55.5308L46.9411 62.062L53.4723 101.132C53.5504 101.632 53.9918 102.003 54.5035 102.003C55.0152 102.003 55.4527 101.632 55.5347 101.132L62.0659 62.062L101.136 55.5308C101.636 55.4527 102.007 55.0113 102.007 54.4996C102.007 53.9879 101.636 53.5504 101.136 53.4684L101.128 53.4683Z"
                fill="currentColor"
              />
            </svg>
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
      <div className="relative hidden lg:block">
        <div className="size-full pt-4 pb-4 pr-4">
          <div className="relative size-full flex items-center justify-center">
            <article className="z-10 max-w-3xl flex flex-col items-center gap-3 text-white text-lg text-center">
              <svg className="size-12" viewBox="0 0 110 110">
                <path
                  d="M101.128 53.4683L62.058 46.9371L55.5307 7.87109C55.4526 7.37109 55.0112 7 54.4995 7C53.9878 7 53.5503 7.37109 53.4683 7.87109L46.9371 46.9411L7.87109 53.4684C7.37109 53.5465 7 53.9879 7 54.4996C7 55.0113 7.37109 55.4488 7.87109 55.5308L46.9411 62.062L53.4723 101.132C53.5504 101.632 53.9918 102.003 54.5035 102.003C55.0152 102.003 55.4527 101.632 55.5347 101.132L62.0659 62.062L101.136 55.5308C101.636 55.4527 102.007 55.0113 102.007 54.4996C102.007 53.9879 101.636 53.5504 101.136 53.4684L101.128 53.4683Z"
                  fill="currentColor"
                />
              </svg>
              <h2 className="font-light text-4xl">A new way of archiving.</h2>
              <p className="opacity-70">
                Save links, articles, podcasts, books, and notes in a
                beautifully organized space. Whether you&rsquo;re collecting
                ideas, researching, or revisiting later, Arcova keeps everything
                clean, distraction-free, and always within reach.
              </p>
            </article>
            <figure className="absolute size-full">
              <div className="absolute size-full dark:inset-ring inset-ring-white/40 bg-gradient-to-b from-green-400 to-amber-500 dark:from-green-700 dark:to-amber-800 mix-blend-multiply rounded-3xl" />
              <img
                src="https://images.unsplash.com/photo-1740056282561-dbb187532373?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Image"
                className="size-full rounded-3xl object-cover"
              />
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}
