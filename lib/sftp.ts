import { Client, type SFTPWrapper } from "ssh2";

/*
 * Uploads files to the Hostinger VPS over SFTP, so media always lands on
 * 200.97.164.140 (in /var/www/uploads, which nginx serves at /uploads/*)
 * regardless of where this Next.js app itself is running — local dev machine
 * or the VPS itself.
 *
 * ssh2 has a native binary (sshcrypto.node) that webpack can't bundle, so
 * it's marked as a server-external package in next.config.ts — that's what
 * keeps `next build` from failing, not avoiding ssh2 altogether.
 */

const VPS_HOST = "200.97.164.140";
const VPS_PORT = 22;
const VPS_USERNAME = "root";
// Secret — never hardcode a root password in source. Set VPS_SSH_PASSWORD in .env.local.
const VPS_PASSWORD = process.env.VPS_SSH_PASSWORD;

export const UPLOAD_REMOTE_BASE = "/var/www/uploads";
export const UPLOAD_PUBLIC_URL = "http://200.97.164.140/uploads";

/** Folders that already exist on the VPS under /var/www/uploads. */
export type UploadFolder = "banners" | "brands" | "categories" | "products" | "users" | "videos";

function connect(): Promise<Client> {
  return new Promise((resolve, reject) => {
    if (!VPS_PASSWORD) {
      reject(new Error("VPS_SSH_PASSWORD is not set. Add it to .env.local."));
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
    // ENOENT-safe: if it already exists this errors harmlessly — either way we resolve.
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
 * Uploads a buffer to /var/www/uploads/<folder>/<filename> on the VPS
 * and returns its public URL (http://200.97.164.140/uploads/<folder>/<filename>).
 */
export async function uploadBufferToVPS(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string
): Promise<string> {
  const conn = await connect();
  try {
    const sftp = await openSftp(conn);
    const remoteDir = `${UPLOAD_REMOTE_BASE}/${folder}`;
    await mkdirIfMissing(sftp, remoteDir);
    const remotePath = `${remoteDir}/${filename}`;
    await writeRemoteFile(sftp, remotePath, buffer);
    return `${UPLOAD_PUBLIC_URL}/${folder}/${filename}`;
  } finally {
    conn.end();
  }
}

/** Deletes a previously uploaded file, given its folder + filename. Best-effort. */
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
