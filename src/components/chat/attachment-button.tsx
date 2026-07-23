"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Paperclip, X, CheckCircle2 } from "lucide-react";
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

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📽️";
  if (mimeType.includes("zip")) return "📦";
  return "📎";
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

  // Position the panel above the button
  useEffect(() => {
    if (uploads.length > 0 && fileInputRef.current) {
      const rect = fileInputRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.top - 8,
        left: rect.left,
      });
    } else {
      setPanelPos(null);
    }
  }, [uploads.length]);

  const activeUploads = uploads.filter((u) => u.status === "uploading");

  return (
    <>
      <button
        ref={fileInputRef}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ACCEPTED_TYPES.join(",");
          input.onchange = (e) => {
            const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileSelect(event);
          };
          input.click();
        }}
        disabled={disabled || activeUploads.length > 0}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title="Attach files"
      >
        <Paperclip className="h-5 w-5" />
      </button>

      {/* Upload Progress Panel — Portaled to body to escape overflow containers */}
      {uploads.length > 0 && panelPos && createPortal(
        <div
          className="fixed z-[9999] w-72 rounded-xl border bg-card shadow-xl overflow-hidden"
          style={{ bottom: `${window.innerHeight - panelPos.top + 8}px`, left: `${panelPos.left}px` }}
        >
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-medium text-muted-foreground">
              {activeUploads.length > 0
                ? `Uploading ${activeUploads.length} file${activeUploads.length > 1 ? "s" : ""}...`
                : "Uploads"}
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {uploads.map((upload) => (
              <div
                key={upload.fileId}
                className="flex items-center gap-2 px-3 py-2 border-b last:border-0"
              >
                <span className="text-lg shrink-0">{getFileIcon(upload.file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{upload.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(upload.file.size)}
                  </p>
                  {upload.status === "uploading" && (
                    <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {upload.status === "error" && (
                    <p className="text-[10px] text-destructive mt-0.5">{upload.error}</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {upload.status === "uploading" && (
                    <span className="text-[10px] text-muted-foreground">{upload.progress}%</span>
                  )}
                  {upload.status === "complete" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {upload.status === "error" && (
                    <button
                      onClick={() => onRetryUpload(upload.fileId)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Retry
                    </button>
                  )}
                  {upload.status !== "uploading" && (
                    <button
                      onClick={() => onRemoveUpload(upload.fileId)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
