"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, ImagePlus, Loader2, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EASE } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/**
 * Uploads images to /api/upload and returns their public URLs.
 * The first image in the list is used as the product's primary image.
 */
export function ImageUploader({
  value,
  onChange,
  folder = "products",
  slugHint,
  max = 8,
  single = false,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  slugHint?: string;
  max?: number;
  single?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const limit = single ? 1 : max;

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    const room = limit - value.length;
    if (room <= 0) {
      toast.error(`You can upload at most ${limit} ${limit === 1 ? "image" : "images"}.`);
      return;
    }

    const batch = list.slice(0, room);
    if (batch.length < list.length) {
      toast.info(`Only ${room} more ${room === 1 ? "image" : "images"} can be added.`);
    }

    const form = new FormData();
    batch.forEach((f) => form.append("files", f));
    form.append("folder", folder);
    if (slugHint) form.append("slug", slugHint);

    setUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }

      onChange(single ? data.urls.slice(0, 1) : [...value, ...data.urls]);
      toast.success(
        `${data.urls.length} ${data.urls.length === 1 ? "image" : "images"} uploaded`,
      );
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function makePrimary(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-accent bg-accent/8" : "border-border hover:border-accent/50",
          value.length >= limit && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple={!single}
          className="sr-only"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />

        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary">
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-accent" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </span>

        <p className="mt-4 text-sm font-medium">
          {uploading ? "Uploading…" : "Drag images here, or"}
        </p>

        {!uploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            Choose {single ? "an image" : "images"}
          </Button>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          JPG, PNG, WebP, AVIF or GIF · up to {limit}{" "}
          {limit === 1 ? "image" : "images"} · max 5 MB each
        </p>
      </div>

      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {value.map((url, i) => (
              <motion.div
                key={url}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
              >
                <Image src={url} alt={`Image ${i + 1}`} fill sizes="200px" className="object-cover" />

                {i === 0 && !single && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                    <Star className="size-2.5 fill-current" />
                    Primary
                  </span>
                )}

                <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!single && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="grid size-7 place-items-center rounded-full bg-white/90 text-primary transition-colors hover:bg-white disabled:opacity-40"
                        aria-label="Move earlier"
                      >
                        <GripVertical className="size-3.5 rotate-90" />
                      </button>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => makePrimary(i)}
                          className="grid size-7 place-items-center rounded-full bg-white/90 text-primary transition-colors hover:bg-white"
                          aria-label="Make primary image"
                        >
                          <Star className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="ml-auto grid size-7 place-items-center rounded-full bg-rose-500 text-white transition-colors hover:bg-rose-600"
                    aria-label="Remove image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
