"use client";

import { cn } from "@/lib/utils";

interface ProjectColorProps {
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProjectColor({ color, size = "md", className }: ProjectColorProps) {
  return (
    <div
      className={cn(
        "rounded-lg shrink-0",
        size === "sm" && "h-3 w-3",
        size === "md" && "h-4 w-4",
        size === "lg" && "h-6 w-6",
        className
      )}
      style={{ backgroundColor: color }}
    />
  );
}
