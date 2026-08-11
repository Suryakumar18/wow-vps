import "server-only";
import { Client, type SFTPWrapper } from "ssh2";

/*
 * Uploads media to the Hostinger VPS over SFTP, so files always land on
 * 200.97.164.140 (in /var/www/uploads, which nginx serves at /uploads/*)
 * regardless of where this app runs — local dev machine or the VPS itself.
 *
 * ssh2 has a native binary (sshcrypto.node) webpack can't bundle, so it's
 * listed under `serverExternalPackages` in next.config.ts — that's what keeps
 * `next build` working, not avoiding ssh2.
 */

const VPS_HOST = process.env.VPS_SSH_HOST || "200.97.164.140";
const VPS_PORT = Number(process.env.VPS_SSH_PORT || 22);
const VPS_USERNAME = process.env.VPS_SSH_USER || "root";
// Secret — never hardcode credentials in source. Set VPS_SSH_PASSWORD in .env.
const VPS_PASSWORD = process.env.VPS_SSH_PASSWORD;

export const UPLOAD_REMOTE_BASE = "/var/www/uploads";

/**
 * Where uploaded files are served from, as browsers see them.
 *
 * The same nginx that runs the storefront serves /var/www/uploads at
 * /uploads/* on the site's own https domain, so when a public https origin
 * is configured the API hands out THAT url — a plain-http bare-IP url gets
 * blocked as mixed content the moment it renders inside the https admin or
 * storefront. Local dev (no https origin configured) keeps the http IP,
 * which its own http pages load freely.
 */
export function uploadPublicBase(): string {
  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
  if (origin.startsWith("https://")) return `${origin}/uploads`;
  return `http://${VPS_HOST}/uploads`;
}

/** Folders under /var/www/uploads on the VPS. */
export type UploadFolder = "banners" | "brands" | "categories" | "products" | "users" | "videos";

export const isUploadConfigured = () => Boolean(VPS_PASSWORD);

function connect(): Promise<Client> {
  return new Promise((resolve, reject) => {
    if (!VPS_PASSWORD) {
      reject(new Error("VPS_SSH_PASSWORD is not set. Add it to .env."));
      return;
    }
    const conn = new Client();
    conn
      .on("ready", () => resolve(conn))
      .on("error", (err) => reject(err))
      .connect({
        host: VPS_HOST,
        port: VPS_PORT,
        username: VPS_USERNAME,
        password: VPS_PASSWORD,
        readyTimeout: 20000,
      });
  });
}

function openSftp(conn: Client): Promise<SFTPWrapper> {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => (err ? reject(err) : resolve(sftp)));
  });
}

function mkdirIfMissing(sftp: SFTPWrapper, dir: string): Promise<void> {
  return new Promise((resolve) => {
    // If it already exists this errors harmlessly — either way we continue.
    sftp.mkdir(dir, () => resolve());
  });
}

function writeRemoteFile(sftp: SFTPWrapper, remotePath: string, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = sftp.createWriteStream(remotePath, { mode: 0o644 });
    stream.on("close", () => resolve());
    stream.on("error", reject);
    stream.end(buffer);
  });
}

/**
 * Uploads a buffer to /var/www/uploads/<folder>/<filename> and returns its
 * public URL (http://<host>/uploads/<folder>/<filename>).
 */
export async function uploadBufferToVPS(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string,
): Promise<string> {
  const conn = await connect();
  try {
    const sftp = await openSftp(conn);
    const remoteDir = `${UPLOAD_REMOTE_BASE}/${folder}`;
    await mkdirIfMissing(sftp, remoteDir);
    await writeRemoteFile(sftp, `${remoteDir}/${filename}`, buffer);
    return `${uploadPublicBase()}/${folder}/${filename}`;
  } finally {
    conn.end();
  }
}

/** Deletes a previously uploaded file. Best-effort — a missing file is not an error. */
export async function deleteFromVPS(folder: UploadFolder, filename: string): Promise<void> {
  const conn = await connect();
  try {
    const sftp = await openSftp(conn);
    await new Promise<void>((resolve) => {
      sftp.unlink(`${UPLOAD_REMOTE_BASE}/${folder}/${filename}`, () => resolve());
    });
  } finally {
    conn.end();
  }
}
