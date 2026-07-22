"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return (
    <ThemeProvider>
      <LandingPage />
    </ThemeProvider>
  );
}
