"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-14 w-14 text-base",
};

const colors = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const prevSrcRef = useRef(src);

  // Reset imgError when src changes
  useEffect(() => {
    if (prevSrcRef.current !== src) {
      setImgError(false);
      prevSrcRef.current = src;
    }
  }, [src]);

  // Add cache-busting query param to bust browser cache
  const cacheBustedSrc = src ? `${src}?v=${encodeURIComponent(src)}` : undefined;
  const showImage = cacheBustedSrc && !imgError;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-medium text-white shrink-0 overflow-hidden",
        sizeClasses[size],
        !showImage && getColor(name),
        className
      )}
      title={name}
    >
      {showImage ? (
        <img
          src={cacheBustedSrc}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  srcs?: (string | null | undefined)[];
}

function AvatarGroup({ names, max = 3, size = "sm", className, srcs }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {shown.map((name, i) => (
        <Avatar
          key={name}
          name={name}
          src={srcs?.[i]}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
