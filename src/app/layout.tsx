import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ludodex | Game Backlog Tracker.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950">
        <NavBar />
        {/* flex-1 lets the actual page content grow to fill available
            space, pushing the footer down to the bottom of the viewport
            on short pages, rather than the footer floating right below
            a small amount of content */}
        <div className="flex-1">{children}</div>

        <footer className="border-t border-gray-800 py-4 text-center">
          <p className="text-xs text-gray-600">
            <a
              href="https://www.flaticon.com/free-icons/rpg"
              title="rpg icons"
              className="hover:text-gray-400"
            >
              Rpg icons created by redempticon - Flaticon
            </a>
          </p>
        </footer>

        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
