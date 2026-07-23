"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Paperclip, X, CheckCircle2, AlertCircle, Play,
  FileText, Music, Film, Image as ImageIcon, File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadProgress } from "@/hooks/use-file-upload";

interface AttachmentButtonProps {
  onFilesSelected: (files: File[]) => void;
  uploads: UploadProgress[];
  onRemoveUpload: (fileId: string) => void;
  onRetryUpload: (fileId: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/wav", "audio/ogg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
];

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

function getFileType(mimeType: string): "image" | "video" | "audio" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

function getDocIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
  if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="h-8 w-8 text-blue-500" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <FileText className="h-8 w-8 text-green-500" />;
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return <Film className="h-8 w-8 text-orange-500" />;
  if (mimeType.includes("zip")) return <File className="h-8 w-8 text-yellow-500" />;
  return <FileText className="h-8 w-8 text-muted-foreground" />;
}

function UploadCard({ upload, onRemove, onRetry }: {
  upload: UploadProgress;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const fileType = getFileType(upload.file.type);

  return (
    <div className="relative group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md">
      {/* Preview area */}
      <div className="relative aspect-square bg-muted">
        {fileType === "image" && upload.previewUrl ? (
          <img
            src={upload.previewUrl}
            alt={upload.file.name}
            className="w-full h-full object-cover"
          />
        ) : fileType === "video" && upload.previewUrl ? (
          <div className="relative w-full h-full">
            <img
              src={upload.previewUrl}
              alt={upload.file.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
              </div>
            </div>
            {upload.metadata?.duration && (
              <span className="absolute bottom-2 right-2 text-[10px] font-medium bg-black/70 text-white px-1.5 py-0.5 rounded">
                {formatDuration(upload.metadata.duration)}
              </span>
            )}
          </div>
        ) : fileType === "audio" ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-7 w-7 text-primary" />
            </div>
            {upload.previewUrl && (
              <audio src={upload.previewUrl} controls className="w-full max-w-[180px] h-8" />
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
            {getDocIcon(upload.file.type)}
            <span className="text-[10px] font-medium text-muted-foreground uppercase">
              {upload.file.name.split(".").pop()}
            </span>
          </div>
        )}

        {/* Status overlay */}
        {upload.status === "uploading" && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span className="text-xs font-medium text-white">{upload.progress}%</span>
          </div>
        )}

        {upload.status === "complete" && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        )}

        {upload.status === "error" && (
          <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        )}

        {/* Remove button */}
        {upload.status !== "uploading" && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Info area */}
      <div className="px-3 py-2">
        <p className="text-xs font-medium truncate" title={upload.file.name}>
          {upload.file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {formatFileSize(upload.file.size)}
          </span>
          {upload.metadata?.width && upload.metadata?.height && (
            <span className="text-[10px] text-muted-foreground">
              {upload.metadata.width}×{upload.metadata.height}
            </span>
          )}
          {upload.metadata?.duration && fileType !== "video" && (
            <span className="text-[10px] text-muted-foreground">
              {formatDuration(upload.metadata.duration)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {upload.status === "uploading" && (
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}

        {/* Error + retry */}
        {upload.status === "error" && (
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-[10px] text-destructive truncate flex-1">{upload.error}</p>
            <button
              onClick={onRetry}
              className="text-[10px] text-primary font-medium hover:underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AttachmentButton({
  onFilesSelected,
  uploads,
  onRemoveUpload,
  onRetryUpload,
  disabled,
}: AttachmentButtonProps) {
  const fileInputRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter((file) => {
        if (file.size > MAX_FILE_SIZE) return false;
        if (!ACCEPTED_TYPES.includes(file.type)) return false;
        return true;
      });
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      e.target.value = "";
    },
    [onFilesSelected]
  );

  useEffect(() => {
    if (uploads.length > 0 && fileInputRef.current) {
      const rect = fileInputRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.top - 8, left: rect.left });
    } else {
      setPanelPos(null);
    }
  }, [uploads.length]);

  const pendingCount = uploads.filter((u) => u.status === "pending").length;
  const uploadingCount = uploads.filter((u) => u.status === "uploading").length;
  const completedCount = uploads.filter((u) => u.status === "complete").length;

  return (
    <>
      <button
        ref={fileInputRef}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ACCEPTED_TYPES.join(",");
          input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
          input.click();
        }}
        disabled={disabled}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title="Attach files"
      >
        <Paperclip className="h-5 w-5" />
      </button>

      {uploads.length > 0 && panelPos && createPortal(
        <div
          className="fixed z-[9999] w-[380px] max-h-[480px] rounded-xl border bg-card shadow-2xl overflow-hidden flex flex-col"
          style={{ bottom: `${window.innerHeight - panelPos.top + 8}px`, left: `${panelPos.left}px` }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
            <div>
              <p className="text-sm font-semibold">
                {uploadingCount > 0
                  ? `Uploading ${uploadingCount} file${uploadingCount > 1 ? "s" : ""}...`
                  : pendingCount > 0
                  ? `${pendingCount} file${pendingCount > 1 ? "s" : ""} ready`
                  : `${completedCount} file${completedCount > 1 ? "s" : ""} uploaded`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {uploads.length} total • Click attach to send
              </p>
            </div>
          </div>

          {/* Grid of preview cards */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {uploads.map((upload) => (
                <UploadCard
                  key={upload.fileId}
                  upload={upload}
                  onRemove={() => onRemoveUpload(upload.fileId)}
                  onRetry={() => onRetryUpload(upload.fileId)}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
