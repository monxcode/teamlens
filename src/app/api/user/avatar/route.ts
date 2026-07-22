import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

function generateSafeFileName(userId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  return `${userId}-${timestamp}${ext}`;
}

function validateFileType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return Response.json(
        { error: "Invalid file type. Allowed: JPG, JPEG, PNG, WEBP" },
        { status: 400 }
      );
    }

    // Validate file extension matches MIME type
    const ext = path.extname(file.name).toLowerCase();
    const mimeToExt: Record<string, string[]> = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    };
    const allowedExts = mimeToExt[file.type] || [];
    if (!allowedExts.includes(ext)) {
      return Response.json(
        { error: "File extension does not match content type" },
        { status: 400 }
      );
    }

    // Ensure avatar directory exists
    if (!existsSync(AVATAR_DIR)) {
      await mkdir(AVATAR_DIR, { recursive: true });
    }

    // Get current user to check for existing avatar
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { avatarUrl: true },
    });

    // Delete old avatar if exists
    if (user?.avatarUrl) {
      const oldFileName = path.basename(user.avatarUrl);
      const oldFilePath = path.join(AVATAR_DIR, oldFileName);
      if (existsSync(oldFilePath)) {
        await unlink(oldFilePath).catch(() => {});
      }
    }

    // Generate safe file name
    const safeFileName = generateSafeFileName(payload.userId, file.name);
    const filePath = path.join(AVATAR_DIR, safeFileName);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate it's actually an image by checking magic bytes
    const isImage = validateImageBuffer(buffer, file.type);
    if (!isImage) {
      return Response.json(
        { error: "File is not a valid image" },
        { status: 400 }
      );
    }

    await writeFile(filePath, buffer);

    // Update user record
    const avatarUrl = `/avatars/${safeFileName}`;
    await db.user.update({
      where: { id: payload.userId },
      data: {
        avatarUrl,
        avatarFileName: file.name,
        avatarMimeType: file.type,
        avatarSize: file.size,
        avatarUploadedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      avatar: {
        url: avatarUrl,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return Response.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      const fileName = path.basename(user.avatarUrl);
      const filePath = path.join(AVATAR_DIR, fileName);
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => {});
      }
    }

    await db.user.update({
      where: { id: payload.userId },
      data: {
        avatarUrl: null,
        avatarFileName: null,
        avatarMimeType: null,
        avatarSize: null,
        avatarUploadedAt: null,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return Response.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}

function validateImageBuffer(buffer: Buffer, expectedType: string): boolean {
  if (buffer.length < 4) return false;

  // Check magic bytes
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const webp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (expectedType === "image/jpeg") return jpeg;
  if (expectedType === "image/png") return png;
  if (expectedType === "image/webp") return webp;

  return false;
}
