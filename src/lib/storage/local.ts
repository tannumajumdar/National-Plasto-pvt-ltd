import "server-only";

import { randomBytes } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 5);
const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? "public/uploads";

export interface StoredFile {
  /** Public URL, e.g. /uploads/products/atom-2-ft-a1b2c3.webp */
  url: string;
  bytes: number;
}

export class UploadError extends Error {}

/**
 * Writes an uploaded image under public/uploads and returns its public URL.
 *
 * Filenames are generated, never taken from user input, so a crafted name
 * cannot traverse outside the upload directory or overwrite existing files.
 */
export async function storeImage(
  file: File,
  folder = "products",
  slugHint?: string,
): Promise<StoredFile> {
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    throw new UploadError(
      `Unsupported file type "${file.type || "unknown"}". Use JPG, PNG, WebP, AVIF or GIF.`,
    );
  }

  if (file.size > MAX_MB * 1024 * 1024) {
    throw new UploadError(`File is too large. Maximum size is ${MAX_MB} MB.`);
  }
  if (file.size === 0) throw new UploadError("File is empty.");

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "") || "misc";
  const hint = (slugHint ?? "image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";

  const filename = `${hint}-${randomBytes(5).toString("hex")}.${ext}`;

  const dir = path.join(process.cwd(), UPLOAD_ROOT, safeFolder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const publicRoot = UPLOAD_ROOT.replace(/^public\/?/, "");
  return {
    url: `/${publicRoot}/${safeFolder}/${filename}`.replace(/\/+/g, "/"),
    bytes: file.size,
  };
}

/** Removes a previously stored upload. Ignores anything outside the upload root. */
export async function deleteStoredImage(url: string): Promise<void> {
  const publicRoot = `/${UPLOAD_ROOT.replace(/^public\/?/, "")}`.replace(/\/+/g, "/");
  if (!url.startsWith(publicRoot)) return;

  const relative = url.slice(publicRoot.length).replace(/^\/+/, "");
  const target = path.join(process.cwd(), UPLOAD_ROOT, relative);

  // Defence in depth: confirm the resolved path is still inside the root.
  const root = path.resolve(process.cwd(), UPLOAD_ROOT);
  if (!path.resolve(target).startsWith(root)) return;

  try {
    await unlink(target);
  } catch {
    // Already gone — nothing to do.
  }
}
