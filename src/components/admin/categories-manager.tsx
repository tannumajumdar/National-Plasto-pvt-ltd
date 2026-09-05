"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/admin/image-uploader";
import { EASE } from "@/components/animations/motion-primitives";
import {
  deleteCategory,
  saveCategory,
  toggleCategoryActive,
} from "@/lib/actions/categories";
import { slugify } from "@/lib/utils";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  parentId: string | null;
  /** Name of the group this heading sits under, for the card subtitle. */
  parentName: string | null;
}

interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  isActive: boolean;
  sortOrder: string;
}

export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminCategory | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<AdminCategory | null>(null);
  const [busy, setBusy] = React.useState(false);

  // A heading cannot itself become a parent, so only groups are offered.
  const parentOptions = React.useMemo(
    () =>
      categories
        .filter((c) => c.parentId === null)
        .map((c) => ({ id: c.id, name: c.name })),
    [categories],
  );

  async function toggleActive(category: AdminCategory) {
    try {
      const result = await toggleCategoryActive(category.id, !category.isActive);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      router.refresh();
    } catch {
      toast.error("Could not update the category.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const result = await deleteCategory(pendingDelete.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setPendingDelete(null);
      router.refresh();
    } catch {
      toast.error("Could not delete the category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? "category" : "categories"}
        </p>
        <Button variant="accent" size="sm" onClick={() => setCreating(true)}>
          <Plus />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Tags className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No categories yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Categories group products by type — Chairs, Tables, Storage and so on.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {category.parentName && (
                          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {category.parentName}
                          </p>
                        )}
                        <h3 className="truncate text-base font-bold tracking-tight">
                          {category.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          /{category.slug}
                        </p>
                      </div>
                      <Badge variant={category.isActive ? "success" : "muted"}>
                        {category.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>

                    {category.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {category.productCount}
                        </span>{" "}
                        {category.productCount === 1 ? "product" : "products"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Order {category.sortOrder}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`cat-active-${category.id}`}
                          checked={category.isActive}
                          onCheckedChange={() => toggleActive(category)}
                        />
                        <Label
                          htmlFor={`cat-active-${category.id}`}
                          className="cursor-pointer text-xs"
                        >
                          Active
                        </Label>
                      </div>

                      <div className="flex gap-1">
                        <Link
                          href={`/products?category=${category.slug}`}
                          target="_blank"
                          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label={`View ${category.name} on storefront`}
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditing(category)}
                          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setPendingDelete(category)}
                          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${category.name}`}
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
      )}

      <CategoryDialog
        open={creating || editing !== null}
        category={editing}
        parentOptions={parentOptions}
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
                ? `${pendingDelete.productCount} ${
                    pendingDelete.productCount === 1 ? "product is" : "products are"
                  } in this category. They will not be deleted, but they will become uncategorised and you will have to reassign them by hand. Deactivate the category instead if you only want to hide it.`
                : "This permanently removes the category. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={busy} onClick={confirmDelete}>
              Delete category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryDialog({
  open,
  category,
  parentOptions,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  category: AdminCategory | null;
  /** Top-level categories only — the tree nests one level deep. */
  parentOptions: { id: string; name: string }[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = category !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "",
      isActive: true,
      sortOrder: "0",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      image: category?.image ?? "",
      parentId: category?.parentId ?? "",
      isActive: category?.isActive ?? true,
      sortOrder: String(category?.sortOrder ?? 0),
    });
  }, [open, category, reset]);

  const name = watch("name");

  async function onSubmit(values: CategoryFormValues) {
    const result = await saveCategory(category?.id ?? null, {
      ...values,
      sortOrder: Number(values.sortOrder),
    });

    if (!result.ok) {
      if (result.fields) {
        for (const [field, message] of Object.entries(result.fields)) {
          setError(field as keyof CategoryFormValues, { message });
        }
      }
      toast.error(result.message ?? "Could not save the category.");
      return;
    }

    toast.success(result.message);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${category.name}` : "Add a category"}</DialogTitle>
          <DialogDescription>
            Categories group products by type, across every collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="cat-name" error={errors.name?.message}>
              <Input
                id="cat-name"
                placeholder="Chairs"
                {...register("name", { required: "Name is required" })}
              />
            </Field>

            <Field label="Slug" htmlFor="cat-slug" error={errors.slug?.message}>
              <div className="flex gap-2">
                <Input
                  id="cat-slug"
                  placeholder="chairs"
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

          <Field label="Description" htmlFor="cat-description" error={errors.description?.message}>
            <Textarea
              id="cat-description"
              rows={3}
              placeholder="Seating across all three National Plasto collections."
              {...register("description")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Parent category"
              htmlFor="cat-parent"
              error={errors.parentId?.message}
            >
              <select
                id="cat-parent"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("parentId")}
              >
                <option value="">None — this is a top-level group</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Headings such as “Deluxe Arm Chairs” sit under a group such as
                “Chairs”. Categories nest one level only.
              </p>
            </Field>

            <Field label="Sort order" htmlFor="cat-sort" error={errors.sortOrder?.message}>
              <Input id="cat-sort" type="number" min="0" {...register("sortOrder")} />
            </Field>
          </div>

          <div className="space-y-2">
            <Label>Category image</Label>
            <Controller
              control={control}
              name="image"
              render={({ field }) => (
                <ImageUploader
                  value={field.value ? [field.value] : []}
                  onChange={(urls) => field.onChange(urls[0] ?? "")}
                  folder="categories"
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
                  <Label htmlFor="cat-active" className="cursor-pointer">
                    Active
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Inactive categories are hidden from the storefront filters.
                  </p>
                </div>
                <Switch id="cat-active" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={isSubmitting}>
              {isEdit ? "Save changes" : "Create category"}
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
