import { NextRequest } from "next/server";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { uploadBufferToVPS, type UploadFolder } from "@/lib/sftp";

// Must run on the Node.js runtime (uses the ssh2 SFTP client)
export const runtime = "nodejs";

/* ─── Allowed media types ─────────────────────────────────────────────────────── */
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png",
  "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg",
  "image/avif": ".avif", "image/bmp": ".bmp",
};
const VIDEO_EXT: Record<string, string> = {
  "video/mp4": ".mp4", "video/webm": ".webm", "video/ogg": ".ogv",
  "video/quicktime": ".mov", "video/x-matroska": ".mkv", "video/x-msvideo": ".avi",
};

const MAX_IMAGE = 70 * 1024 * 1024;   // 70 MB
const MAX_VIDEO = 70 * 1024 * 1024;   // 70 MB

// Existing folders under /var/www/uploads.
const IMAGE_FOLDERS: UploadFolder[] = ["banners", "brands", "categories", "products", "users"];

const fail = (message: string, status = 400) =>
  Response.json({ success: false, message }, { status });

const sanitizeBase = (name: string) =>
  name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "file";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid upload. Send multipart/form-data with a 'file' field.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("No file provided.");

  const type = (file.type || "").toLowerCase();
  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  if (!isImage && !isVideo) {
    return fail("Only image and video files are allowed.");
  }

  // Resolve a safe extension from the MIME type (falls back to the original ext)
  const ext =
    (isImage ? IMAGE_EXT[type] : VIDEO_EXT[type]) ||
    (path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || (isVideo ? ".mp4" : ".img"));

  const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) {
    return fail(`File too large. Max ${Math.round(max / 1024 / 1024)}MB for ${isVideo ? "videos" : "images"}.`);
  }

  // Videos always go in /videos; images go in whichever existing folder the
  // caller names via the 'folder' field (defaults to 'products').
  const requestedFolder = String(form.get("folder") || "").toLowerCase() as UploadFolder;
  const folder: UploadFolder = isVideo
    ? "videos"
    : IMAGE_FOLDERS.includes(requestedFolder) ? requestedFolder : "products";

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeBase(file.name)}${ext}`;

  let url: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    url = await uploadBufferToVPS(buffer, folder, filename);
  } catch (err) {
    console.error("VPS upload failed:", err);
    return fail("Could not upload the file to the server. Please try again.", 500);
  }

  return Response.json({
    success: true,
    url,
    name: filename,
    folder,
    kind: isVideo ? "video" : "image",
    type,
    size: file.size,
  });
}
