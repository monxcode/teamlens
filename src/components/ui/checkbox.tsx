"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useState, useEffect, useId } from "react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  labelClassName?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 8.05L5.5 10.5L11 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="check-path"
    />
  </svg>
);

const MinusIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 7H11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      labelClassName,
      checked: controlledChecked,
      defaultChecked = false,
      disabled = false,
      onCheckedChange,
      onChange,
      id: propId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const [isAnimating, setIsAnimating] = useState(false);

    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : internalChecked;

    useEffect(() => {
      if (controlledChecked !== undefined) {
        setInternalChecked(controlledChecked);
      }
    }, [controlledChecked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;

      if (!isControlled) {
        setInternalChecked(newChecked);
      }

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      onCheckedChange?.(newChecked);
      onChange?.(e);
    };

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center gap-2.5 cursor-pointer select-none group",
          disabled && "cursor-not-allowed opacity-50",
          labelClassName
        )}
      >
        <div className="relative flex items-center justify-center">
          {/* Hidden native checkbox for accessibility */}
          <input
            type="checkbox"
            id={id}
            ref={ref}
            checked={isChecked}
            disabled={disabled}
            onChange={handleChange}
            className="sr-only"
            aria-checked={isChecked ? "true" : "false"}
            {...props}
          />

          {/* Custom checkbox visual */}
          <div
            className={cn(
              // Base styles
              "relative h-[18px] w-[18px] rounded-md border-[1.5px] transition-all duration-200 ease-out",
              // Unchecked state
              !isChecked && [
                "border-muted-foreground/30 bg-transparent",
                "hover:border-primary/50 hover:bg-primary/5",
                "group-hover:border-primary/60",
              ],
              // Checked state
              isChecked && [
                "border-primary bg-primary",
                "shadow-[0_0_0_1px_rgba(99,102,241,0.1)]",
              ],
              // Focus visible
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
              // Disabled
              disabled && "opacity-50 cursor-not-allowed",
              // Animation
              isAnimating && "scale-95",
            )}
          >
            {/* Checked icon */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-200",
                isChecked ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )}
            >
              <CheckIcon
                className={cn(
                  "h-3 w-3 text-primary-foreground",
                  isChecked && "animate-check-in"
                )}
              />
            </div>
          </div>

          {/* Focus ring */}
          <div
            className={cn(
              "absolute -inset-1 rounded-lg transition-opacity duration-200",
              "ring-2 ring-ring ring-offset-2 ring-offset-background",
              "opacity-0 group-focus-within:opacity-100"
            )}
          />
        </div>

        {label && (
          <span
            className={cn(
              "text-sm font-medium leading-none text-foreground transition-colors",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              disabled && "opacity-50",
              className
            )}
          >
            {label}
          </span>
        )}

        <style jsx>{`
          @keyframes check-in {
            0% {
              stroke-dasharray: 20;
              stroke-dashoffset: 20;
            }
            100% {
              stroke-dasharray: 20;
              stroke-dashoffset: 0;
            }
          }

          .check-path {
            stroke-dasharray: 20;
            stroke-dashoffset: ${isChecked ? "0" : "20"};
            transition: stroke-dashoffset 0.3s ease-out;
          }

          .animate-check-in .check-path {
            animation: check-in 0.3s ease-out forwards;
          }
        `}</style>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox, CheckIcon, MinusIcon };
export type { CheckboxProps };
