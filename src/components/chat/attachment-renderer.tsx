"use client";

import { useState } from "react";
import { Download, FileText, Film, Music, File } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/hooks/use-chat-socket";

interface AttachmentRendererProps {
  attachments: ChatAttachment[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageAttachment({ attachment }: { attachment: ChatAttachment }) {
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
    <div className="relative group">
      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
        <div className={cn("rounded-lg overflow-hidden max-w-xs", !loaded && "bg-muted animate-pulse min-h-[120px]")}>
          <img
            src={attachment.url}
            alt={attachment.originalName}
            className="max-w-full h-auto max-h-[300px] object-cover"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
        </div>
      </a>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{attachment.originalName}</span>
        <span>•</span>
        <span>{formatFileSize(attachment.fileSize)}</span>
      </div>
    </div>
  );
}

function VideoAttachment({ attachment }: { attachment: ChatAttachment }) {
  return (
    <div className="max-w-sm">
      <video
        src={attachment.url}
        controls
        className="w-full rounded-lg"
        preload="metadata"
      />
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Film className="h-3 w-3" />
        <span>{attachment.originalName}</span>
        <span>•</span>
        <span>{formatFileSize(attachment.fileSize)}</span>
      </div>
    </div>
  );
}

function AudioAttachment({ attachment }: { attachment: ChatAttachment }) {
  return (
    <div className="max-w-xs">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
        <Music className="h-8 w-8 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{attachment.originalName}</p>
          <audio src={attachment.url} controls className="w-full mt-1" preload="metadata" />
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{formatFileSize(attachment.fileSize)}</span>
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
        <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
    </a>
  );
}

export function AttachmentRenderer({ attachments }: AttachmentRendererProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      {attachments.map((attachment) => {
        switch (attachment.fileType) {
          case "image":
            return <ImageAttachment key={attachment.id} attachment={attachment} />;
          case "video":
            return <VideoAttachment key={attachment.id} attachment={attachment} />;
          case "audio":
            return <AudioAttachment key={attachment.id} attachment={attachment} />;
          default:
            return <DocumentAttachment key={attachment.id} attachment={attachment} />;
        }
      })}
    </div>
  );
}
