"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut,
  Play, Pause, Volume2, VolumeX, FileText, Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/hooks/use-chat-socket";

interface LightboxProps {
  attachments: ChatAttachment[];
  initialIndex: number;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Lightbox({ attachments, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const attachment = attachments[currentIndex];
  const hasMultiple = attachments.length > 1;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < attachments.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex, attachments.length]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5));
  const handleResetZoom = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape": onClose(); break;
        case "ArrowLeft": handlePrev(); break;
        case "ArrowRight": handleNext(); break;
        case "+":
        case "=": handleZoomIn(); break;
        case "-": handleZoomOut(); break;
        case "0": handleResetZoom(); break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, handlePrev, handleNext]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!attachment) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-3 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {attachment.originalName}
          </p>
          <span className="text-xs text-white/60">
            {formatFileSize(attachment.fileSize)}
          </span>
          {hasMultiple && (
            <span className="text-xs text-white/60">
              {currentIndex + 1} / {attachments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {attachment.fileType === "image" && (
            <>
              <button onClick={handleZoomOut} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-white/60 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <ZoomIn className="h-4 w-4" />
              </button>
            </>
          )}
          <a
            href={attachment.url}
            download={attachment.originalName}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleResetZoom}
      >
        {attachment.fileType === "image" && (
          <img
            src={attachment.url}
            alt={attachment.originalName}
            className={cn(
              "max-w-full max-h-full object-contain transition-transform",
              isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-zoom-in"
            )}
            style={{ transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)` }}
            draggable={false}
          />
        )}

        {attachment.fileType === "video" && (
          <div className="max-w-4xl w-full mx-4">
            <video
              src={attachment.url}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
          </div>
        )}

        {attachment.fileType === "audio" && (
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center">
              <Music className="h-12 w-12 text-white/60" />
            </div>
            <audio src={attachment.url} controls autoPlay className="w-full max-w-md" />
          </div>
        )}

        {attachment.fileType === "document" && (
          <div className="flex flex-col items-center gap-4 p-8">
            <FileText className="h-16 w-16 text-white/40" />
            <p className="text-lg text-white/80 font-medium">{attachment.originalName}</p>
            <p className="text-sm text-white/50">{formatFileSize(attachment.fileSize)}</p>
            <a
              href={attachment.url}
              download={attachment.originalName}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {hasMultiple && currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasMultiple && currentIndex < attachments.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>,
    document.body
  );
}
