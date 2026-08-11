import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { requireAdmin } from "@/app/server/adminGuard";
import { uploadBufferToVPS, isUploadConfigured, type UploadFolder } from "@/app/server/sftp";

// Must run on the Node.js runtime — the SFTP client is a native module.
export const runtime = "nodejs";

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
};

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
  "video/quicktime": ".mov",
  "video/x-matroska": ".mkv",
  "video/x-msvideo": ".avi",
};

const MAX_BYTES = 70 * 1024 * 1024; // 70 MB, images and video alike

/** Image destinations that exist on the VPS. Video always goes to `videos`. */
const IMAGE_FOLDERS: UploadFolder[] = ["banners", "brands", "categories", "products", "users"];

const fail = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

const sanitizeBase = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "file";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid upload. Send multipart/form-data with a 'file' field.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("No file provided.");

  const type = (file.type || "").toLowerCase();
  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  if (!isImage && !isVideo) return fail("Only image and video files are allowed.");

  if (file.size > MAX_BYTES) {
    return fail(`File too large. Maximum ${Math.round(MAX_BYTES / 1024 / 1024)}MB.`);
  }

  // Prefer an extension derived from the MIME type; fall back to the original.
  const ext =
    (isImage ? IMAGE_EXT[type] : VIDEO_EXT[type]) ||
    path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") ||
    (isVideo ? ".mp4" : ".img");

  const requested = String(form.get("folder") || "").toLowerCase() as UploadFolder;
  const folder: UploadFolder = isVideo
    ? "videos"
    : IMAGE_FOLDERS.includes(requested)
      ? requested
      : "products";

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeBase(file.name)}${ext}`;

  // Checked after validation so a malformed request still gets its own 400
  // rather than being masked by the service being unconfigured.
  if (!isUploadConfigured()) {
    return fail("Uploads aren't configured — VPS_SSH_PASSWORD is missing from .env.", 503);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadBufferToVPS(buffer, folder, filename);
    return NextResponse.json({
      success: true,
      url,
      name: filename,
      folder,
      kind: isVideo ? "video" : "image",
      type,
      size: file.size,
    });
  } catch (err) {
    console.error("VPS upload failed:", err);
    return fail("Could not upload the file to the server. Please try again.", 500);
  }
}
