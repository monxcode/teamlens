"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default function ChangePasswordPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChangePasswordForm />
      </AuthProvider>
    </ThemeProvider>
  );
}
