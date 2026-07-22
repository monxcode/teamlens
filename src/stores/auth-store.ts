"use client";

import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  avatarUrl?: string;
  forcePasswordReset?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<{ error?: string; forcePasswordReset?: boolean }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: (user) => {
    set({ user });
    // Persist user to localStorage so it survives checkAuth re-fetches
    if (user) {
      localStorage.setItem("pulse_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("pulse_user");
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem("pulse_token", token);
    } else {
      localStorage.removeItem("pulse_token");
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      set({ user: data.user, token: data.token });
      localStorage.setItem("pulse_token", data.token);
      localStorage.setItem("pulse_user", JSON.stringify(data.user));
      return { forcePasswordReset: data.user.forcePasswordReset };
    } catch {
      return { error: "Network error. Please try again." };
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      set({ user: data.user, token: data.token });
      localStorage.setItem("pulse_token", data.token);
      localStorage.setItem("pulse_user", JSON.stringify(data.user));
      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem("pulse_token");
    localStorage.removeItem("pulse_user");
  },

  checkAuth: async () => {
    const token = localStorage.getItem("pulse_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    // First, load cached user from localStorage for instant display
    const cachedUser = localStorage.getItem("pulse_user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        set({ user: parsed, token, isLoading: false });
      } catch {
        // ignore parse errors
      }
    }

    // Then fetch fresh data from server
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem("pulse_token");
        localStorage.removeItem("pulse_user");
        set({ isLoading: false, user: null });
        return;
      }
      const data = await res.json();
      set({ user: data.user, token, isLoading: false });
      localStorage.setItem("pulse_user", JSON.stringify(data.user));
    } catch {
      localStorage.removeItem("pulse_token");
      localStorage.removeItem("pulse_user");
      set({ isLoading: false, user: null });
    }
  },

  refreshUser: async () => {
    const token = localStorage.getItem("pulse_token");
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user });
        localStorage.setItem("pulse_user", JSON.stringify(data.user));
      }
    } catch {
      // silently fail
    }
  },
}));
