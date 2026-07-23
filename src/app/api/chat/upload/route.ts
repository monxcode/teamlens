import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "public", "chat-files");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const FILE_CATEGORIES: Record<string, string[]> = {
  image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
  ],
};

function getFileCategory(mimeType: string): string {
  for (const [category, types] of Object.entries(FILE_CATEGORIES)) {
    if (types.includes(mimeType)) return category;
  }
  return "document";
}

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const teamId = formData.get("teamId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    // Validate team access
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.role === "super_admin" || user.role === "admin";
    if (!isAdmin) {
      const membership = await db.teamMember.findUnique({
        where: { userId_teamId: { userId: payload.userId, teamId } },
      });
      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 50MB." }, { status: 400 });
    }

    // Validate file type
    const category = getFileCategory(file.type);
    if (category === "document" && !Object.values(FILE_CATEGORIES).flat().includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Ensure upload directory exists
    const teamDir = path.join(UPLOAD_DIR, teamId);
    await mkdir(teamDir, { recursive: true });

    // Generate safe filename
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${payload.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(teamDir, fileName);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Save to database (messageId is set later when message is created)
    const attachment = await db.chatAttachment.create({
      data: {
        fileName,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileType: category,
        url: `/chat-files/${teamId}/${fileName}`,
      },
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        fileType: attachment.fileType,
        url: attachment.url,
      },
    });
  } catch (error) {
    console.error("Chat upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
