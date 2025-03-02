import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CommandMenuProvider } from "@/components/providers/command-menu-provider";
import { Bricolage_Grotesque } from "next/font/google";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  axes: ["wdth", "opsz"],
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Personal Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bricolageGrotesque.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CommandMenuProvider>{children}</CommandMenuProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
