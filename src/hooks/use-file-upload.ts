"use client";

import { useState, useCallback } from "react";

export interface UploadProgress {
  fileId: string;
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
  attachmentId?: string;
  url?: string;
}

export interface UploadedAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const uploadFile = useCallback(
    async (file: File, teamId: string): Promise<UploadedAttachment | null> => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Add to uploads with progress
      setUploads((prev) => [
        ...prev,
        { fileId, file, progress: 0, status: "uploading" },
      ]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("teamId", teamId);

        const token = sessionStorage.getItem("pulse_token");
        const xhr = new XMLHttpRequest();

        const result = await new Promise<UploadedAttachment>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) =>
                prev.map((u) => (u.fileId === fileId ? { ...u, progress } : u))
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              setUploads((prev) =>
                prev.map((u) =>
                  u.fileId === fileId
                    ? { ...u, status: "complete", progress: 100, attachmentId: data.attachment.id, url: data.attachment.url }
                    : u
                )
              );
              resolve(data.attachment);
            } else {
              const data = JSON.parse(xhr.responseText);
              setUploads((prev) =>
                prev.map((u) =>
                  u.fileId === fileId
                    ? { ...u, status: "error", error: data.error || "Upload failed" }
                    : u
                )
              );
              reject(new Error(data.error || "Upload failed"));
            }
          });

          xhr.addEventListener("error", () => {
            setUploads((prev) =>
              prev.map((u) =>
                u.fileId === fileId
                  ? { ...u, status: "error", error: "Network error" }
                  : u
              )
            );
            reject(new Error("Network error"));
          });

          xhr.open("POST", "/api/chat/upload");
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });

        return result;
      } catch (error) {
        return null;
      }
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[], teamId: string): Promise<UploadedAttachment[]> => {
      const results = await Promise.all(
        files.map((file) => uploadFile(file, teamId))
      );
      return results.filter((r): r is UploadedAttachment => r !== null);
    },
    [uploadFile]
  );

  const removeUpload = useCallback((fileId: string) => {
    setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const retryUpload = useCallback(
    async (fileId: string, teamId: string) => {
      const upload = uploads.find((u) => u.fileId === fileId);
      if (!upload) return null;

      setUploads((prev) =>
        prev.map((u) =>
          u.fileId === fileId ? { ...u, status: "uploading", progress: 0, error: undefined } : u
        )
      );

      return uploadFile(upload.file, teamId);
    },
    [uploads, uploadFile]
  );

  return {
    uploads,
    uploadFile,
    uploadFiles,
    removeUpload,
    clearUploads,
    retryUpload,
  };
}
