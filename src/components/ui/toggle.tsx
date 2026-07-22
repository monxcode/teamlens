"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";

interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  description?: string;
  className?: string;
  id?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      disabled = false,
      onCheckedChange,
      size = "md",
      label,
      description,
      className,
      id: propId,
    },
    ref
  ) => {
    const generatedId = useId();
    const id = propId || generatedId;

    const sizeConfig = {
      sm: {
        track: "w-8 h-[18px]",
        thumb: "h-3.5 w-3.5",
        translate: "translate-x-[14px]",
        translateOff: "translate-x-[2px]",
      },
      md: {
        track: "w-10 h-5",
        thumb: "h-4 w-4",
        translate: "translate-x-[18px]",
        translateOff: "translate-x-[2px]",
      },
      lg: {
        track: "w-12 h-6",
        thumb: "h-5 w-5",
        translate: "translate-x-[22px]",
        translateOff: "translate-x-[3px]",
      },
    };

    const config = sizeConfig[size];

    return (
      <div className={cn("flex items-center justify-between py-2", className)}>
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && <p className="text-sm font-medium">{label}</p>}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <label
          htmlFor={id}
          className={cn(
            "relative inline-flex items-center cursor-pointer shrink-0",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            type="checkbox"
            id={id}
            ref={ref}
            checked={controlledChecked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className="sr-only"
          />
          <div
            className={cn(
              config.track,
              "rounded-full transition-all duration-200 ease-out",
              controlledChecked
                ? "bg-primary shadow-[0_0_0_1px_rgba(99,102,241,0.2)]"
                : "bg-muted",
              !disabled && "hover:bg-primary/80"
            )}
          >
            <div
              className={cn(
                config.thumb,
                "rounded-full bg-white shadow-sm transition-all duration-200 ease-out",
                controlledChecked
                  ? config.translate
                  : config.translateOff
              )}
            />
          </div>
        </label>
      </div>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };
export type { ToggleProps };
