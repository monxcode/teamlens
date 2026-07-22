"use client";

import { useRef, useEffect, useCallback, useLayoutEffect, useState } from "react";
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

const GAP = 4;
const VIEWPORT_PADDING = 4;

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function EmojiPicker({ onSelect, onClose, anchorRef }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Measure the ACTUAL rendered picker and anchor, then compute position.
  // Runs via useLayoutEffect so it fires after DOM commit but before paint.
  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const picker = ref.current;
    if (!anchor || !picker) return;

    const anchorRect = anchor.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Place picker so its bottom edge is GAP above the anchor's top edge
    let top = anchorRect.top - pickerRect.height - GAP;

    // Flip below if not enough room above
    if (top < VIEWPORT_PADDING) {
      top = anchorRect.bottom + GAP;
    }

    // Right-align picker's right edge to anchor's right edge, clamped to viewport
    let left = anchorRect.right - pickerRect.width;
    left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportW - pickerRect.width - VIEWPORT_PADDING));

    setPos({ top, left });
  }, [anchorRef]);

  // Position after first render (visibility: hidden during measurement)
  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  // Reposition on scroll / resize
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [onClose, updatePosition, anchorRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      className="fixed w-72 rounded-xl border bg-card shadow-xl z-[9999] overflow-hidden"
      style={
        pos
          ? { top: pos.top, left: pos.left }
          : { visibility: "hidden", top: 0, left: 0 }
      }
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
