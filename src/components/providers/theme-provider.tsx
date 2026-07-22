"use client";

import { useEffect, ReactNode } from "react";
import { initializeTheme } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeTheme();
  }, []);

  return <>{children}</>;
}
