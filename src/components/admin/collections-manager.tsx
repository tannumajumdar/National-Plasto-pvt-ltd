"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/admin/image-uploader";
import { EASE } from "@/components/animations/motion-primitives";
import {
  deleteCollection,
  saveCollection,
  toggleCollectionActive,
} from "@/lib/actions/collections";
import { cn, slugify } from "@/lib/utils";

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  bannerImage: string | null;
  accent: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

interface CollectionFormValues {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  bannerImage: string;
  accent: "next" | "national" | "sapphire";
  isActive: boolean;
  sortOrder: string;
}

const ACCENT_SWATCH: Record<string, string> = {
  next: "bg-gradient-to-br from-next-deep to-next",
  national: "bg-gradient-to-br from-national-deep to-national",
  sapphire: "bg-gradient-to-br from-sapphire-deep to-sapphire",
};

export function CollectionsManager({ collections }: { collections: AdminCollection[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminCollection | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<AdminCollection | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function toggleActive(collection: AdminCollection) {
    try {
      const result = await toggleCollectionActive(collection.id, !collection.isActive);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      router.refresh();
    } catch {
      toast.error("Could not update the collection.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const result = await deleteCollection(pendingDelete.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setPendingDelete(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {collections.length} {collections.length === 1 ? "collection" : "collections"}
        </p>
        <Button variant="accent" size="sm" onClick={() => setCreating(true)}>
          <Plus />
          Add collection
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {collections.map((collection) => (
            <motion.div
              key={collection.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <Card className="h-full overflow-hidden">
                <div
                  className={cn(
                    "relative h-28",
                    ACCENT_SWATCH[collection.accent] ?? ACCENT_SWATCH.national,
                  )}
                >
                  <div aria-hidden className="absolute inset-0 grid-texture opacity-15" />
                  <div className="absolute inset-x-5 bottom-4 flex items-end justify-between">
                    <h3 className="text-lg font-extrabold tracking-tight text-white drop-shadow">
                      {collection.name}
                    </h3>
                    <Badge variant={collection.isActive ? "success" : "muted"}>
                      {collection.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  {collection.tagline && (
                    <p className="text-sm font-medium">{collection.tagline}</p>
                  )}
                  {collection.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {collection.productCount}
                      </span>{" "}
                      products
                    </span>
                    <span className="text-xs text-muted-foreground">/{collection.slug}</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`active-${collection.id}`}
                        checked={collection.isActive}
                        onCheckedChange={() => toggleActive(collection)}
                      />
                      <Label htmlFor={`active-${collection.id}`} className="cursor-pointer text-xs">
                        Active
                      </Label>
                    </div>

                    <div className="flex gap-1">
                      <Link
                        href={`/collections/${collection.slug}`}
                        target="_blank"
                        className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label={`View ${collection.name} on storefront`}
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                      <button
                        onClick={() => setEditing(collection)}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label={`Edit ${collection.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(collection)}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${collection.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <CollectionDialog
        open={creating || editing !== null}
        collection={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      <Dialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
            <DialogDescription>
              {pendingDelete && pendingDelete.productCount > 0
                ? `This collection still contains ${pendingDelete.productCount} products and cannot be deleted. Deactivate it instead to hide it from the storefront.`
                : "This permanently removes the collection. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={busy}
              disabled={Boolean(pendingDelete && pendingDelete.productCount > 0)}
              onClick={confirmDelete}
            >
              Delete collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CollectionDialog({
  open,
  collection,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  collection: AdminCollection | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = collection !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    defaultValues: {
      name: "",
      slug: "",
      tagline: "",
      description: "",
      bannerImage: "",
      accent: "national",
      isActive: true,
      sortOrder: "0",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      name: collection?.name ?? "",
      slug: collection?.slug ?? "",
      tagline: collection?.tagline ?? "",
      description: collection?.description ?? "",
      bannerImage: collection?.bannerImage ?? "",
      accent: (collection?.accent as CollectionFormValues["accent"]) ?? "national",
      isActive: collection?.isActive ?? true,
      sortOrder: String(collection?.sortOrder ?? 0),
    });
  }, [open, collection, reset]);

  const name = watch("name");

  async function onSubmit(values: CollectionFormValues) {
    const result = await saveCollection(collection?.id ?? null, {
      ...values,
      sortOrder: Number(values.sortOrder),
    });

    if (!result.ok) {
      if (result.fields) {
        for (const [field, message] of Object.entries(result.fields)) {
          setError(field as keyof CollectionFormValues, { message });
        }
      }
      toast.error(result.message ?? "Could not save the collection.");
      return;
    }

    toast.success(result.message);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${collection.name}` : "Add a collection"}</DialogTitle>
          <DialogDescription>
            Collections group products into brand lines on the storefront.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="c-name" error={errors.name?.message}>
              <Input
                id="c-name"
                placeholder="NEXT"
                {...register("name", { required: "Name is required" })}
              />
            </Field>

            <Field label="Slug" htmlFor="c-slug" error={errors.slug?.message}>
              <div className="flex gap-2">
                <Input
                  id="c-slug"
                  placeholder="next"
                  {...register("slug", { required: "Slug is required" })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Generate from name"
                  onClick={() => setValue("slug", slugify(name))}
                >
                  ↻
                </Button>
              </div>
            </Field>
          </div>

          <Field label="Tagline" htmlFor="c-tagline" error={errors.tagline?.message}>
            <Input id="c-tagline" placeholder="Contemporary designs for modern living" {...register("tagline")} />
          </Field>

          <Field label="Description" htmlFor="c-description" error={errors.description?.message}>
            <Textarea id="c-description" rows={4} {...register("description")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Theme colour" htmlFor="c-accent" error={errors.accent?.message}>
              <Controller
                control={control}
                name="accent"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="c-accent"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next">Blue (NEXT)</SelectItem>
                      <SelectItem value="national">Saffron (NATIONAL)</SelectItem>
                      <SelectItem value="sapphire">Sapphire (PREMIUM)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Sort order" htmlFor="c-sort" error={errors.sortOrder?.message}>
              <Input id="c-sort" type="number" min="0" {...register("sortOrder")} />
            </Field>
          </div>

          <div className="space-y-2">
            <Label>Banner image</Label>
            <Controller
              control={control}
              name="bannerImage"
              render={({ field }) => (
                <ImageUploader
                  value={field.value ? [field.value] : []}
                  onChange={(urls) => field.onChange(urls[0] ?? "")}
                  folder="collections"
                  slugHint={watch("slug") || watch("name")}
                  single
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                <div>
                  <Label htmlFor="c-active" className="cursor-pointer">Active</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Inactive collections are hidden from the storefront.
                  </p>
                </div>
                <Switch id="c-active" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={isSubmitting}>
              {isEdit ? "Save changes" : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
