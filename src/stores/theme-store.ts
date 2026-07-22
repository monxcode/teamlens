"use client";

import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  resolved: "dark",
  setTheme: (theme) => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    localStorage.setItem("pulse_theme", theme);
    set({ theme, resolved });
  },
}));

export function initializeTheme() {
  const stored = localStorage.getItem("pulse_theme") as Theme | null;
  const theme = stored || "system";
  const resolved = theme === "system" ? getSystemTheme() : theme;
  applyTheme(resolved);
  useThemeStore.setState({ theme, resolved });
}
