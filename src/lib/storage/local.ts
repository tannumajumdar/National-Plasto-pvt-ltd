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

/**
 * Where uploads live on disk.
 *
 * Two shapes are supported, because hosting dictates which one you need:
 *
 *   "public/uploads"   (default) — inside the app. Next.js serves these as
 *                      static files, which is the fastest path. Fine on a VPS
 *                      with a normal disk.
 *
 *   "/data/uploads"    an ABSOLUTE path outside the app — a mounted volume on
 *                      Railway, Fly, a Docker bind mount. Container filesystems
 *                      are wiped on every deploy, so anything persistent has to
 *                      live outside the app directory.
 *
 * `path.resolve` is what makes the second case work: `path.join(cwd, "/data")`
 * silently returns `<cwd>/data`, which would write inside the container and be
 * lost on redeploy. Files outside `public/` are served by
 * src/app/uploads/[...path]/route.ts instead of the static handler.
 */
const UPLOAD_DIR_SETTING = process.env.UPLOAD_DIR ?? "public/uploads";

/** Absolute path to the upload directory, correct for both shapes above. */
export function uploadRoot(): string {
  return path.resolve(process.cwd(), UPLOAD_DIR_SETTING);
}

/** True when uploads live outside `public/` and need the serving route. */
export function uploadsAreExternal(): boolean {
  const root = uploadRoot();
  const publicDir = path.resolve(process.cwd(), "public");
  return !root.startsWith(publicDir + path.sep) && root !== publicDir;
}

/**
 * The public URL prefix. Deliberately `/uploads` in BOTH cases so the URLs
 * already stored in product_images keep working if the directory ever moves —
 * a static file is served directly when it exists, and the route handler picks
 * up everything else.
 */
export const UPLOAD_URL_PREFIX = "/uploads";

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

  const dir = path.join(uploadRoot(), safeFolder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return {
    url: `${UPLOAD_URL_PREFIX}/${safeFolder}/${filename}`.replace(/\/+/g, "/"),
    bytes: file.size,
  };
}

/** Removes a previously stored upload. Ignores anything outside the upload root. */
export async function deleteStoredImage(url: string): Promise<void> {
  const target = resolveUploadPath(url);
  if (!target) return;

  try {
    await unlink(target);
  } catch {
    // Already gone — nothing to do.
  }
}

/**
 * Maps a public `/uploads/...` URL to a path on disk, or null if the URL is
 * not ours or tries to escape the upload directory.
 *
 * Shared by `deleteStoredImage` and the serving route, so traversal defence
 * lives in exactly one place. `..` segments and absolute-looking paths both
 * resolve out of the root and are rejected by the final containment check.
 */
export function resolveUploadPath(url: string): string | null {
  if (!url.startsWith(UPLOAD_URL_PREFIX)) return null;

  // Decode first: %2e%2e is `..`, and would otherwise slip past the check.
  let relative: string;
  try {
    relative = decodeURIComponent(url.slice(UPLOAD_URL_PREFIX.length));
  } catch {
    return null;
  }
  relative = relative.replace(/^\/+/, "");
  if (!relative || relative.includes("\0")) return null;

  const root = uploadRoot();
  const target = path.resolve(root, relative);

  // The trailing separator matters: "/data/uploads-evil" starts with
  // "/data/uploads" as a string, but is a different directory.
  if (target !== root && !target.startsWith(root + path.sep)) return null;

  return target;
}
