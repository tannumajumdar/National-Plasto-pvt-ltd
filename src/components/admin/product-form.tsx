"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { AlertTriangle, ArrowLeft, Info, Plus, Save, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createProduct, updateProduct } from "@/lib/actions/products";
import { slugify } from "@/lib/utils";

/**
 * Form state uses rupee strings for money because that is what an admin
 * types. The server action converts to integer paise via the Zod schema.
 */
interface ProductFormValues {
  name: string;
  slug: string;
  sku: string;
  collectionId: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  trackStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
  images: string[];
  features: { label: string }[];
  specifications: { name: string; value: string }[];
}

export interface ProductFormInitial {
  id: string;
  name: string;
  slug: string;
  sku: string;
  collectionId: string;
  categoryId: string | null;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  discountPrice: number | null;
  stock: number;
  trackStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isPublished: boolean;
  needsReview: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  images: string[];
  features: string[];
  specifications: { name: string; value: string }[];
}

const paiseToInput = (paise: number | null) => (paise === null ? "" : String(paise / 100));

export function ProductForm({
  initial,
  collections,
  categories,
}: {
  initial?: ProductFormInitial;
  collections: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [slugTouched, setSlugTouched] = React.useState(isEdit);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      sku: initial?.sku ?? "",
      collectionId: initial?.collectionId ?? collections[0]?.id ?? "",
      categoryId: initial?.categoryId ?? "",
      shortDescription: initial?.shortDescription ?? "",
      description: initial?.description ?? "",
      price: paiseToInput(initial?.price ?? null),
      discountPrice: paiseToInput(initial?.discountPrice ?? null),
      stock: String(initial?.stock ?? 0),
      trackStock: initial?.trackStock ?? true,
      isFeatured: initial?.isFeatured ?? false,
      isNew: initial?.isNew ?? false,
      isBestSeller: initial?.isBestSeller ?? false,
      isPublished: initial?.isPublished ?? true,
      metaTitle: initial?.metaTitle ?? "",
      metaDescription: initial?.metaDescription ?? "",
      images: initial?.images ?? [],
      features: (initial?.features ?? []).map((label) => ({ label })),
      specifications: initial?.specifications ?? [],
    },
  });

  const features = useFieldArray({ control, name: "features" });
  const specifications = useFieldArray({ control, name: "specifications" });

  const name = watch("name");
  const images = watch("images");

  // Auto-derive the slug from the name until an admin edits it by hand.
  React.useEffect(() => {
    if (slugTouched || !name) return;
    setValue("slug", slugify(name));
  }, [name, slugTouched, setValue]);

  async function onSubmit(values: ProductFormValues) {
    const payload = {
      ...values,
      categoryId: values.categoryId || undefined,
      features: values.features.map((f) => f.label).filter(Boolean),
      specifications: values.specifications.filter((s) => s.name && s.value),
      // Empty string means "not set"; the schema turns it into null.
      price: values.price === "" ? "" : Number(values.price),
      discountPrice: values.discountPrice === "" ? "" : Number(values.discountPrice),
      stock: Number(values.stock),
      needsReview: false,
    };

    const result = isEdit
      ? await updateProduct(initial!.id, payload)
      : await createProduct(payload);

    if (!result.ok) {
      if (result.fields) {
        for (const [field, message] of Object.entries(result.fields)) {
          setError(field as keyof ProductFormValues, { message });
        }
      }
      toast.error(result.message ?? "Could not save the product.");
      return;
    }

    toast.success(result.message ?? "Saved");
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {isEdit && initial?.needsReview && (
        <Card className="border-amber-500/35 bg-amber-500/8">
          <CardContent className="flex gap-3 p-5">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">This product needs details.</span>{" "}
              The source product list supplied only its name. Add a price, description and at
              least one image, and this flag clears automatically when you save.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* Basics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product details</CardTitle>
              <CardDescription>Name, identifiers and descriptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldRow label="Product name" htmlFor="name" error={errors.name?.message}>
                <Input
                  id="name"
                  placeholder="e.g. Atom - 2 ft"
                  {...register("name", { required: "Name is required" })}
                />
              </FieldRow>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldRow
                  label="URL slug"
                  htmlFor="slug"
                  error={errors.slug?.message}
                  hint="Used in the product URL"
                >
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      {...register("slug", { required: "Slug is required" })}
                      onChange={(e) => {
                        setSlugTouched(true);
                        register("slug").onChange(e);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Regenerate from name"
                      onClick={() => {
                        setValue("slug", slugify(watch("name")));
                        setSlugTouched(false);
                      }}
                    >
                      <Wand2 />
                    </Button>
                  </div>
                </FieldRow>

                <FieldRow label="SKU" htmlFor="sku" error={errors.sku?.message}>
                  <Input id="sku" placeholder="NP-NXT-001" {...register("sku", { required: "SKU is required" })} />
                </FieldRow>
              </div>

              <FieldRow
                label="Short description"
                htmlFor="shortDescription"
                error={errors.shortDescription?.message}
                hint="One or two lines, shown on product cards"
              >
                <Textarea id="shortDescription" rows={2} {...register("shortDescription")} />
              </FieldRow>

              <FieldRow
                label="Full description"
                htmlFor="description"
                error={errors.description?.message}
                hint="Shown on the product page. Blank lines start a new paragraph."
              >
                <Textarea id="description" rows={7} {...register("description")} />
              </FieldRow>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Images</CardTitle>
              <CardDescription>
                The first image is the primary one. Until an image is uploaded, the storefront
                shows a generated placeholder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="images"
                render={({ field }) => (
                  <ImageUploader
                    value={field.value}
                    onChange={field.onChange}
                    folder="products"
                    slugHint={watch("slug") || watch("name")}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Features</CardTitle>
                <CardDescription>Short bullet points shown under Features.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => features.append({ label: "" })}>
                <Plus />Add
              </Button>
            </CardHeader>
            <CardContent>
              {features.fields.length === 0 ? (
                <EmptyRow text="No features added yet." />
              ) : (
                <div className="space-y-3">
                  {features.fields.map((field, i) => (
                    <div key={field.id} className="flex gap-2">
                      <Input placeholder="e.g. Stackable design" {...register(`features.${i}.label`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => features.remove(i)}
                        aria-label="Remove feature"
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Specifications</CardTitle>
                <CardDescription>
                  Dimensions, material, colour and so on — add only what you can confirm.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => specifications.append({ name: "", value: "" })}
              >
                <Plus />Add
              </Button>
            </CardHeader>
            <CardContent>
              {specifications.fields.length === 0 ? (
                <EmptyRow text="No specifications added yet. The product page will say so rather than guess." />
              ) : (
                <div className="space-y-3">
                  {specifications.fields.map((field, i) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        placeholder="Name (e.g. Material)"
                        className="sm:max-w-56"
                        {...register(`specifications.${i}.name`)}
                      />
                      <Input placeholder="Value" {...register(`specifications.${i}.value`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => specifications.remove(i)}
                        aria-label="Remove specification"
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search engine listing</CardTitle>
              <CardDescription>Leave blank to generate these automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldRow label="Meta title" htmlFor="metaTitle" error={errors.metaTitle?.message}>
                <Input id="metaTitle" {...register("metaTitle")} />
              </FieldRow>
              <FieldRow
                label="Meta description"
                htmlFor="metaDescription"
                error={errors.metaDescription?.message}
              >
                <Textarea id="metaDescription" rows={3} {...register("metaDescription")} />
              </FieldRow>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldRow label="Collection" htmlFor="collectionId" error={errors.collectionId?.message}>
                <Controller
                  control={control}
                  name="collectionId"
                  rules={{ required: "Choose a collection" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="collectionId"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldRow>

              <FieldRow label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <SelectTrigger id="categoryId"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Uncategorised</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
              <CardDescription>In rupees. Leave blank for &ldquo;Price on request&rdquo;.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldRow label="Price (₹)" htmlFor="price" error={errors.price?.message}>
                <Input id="price" type="number" min="0" step="0.01" placeholder="Not set" {...register("price")} />
              </FieldRow>

              <FieldRow
                label="Discount price (₹)"
                htmlFor="discountPrice"
                error={errors.discountPrice?.message}
                hint="Must be lower than the price"
              >
                <Input
                  id="discountPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="No discount"
                  {...register("discountPrice")}
                />
              </FieldRow>

              {watch("price") === "" && (
                <p className="flex gap-2 rounded-xl bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
                  <Info className="size-3.5 shrink-0" />
                  Without a price this product cannot be added to a cart. It will show
                  &ldquo;Price on request&rdquo; and prompt an enquiry.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldRow label="Stock quantity" htmlFor="stock" error={errors.stock?.message}>
                <Input id="stock" type="number" min="0" {...register("stock")} />
              </FieldRow>

              <ToggleRow
                control={control}
                name="trackStock"
                label="Track stock"
                hint="Turn off for made-to-order products"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow control={control} name="isPublished" label="Published" hint="Visible on the storefront" />
              <ToggleRow control={control} name="isFeatured" label="Featured" hint="Shown in the featured rail" />
              <ToggleRow control={control} name="isNew" label="New arrival" />
              <ToggleRow control={control} name="isBestSeller" label="Best seller" />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="accent" size="lg" loading={isSubmitting}>
              {!isSubmitting && <Save />}
              {isEdit ? "Save changes" : "Create product"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/products">
                <ArrowLeft />
                Cancel
              </Link>
            </Button>
          </div>

          {images.length === 0 && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              <Badge variant="warning" className="mr-1.5">Note</Badge>
              No images uploaded — the storefront will show a generated placeholder.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function FieldRow({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function ToggleRow({
  control,
  name,
  label,
  hint,
}: {
  control: any;
  name: keyof ProductFormValues;
  label: string;
  hint?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor={String(name)} className="cursor-pointer">{label}</Label>
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <Switch id={String(name)} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
