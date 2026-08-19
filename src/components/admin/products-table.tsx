"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductVisual } from "@/components/products/product-visual";
import { EASE } from "@/components/animations/motion-primitives";
import { useDebounce } from "@/hooks/use-debounce";
import { bulkUpdateProducts, deleteProduct } from "@/lib/actions/products";
import { cn, formatINR } from "@/lib/utils";
import type { AccentToken } from "@/lib/placeholder";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  discountPrice: number | null;
  stock: number;
  trackStock: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  needsReview: boolean;
  image: string | null;
  collection: { name: string; accent: AccentToken };
  category: string | null;
}

const BULK_ACTIONS = [
  { value: "publish", label: "Publish" },
  { value: "unpublish", label: "Unpublish" },
  { value: "feature", label: "Mark as Featured" },
  { value: "unfeature", label: "Remove Featured" },
  { value: "markNew", label: "Mark as New" },
  { value: "unmarkNew", label: "Remove New" },
  { value: "markBestSeller", label: "Mark as Best Seller" },
  { value: "unmarkBestSeller", label: "Remove Best Seller" },
] as const;

export function ProductsTable({
  products,
  collections,
}: {
  products: AdminProductRow[];
  collections: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = React.useState<AdminProductRow | null>(null);
  const [bulkConfirm, setBulkConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Search is debounced and written to the URL so it survives refresh.
  const [term, setTerm] = React.useState(params.get("q") ?? "");
  const debounced = useDebounce(term, 350);
  const firstRun = React.useRef(true);

  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const sp = new URLSearchParams(params.toString());
    if (debounced.trim()) {
      sp.set("q", debounced.trim());
    } else {
      sp.delete("q");
    }
    sp.delete("page");
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Clear selection whenever the visible rows change.
  React.useEffect(() => setSelected(new Set()), [products]);

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value && value !== "all") {
      sp.set(key, value);
    } else {
      sp.delete(key);
    }
    sp.delete("page");
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  const allSelected = products.length > 0 && selected.size === products.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function runBulk(action: string) {
    setBusy(true);
    try {
      const result = await bulkUpdateProducts({ ids: [...selected], action });
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setSelected(new Set());
      setBulkConfirm(false);
      router.refresh();
    } catch {
      toast.error("Bulk action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const result = await deleteProduct(pendingDelete.id);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setPendingDelete(null);
      router.refresh();
    } catch {
      toast.error("Could not delete the product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name or SKU…"
            className="pl-10"
          />
          {isPending && (
            <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={params.get("collection") ?? "all"}
            onValueChange={(v) => setParam("collection", v)}
          >
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Collection" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={params.get("status") ?? "all"} onValueChange={(v) => setParam("status", v)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="outofstock">Out of stock</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={params.get("needsReview") === "1" ? "1" : "all"}
            onValueChange={(v) => setParam("needsReview", v === "1" ? "1" : "")}
          >
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Completeness" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="1">Needs details</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent/8 p-4">
              <span className="text-sm font-semibold">
                {selected.size} selected
              </span>

              <div className="ml-auto flex flex-wrap gap-2">
                <Select onValueChange={runBulk}>
                  <SelectTrigger className="h-9 w-52"><SelectValue placeholder="Apply action…" /></SelectTrigger>
                  <SelectContent>
                    {BULK_ACTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button size="sm" variant="destructive" onClick={() => setBulkConfirm(true)}>
                  <Trash2 />
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  <X />
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all products"
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">Collection</TableHead>
              <TableHead className="hidden lg:table-cell">Price</TableHead>
              <TableHead className="hidden lg:table-cell">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <p className="font-medium">No products found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different search or clear the filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} data-state={selected.has(product.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={() => toggleOne(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <ProductVisual
                          name={product.name}
                          accent={product.collection.accent}
                          src={product.image}
                          sizes="44px"
                          rounded="rounded-lg"
                        />
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="block truncate font-medium hover:text-accent"
                        >
                          {product.name}
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground">
                          {product.sku}
                          {product.category ? ` · ${product.category}` : ""}
                        </span>
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <Badge variant={product.collection.accent}>{product.collection.name}</Badge>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    {product.price === null ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3.5" />
                        Not set
                      </span>
                    ) : (
                      <span className="font-medium tabular-nums">
                        {formatINR(product.discountPrice ?? product.price)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    {!product.trackStock ? (
                      <span className="text-xs text-muted-foreground">Not tracked</span>
                    ) : (
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          product.stock === 0 && "text-rose-600 dark:text-rose-400",
                          product.stock > 0 && product.stock <= 5 && "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {product.stock}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={product.isPublished ? "success" : "muted"}>
                        {product.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {product.isFeatured && <Badge variant="accent">Featured</Badge>}
                      {product.needsReview && (
                        <Badge variant="warning" title="Missing price, description or images">
                          Needs details
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label={`Actions for ${product.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Pencil />Edit product
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <ExternalLink />View on storefront
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onSelect={() => setPendingDelete(product)}>
                          <Trash2 />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete one */}
      <Dialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the product, its images and its reviews. Orders that
              already contain it keep their own snapshot. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="destructive" loading={busy} onClick={confirmDelete}>
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete */}
      <Dialog open={bulkConfirm} onOpenChange={setBulkConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} products?</DialogTitle>
            <DialogDescription>
              This permanently removes all selected products and their images. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirm(false)}>Cancel</Button>
            <Button variant="destructive" loading={busy} onClick={() => runBulk("delete")}>
              Delete {selected.size} products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
