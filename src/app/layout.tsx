import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Pulse — Team Analytics & Productivity Intelligence",
    template: "%s | Pulse",
  },
  description:
    "AI-powered team analytics and productivity intelligence platform. Track workflows, measure performance, and get actionable insights.",
  keywords: ["analytics", "productivity", "team management", "project management", "SaaS"],
  authors: [{ name: "Pulse" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pulse",
    title: "Pulse — Team Analytics & Productivity Intelligence",
    description: "AI-powered team analytics and productivity intelligence platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
