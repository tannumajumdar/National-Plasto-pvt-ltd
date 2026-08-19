import { getCurrentUser } from "@/lib/auth/session";
import { storeImage, UploadError } from "@/lib/storage/local";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

/** Image upload for the admin panel. Admin role required. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return fail("Administrator access required.", 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Expected a multipart form upload.", 400);
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const single = form.get("file");
  if (single instanceof File) files.push(single);

  if (files.length === 0) return fail("No file was provided.", 400);
  if (files.length > 10) return fail("Upload at most 10 images at a time.", 400);

  const folder = String(form.get("folder") ?? "products");
  const slugHint = form.get("slug") ? String(form.get("slug")) : undefined;

  try {
    const stored = await Promise.all(files.map((f) => storeImage(f, folder, slugHint)));
    return ok({ files: stored, urls: stored.map((s) => s.url) }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message, 422);
    console.error("[upload] failed:", err);
    return fail("Upload failed. Please try again.", 500);
  }
}
