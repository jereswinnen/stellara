import "./globals.css";
import type { Metadata } from "next";
import { DarkModeProvider } from "@/components/providers/DarkModeProvider";
import { CommandMenuProvider } from "@/components/providers/CommandMenuProvider";
import { Bricolage_Grotesque } from "next/font/google";
import { Navigation } from "@/components/global/Navigation";
import { ProvidersWrapper } from "@/components/providers/ProvidersWrapper";

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
        <ProvidersWrapper>
          <DarkModeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CommandMenuProvider>
              <Navigation />
              <main className="min-h-screen">{children}</main>
            </CommandMenuProvider>
          </DarkModeProvider>
        </ProvidersWrapper>
      </body>
    </html>
  );
}
