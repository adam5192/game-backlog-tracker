import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import NavBar from "@/components/NavBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Playloggd | Game Backlog Tracker.",
  description:
    "Track your game backlog, import from Steam, and get AI-powered recommendations for what to play next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <NavBar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border-color py-4 text-center">
            <p className="text-xs text-text-secondary">
              <a
                href="https://www.flaticon.com/free-icons/rpg"
                title="rpg icons"
                className="hover:text-foreground"
              >
                Rpg icons created by redempticon - Flaticon
              </a>
            </p>
          </footer>
          <Toaster theme="dark" position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
