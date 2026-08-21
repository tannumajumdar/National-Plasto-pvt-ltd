import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { extname } from "path";
import { Readable } from "stream";

import { resolveUploadPath, uploadsAreExternal } from "@/lib/storage/local";

export const runtime = "nodejs";
// The file for a given URL never changes — names carry a random suffix — but
// the directory is read at request time, so this must not be prerendered.
export const dynamic = "force-dynamic";

/**
 * Serves uploaded images when they live OUTSIDE `public/`.
 *
 * With the default `UPLOAD_DIR="public/uploads"` this route is never reached:
 * Next.js's static handler answers `/uploads/*` first, which is faster. It
 * only takes over when uploads sit on a mounted volume — Railway, Fly, a
 * Docker bind mount — where a container's own filesystem is wiped on deploy.
 *
 * Read-only and public by design: product photographs are already visible to
 * anyone browsing the catalogue. `resolveUploadPath` does the traversal
 * checking, so a crafted URL cannot read outside the upload directory.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // Nothing to do when the static handler already covers this directory.
  if (!uploadsAreExternal()) {
    return new Response("Not found", { status: 404 });
  }

  const { path: segments } = await params;
  const target = resolveUploadPath(`/uploads/${segments.join("/")}`);
  if (!target) return new Response("Not found", { status: 404 });

  const type = CONTENT_TYPES[extname(target).toLowerCase()];
  // Only hand back image types we chose to accept on upload — never an
  // arbitrary file that happened to land in the directory.
  if (!type) return new Response("Not found", { status: 404 });

  let info;
  try {
    info = await stat(target);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(target)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      // Filenames include a random suffix, so a given URL is immutable.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
