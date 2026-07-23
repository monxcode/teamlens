"use client";

import { useState } from "react";
import { Download, FileText, Film, Music, File, Play, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/hooks/use-chat-socket";

interface AttachmentRendererProps {
  attachments: ChatAttachment[];
  onPreview?: (index: number) => void;
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

function ImageAttachment({ attachment, onPreview, index }: { attachment: ChatAttachment; onPreview?: (i: number) => void; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>{attachment.originalName}</span>
      </div>
    );
  }

  return (
    <div className="relative group max-w-xs">
      <button
        onClick={() => onPreview?.(index)}
        className="block rounded-lg overflow-hidden cursor-pointer"
      >
        <div className={cn("relative", !loaded && "bg-muted animate-pulse min-h-[120px]")}>
          <img
            src={attachment.url}
            alt={attachment.originalName}
            className="max-w-full h-auto max-h-[300px] object-cover"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      </button>
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground min-w-0">
          <span className="truncate">{attachment.originalName}</span>
          <span>·</span>
          <span>{formatFileSize(attachment.fileSize)}</span>
          {attachment.width && attachment.height && (
            <>
              <span>·</span>
              <span>{attachment.width}×{attachment.height}</span>
            </>
          )}
        </div>
        <a
          href={attachment.url}
          download={attachment.originalName}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function VideoAttachment({ attachment, onPreview, index }: { attachment: ChatAttachment; onPreview?: (i: number) => void; index: number }) {
  return (
    <div className="max-w-sm">
      <button
        onClick={() => onPreview?.(index)}
        className="relative block rounded-lg overflow-hidden group cursor-pointer"
      >
        <video
          src={attachment.url}
          className="w-full rounded-lg"
          preload="metadata"
          poster=""
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-6 w-6 text-black ml-0.5" fill="black" />
          </div>
        </div>
        {attachment.duration && (
          <span className="absolute bottom-2 right-2 text-[10px] font-medium bg-black/70 text-white px-1.5 py-0.5 rounded">
            {formatDuration(attachment.duration)}
          </span>
        )}
      </button>
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Film className="h-3 w-3" />
          <span>{attachment.originalName}</span>
          <span>·</span>
          <span>{formatFileSize(attachment.fileSize)}</span>
          {attachment.duration && (
            <>
              <span>·</span>
              <span>{formatDuration(attachment.duration)}</span>
            </>
          )}
        </div>
        <a
          href={attachment.url}
          download={attachment.originalName}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function AudioAttachment({ attachment, onPreview, index }: { attachment: ChatAttachment; onPreview?: (i: number) => void; index: number }) {
  return (
    <div className="max-w-xs">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
        <button
          onClick={() => onPreview?.(index)}
          className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 hover:bg-primary/20 transition-colors"
        >
          <Music className="h-5 w-5 text-primary" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{attachment.originalName}</p>
          <audio src={attachment.url} controls className="w-full mt-1 h-8" preload="metadata" />
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{formatFileSize(attachment.fileSize)}</span>
          {attachment.duration && (
            <>
              <span>·</span>
              <span>{formatDuration(attachment.duration)}</span>
            </>
          )}
        </div>
        <a
          href={attachment.url}
          download={attachment.originalName}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function DocumentAttachment({ attachment }: { attachment: ChatAttachment }) {
  const ext = attachment.originalName.split(".").pop()?.toLowerCase();
  const iconColor = {
    pdf: "text-red-500",
    doc: "text-blue-500",
    docx: "text-blue-500",
    xls: "text-green-500",
    xlsx: "text-green-500",
    ppt: "text-orange-500",
    pptx: "text-orange-500",
    zip: "text-yellow-500",
    txt: "text-gray-500",
  }[ext || ""] || "text-muted-foreground";

  return (
    <a
      href={attachment.url}
      download={attachment.originalName}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors max-w-xs group"
    >
      <div className={cn("shrink-0", iconColor)}>
        <FileText className="h-8 w-8" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{attachment.originalName}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatFileSize(attachment.fileSize)} · {ext?.toUpperCase() || "FILE"}
        </p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
    </a>
  );
}

export function AttachmentRenderer({ attachments, onPreview }: AttachmentRendererProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      {attachments.map((attachment, index) => {
        switch (attachment.fileType) {
          case "image":
            return <ImageAttachment key={attachment.id} attachment={attachment} onPreview={onPreview} index={index} />;
          case "video":
            return <VideoAttachment key={attachment.id} attachment={attachment} onPreview={onPreview} index={index} />;
          case "audio":
            return <AudioAttachment key={attachment.id} attachment={attachment} onPreview={onPreview} index={index} />;
          default:
            return <DocumentAttachment key={attachment.id} attachment={attachment} />;
        }
      })}
    </div>
  );
}
