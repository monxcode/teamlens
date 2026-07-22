"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫡", "🤫", "🫠", "🤥", "😶", "🫥", "😐", "😑", "🫤", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🫨", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄"],
  },
  {
    name: "Objects",
    emojis: ["💯", "🔥", "⭐", "🌟", "✨", "💫", "🎯", "🏆", "🥇", "🥈", "🥉", "🎖️", "🏅", "🎗️", "🎪", "🎨", "🎭", "🎤", "🎧", "🎼", "🎵", "🎶", "🎹", "🥁", "🎷", "🎸", "🎺", "🎻", "🪕", "🎲", "♟️", "🎳", "🎮", "🕹️", "🎰", "🧩"],
  },
  {
    name: "Symbols",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💕", "💞", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚕️"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function EmojiPicker({ onSelect, onClose, anchorRef }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placedAbove, setPlacedAbove] = useState(true);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const pickerWidth = 288;
    const pickerHeight = 320;
    const gap = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = viewportH - rect.bottom;

    let top: number;
    let above = true;

    if (spaceAbove >= pickerHeight + gap) {
      top = rect.top - pickerHeight - gap;
      above = true;
    } else if (spaceBelow >= pickerHeight + gap) {
      top = rect.bottom + gap;
      above = false;
    } else {
      top = Math.max(gap, Math.min(rect.top - pickerHeight - gap, viewportH - pickerHeight - gap));
      above = true;
    }

    let left = rect.left;
    if (left + pickerWidth > viewportW - gap) {
      left = viewportW - pickerWidth - gap;
    }
    if (left < gap) {
      left = gap;
    }

    setPosition({ top, left });
    setPlacedAbove(above);
  }, [anchorRef]);

  useEffect(() => {
    updatePosition();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    function handleScroll() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [onClose, updatePosition, anchorRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      className="fixed w-72 rounded-xl border bg-card shadow-xl z-[9999] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="max-h-60 overflow-y-auto p-2 space-y-2">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="text-[10px] font-medium text-muted-foreground px-1 py-0.5 uppercase tracking-wider">
              {cat.name}
            </p>
            <div className="flex flex-wrap gap-0.5">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
