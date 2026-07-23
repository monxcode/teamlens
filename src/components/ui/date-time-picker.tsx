"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
  disabled?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTime(hours: number, minutes: number): string {
  const h = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${h}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DateTimePicker({ value, onChange, placeholder = "Select expiry date & time", minDate, className, disabled }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const now = minDate || new Date();
  now.setSeconds(0, 0);

  const selectedDate = value ? new Date(value) : null;

  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : now.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : now.getFullYear());
  const [selectedHour, setSelectedHour] = useState(selectedDate ? selectedDate.getHours() : now.getHours());
  const [selectedMinute, setSelectedMinute] = useState(selectedDate ? selectedDate.getMinutes() : Math.ceil(now.getMinutes() / 15) * 15 % 60);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset view when opened
  useEffect(() => {
    if (isOpen) {
      const d = selectedDate || now;
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
      setSelectedHour(d.getHours());
      setSelectedMinute(Math.ceil(d.getMinutes() / 15) % 60 || 0);
    }
  }, [isOpen]);

  const isDateDisabled = useCallback((year: number, month: number, day: number): boolean => {
    const date = new Date(year, month, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date < today;
  }, [now]);

  const isTimeDisabled = useCallback((hour: number, minute: number): boolean => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    selected.setHours(hour, minute, 0, 0);
    return selected < now;
  }, [selectedDate, now]);

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    const date = new Date(viewYear, viewMonth, day, selectedHour, selectedMinute, 0, 0);
    onChange(date.toISOString().slice(0, 16));
  };

  const handleSelectTime = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setHours(hour, minute, 0, 0);
      if (date < now) return;
      onChange(date.toISOString().slice(0, 16));
    }
  };

  const handleConfirm = () => {
    if (!selectedDate) {
      const date = new Date(viewYear, viewMonth, 1, selectedHour, selectedMinute, 0, 0);
      if (date < now) return;
      onChange(date.toISOString().slice(0, 16));
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm transition-colors",
          "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-ring ring-2 ring-ring ring-offset-2"
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        {selectedDate ? (
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">{formatDate(selectedDate)}</p>
            <p className="text-xs text-muted-foreground">{formatTime(selectedHour, selectedMinute)}</p>
          </div>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">{placeholder}</span>
        )}
        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            ×
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-[320px] rounded-xl border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                else { setViewMonth(viewMonth - 1); }
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                else { setViewMonth(viewMonth + 1); }
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 px-4 pt-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">{day}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 px-4 pb-2 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDateDisabled(viewYear, viewMonth, day);
              const isSelected = selectedDate && isSameDay(new Date(viewYear, viewMonth, day), selectedDate);
              const isToday = isSameDay(new Date(viewYear, viewMonth, day), now);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  disabled={disabled}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-colors",
                    disabled && "text-muted-foreground/40 cursor-not-allowed",
                    !disabled && !isSelected && "hover:bg-muted",
                    isToday && !isSelected && "font-bold text-primary",
                    isSelected && "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker */}
          <div className="border-t px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Time</span>
            </div>
            <div className="flex gap-2">
              {/* Hours */}
              <div className="flex-1">
                <div className="max-h-32 overflow-y-auto rounded-lg border bg-background">
                  {hours.map((h) => {
                    const disabled = !!selectedDate && isSameDay(selectedDate, now) && isTimeDisabled(h, selectedMinute);
                    const isSelected = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSelectTime(h, selectedMinute)}
                        disabled={disabled}
                        className={cn(
                          "w-full px-3 py-1.5 text-xs text-center transition-colors",
                          disabled && "text-muted-foreground/40 cursor-not-allowed",
                          !disabled && !isSelected && "hover:bg-muted",
                          isSelected && "bg-primary text-primary-foreground font-medium"
                        )}
                      >
                        {formatTime(h, 0).split(" ")[0]} {h < 12 ? "AM" : "PM"}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Minutes */}
              <div className="flex-1">
                <div className="max-h-32 overflow-y-auto rounded-lg border bg-background">
                  {minutes.map((m) => {
                    const disabled = !!selectedDate && isSameDay(selectedDate, now) && isTimeDisabled(selectedHour, m);
                    const isSelected = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectTime(selectedHour, m)}
                        disabled={disabled}
                        className={cn(
                          "w-full px-3 py-1.5 text-xs text-center transition-colors",
                          disabled && "text-muted-foreground/40 cursor-not-allowed",
                          !disabled && !isSelected && "hover:bg-muted",
                          isSelected && "bg-primary text-primary-foreground font-medium"
                        )}
                      >
                        :{m.toString().padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { onChange(""); setIsOpen(false); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
