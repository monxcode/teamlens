"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "./button";
import { Modal } from "./modal";
import { Avatar } from "./avatar";
import { Upload, X, Crop, Check, Loader2, ImageIcon } from "lucide-react";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onUploadComplete: (url: string) => void;
  onDeleteComplete: () => void;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  onUploadComplete,
  onDeleteComplete,
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Allowed: JPG, JPEG, PNG, WEBP";
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Invalid file extension";
    }
    if (file.size > MAX_SIZE) {
      return `File size must be less than ${MAX_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const getCroppedImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      const img = new Image();
      img.onload = () => {
        if (!canvas) return reject("No canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No context");

        const scaleX = img.width / size;
        const scaleY = img.height / size;
        const srcX = (img.width - size) / 2 + cropPosition.x / zoom;
        const srcY = (img.height - size) / 2 + cropPosition.y / zoom;
        const srcSize = size / zoom;

        ctx.drawImage(
          img,
          srcX, srcY, srcSize, srcSize,
          0, 0, 400, 400
        );

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Failed to create blob");
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => reject("Failed to load image");
      img.src = preview || "";
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      const croppedBlob = await getCroppedImage();
      const formData = new FormData();
      const ext = selectedFile.name.split(".").pop();
      const fileName = `avatar.${ext}`;
      formData.append("file", new File([croppedBlob], fileName, { type: "image/jpeg" }));

      const token = localStorage.getItem("pulse_token");
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      onUploadComplete(data.avatar.url);
      setShowCropModal(false);
      setPreview(null);
      setSelectedFile(null);
      setCropPosition({ x: 0, y: 0 });
      setZoom(1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove your profile picture?")) return;

    try {
      const token = localStorage.getItem("pulse_token");
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        onDeleteComplete();
      }
    } catch {
      setError("Failed to remove avatar");
    }
  };

  const handleCancel = () => {
    setShowCropModal(false);
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    setCropPosition({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <Avatar
          name={userName}
          src={currentAvatarUrl}
          size="xl"
          className="h-24 w-24 text-2xl"
        />
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {currentAvatarUrl ? "Change Photo" : "Upload Photo"}
            </Button>
            {currentAvatarUrl && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WEBP. Max 5MB.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <ImageIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragging ? "Drop your image here" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG, WEBP up to 5MB
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Crop Modal */}
      <Modal
        open={showCropModal}
        onClose={handleCancel}
        title="Crop Profile Photo"
      >
        <div className="space-y-4">
          {preview && (
            <div className="relative">
              <canvas ref={canvasRef} className="hidden" />
              <div className="relative w-full aspect-square max-h-80 overflow-hidden rounded-xl bg-muted">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoom}) translate(${cropPosition.x}px, ${cropPosition.y}px)`,
                  }}
                  draggable={false}
                />
                <div className="absolute inset-0 border-2 border-white/50 rounded-xl pointer-events-none" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Photo
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
