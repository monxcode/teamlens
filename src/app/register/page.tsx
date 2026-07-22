"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </ThemeProvider>
  );
}
