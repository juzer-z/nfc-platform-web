import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { requireAdminApiAccess, validateSameOrigin } from "@/lib/server-auth";
import { uploadImageToStorage } from "@/lib/uploads";

const MAX_PHOTO_BYTES = 400 * 1024; // 400 KB
const MAX_LOGO_BYTES = 200 * 1024; // 200 KB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "";
}

function matchesFileSignature(bytes: Buffer, mime: string) {
  if (mime === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mime === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mime === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const originError = validateSameOrigin(req);
    if (originError) return originError;

    const auth = await requireAdminApiAccess();
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // "photo" | "logo"
    if (type !== "photo" && type !== "logo") {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP allowed" },
        { status: 400 }
      );
    }

    const maxBytes = type === "photo" ? MAX_PHOTO_BYTES : MAX_LOGO_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error:
            type === "photo"
              ? "User photo too large (max 400 KB)"
              : "Company logo too large (max 200 KB)",
        },
        { status: 413 }
      );
    }

    const ext = extFromMime(file.type);
    if (!ext) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(bytes, file.type)) {
      return NextResponse.json(
        { error: "File content does not match its type" },
        { status: 400 }
      );
    }

    const name = `${type}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    const cloudUrl = await uploadImageToStorage({
      bytes,
      mimeType: file.type,
      filename: name,
      type,
    });

    let publicUrl = cloudUrl;
    if (!publicUrl) {
      // Local filesystem storage remains available for development.
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const fullPath = path.join(uploadDir, name);
      await fs.writeFile(fullPath, bytes);
      publicUrl = `/uploads/${name}`;
    }

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
