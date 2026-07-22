"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Crown } from "lucide-react";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  role?: string | null;
  teamRole?: string | null;
  showBadge?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-14 w-14 text-base",
};

const badgeSizes = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
  xl: "h-5 w-5",
};

const onlineDotSizes = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
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

function getRoleBadge(role: string | null | undefined, teamRole?: string | null) {
  if (role === "super_admin") {
    return { icon: Crown, className: "text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]", label: "Super Admin" };
  }
  if (role === "admin") {
    return { icon: Crown, className: "text-zinc-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]", label: "Admin" };
  }
  if (teamRole === "lead") {
    return { icon: Crown, className: "text-blue-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]", label: "Team Lead" };
  }
  return null;
}

function Avatar({ name, src, size = "md", className, role, teamRole, showBadge = true, isOnline }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    if (prevSrcRef.current !== src) {
      setImgError(false);
      prevSrcRef.current = src;
    }
  }, [src]);

  const cacheBustedSrc = src ? `${src}?v=${encodeURIComponent(src)}` : undefined;
  const showImage = cacheBustedSrc && !imgError;

  const badge = showBadge ? getRoleBadge(role, teamRole) : null;
  const BadgeIcon = badge?.icon;

  const tooltip = badge?.label ? `${name} \u00b7 ${badge.label}` : name;

  return (
    <div
      className={cn("relative inline-flex shrink-0 rounded-full", sizeClasses[size], className)}
      title={tooltip}
    >
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full font-medium text-white overflow-hidden",
          !showImage && getColor(name)
        )}
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

      {BadgeIcon && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-background p-[1px] shadow-sm z-10",
            badgeSizes[size]
          )}
          title={badge?.label}
        >
          <BadgeIcon className={cn("h-full w-full", badge?.className)} />
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute rounded-full bg-emerald-500 ring-2 ring-background z-10",
            onlineDotSizes[size],
            BadgeIcon ? "-bottom-0.5 -left-0.5" : "-bottom-0.5 -right-0.5"
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  srcs?: (string | null | undefined)[];
  roles?: (string | null | undefined)[];
  teamRoles?: (string | null | undefined)[];
}

function AvatarGroup({ names, max = 3, size = "sm", className, srcs, roles, teamRoles }: AvatarGroupProps) {
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
          role={roles?.[i] || null}
          teamRole={teamRoles?.[i] || null}
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
