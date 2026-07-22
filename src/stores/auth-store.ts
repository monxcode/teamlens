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
    if (user) {
      sessionStorage.setItem("pulse_user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("pulse_user");
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      sessionStorage.setItem("pulse_token", token);
    } else {
      sessionStorage.removeItem("pulse_token");
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
      sessionStorage.setItem("pulse_token", data.token);
      sessionStorage.setItem("pulse_user", JSON.stringify(data.user));
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
      sessionStorage.setItem("pulse_token", data.token);
      sessionStorage.setItem("pulse_user", JSON.stringify(data.user));
      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  },

  logout: () => {
    set({ user: null, token: null });
    sessionStorage.removeItem("pulse_token");
    sessionStorage.removeItem("pulse_user");
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem("pulse_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    // First, load cached user from sessionStorage for instant display
    const cachedUser = sessionStorage.getItem("pulse_user");
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
        sessionStorage.removeItem("pulse_token");
        sessionStorage.removeItem("pulse_user");
        set({ isLoading: false, user: null });
        return;
      }
      const data = await res.json();
      set({ user: data.user, token, isLoading: false });
      sessionStorage.setItem("pulse_user", JSON.stringify(data.user));
    } catch {
      sessionStorage.removeItem("pulse_token");
      sessionStorage.removeItem("pulse_user");
      set({ isLoading: false, user: null });
    }
  },

  refreshUser: async () => {
    const token = sessionStorage.getItem("pulse_token");
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user });
        sessionStorage.setItem("pulse_user", JSON.stringify(data.user));
      }
    } catch {
      // silently fail
    }
  },
}));
