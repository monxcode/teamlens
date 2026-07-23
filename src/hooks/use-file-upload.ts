"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface UploadProgress {
  fileId: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
  attachmentId?: string;
  url?: string;
  previewUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
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

function getFileType(mimeType: string): "image" | "video" | "audio" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

function generatePreview(file: File): Promise<{ previewUrl: string; metadata?: { width?: number; height?: number; duration?: number } }> {
  return new Promise((resolve) => {
    const type = getFileType(file.type);

    if (type === "image") {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({
          previewUrl: url,
          metadata: { width: img.naturalWidth, height: img.naturalHeight },
        });
      };
      img.onerror = () => resolve({ previewUrl: url });
      img.src = url;
      return;
    }

    if (type === "video") {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        // Create thumbnail from video
        video.currentTime = Math.min(1, video.duration / 4);
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve({
              previewUrl: thumbUrl,
              metadata: {
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration,
              },
            });
          } else {
            resolve({
              previewUrl: url,
              metadata: { width: video.videoWidth, height: video.videoHeight, duration: video.duration },
            });
          }
          URL.revokeObjectURL(url);
        };
      };
      video.onerror = () => resolve({ previewUrl: url });
      video.src = url;
      return;
    }

    if (type === "audio") {
      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        resolve({
          previewUrl: url,
          metadata: { duration: audio.duration },
        });
      };
      audio.onerror = () => resolve({ previewUrl: url });
      audio.src = url;
      return;
    }

    // Documents — no preview
    resolve({ previewUrl: "" });
  });
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((u) => {
        if (u.previewUrl && u.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(u.previewUrl);
        }
      });
    };
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    const newUploads: UploadProgress[] = [];

    for (const file of files) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { previewUrl, metadata } = await generatePreview(file);

      newUploads.push({
        fileId,
        file,
        progress: 0,
        status: "pending",
        previewUrl,
        metadata,
      });
    }

    setUploads((prev) => [...prev, ...newUploads]);
    return newUploads;
  }, []);

  const uploadFile = useCallback(
    async (fileId: string, teamId: string): Promise<UploadedAttachment | null> => {
      const upload = uploadsRef.current.find((u) => u.fileId === fileId);
      if (!upload) return null;

      setUploads((prev) =>
        prev.map((u) => (u.fileId === fileId ? { ...u, status: "uploading", progress: 0 } : u))
      );

      try {
        const formData = new FormData();
        formData.append("file", upload.file);
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
      } catch {
        return null;
      }
    },
    []
  );

  const uploadAllPending = useCallback(
    async (teamId: string): Promise<UploadedAttachment[]> => {
      const pending = uploadsRef.current.filter((u) => u.status === "pending");
      const results = await Promise.all(
        pending.map((u) => uploadFile(u.fileId, teamId))
      );
      return results.filter((r): r is UploadedAttachment => r !== null);
    },
    [uploadFile]
  );

  const removeUpload = useCallback((fileId: string) => {
    setUploads((prev) => {
      const upload = prev.find((u) => u.fileId === fileId);
      if (upload?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return prev.filter((u) => u.fileId !== fileId);
    });
  }, []);

  const clearUploads = useCallback(() => {
    uploadsRef.current.forEach((u) => {
      if (u.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(u.previewUrl);
      }
    });
    setUploads([]);
  }, []);

  const retryUpload = useCallback(
    async (fileId: string, teamId: string) => {
      return uploadFile(fileId, teamId);
    },
    [uploadFile]
  );

  return {
    uploads,
    addFiles,
    uploadFile,
    uploadAllPending,
    removeUpload,
    clearUploads,
    retryUpload,
  };
}
