"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { DISTRIBUTOR_CONTACT } from "@/lib/constants";
import type { ProductDetailDTO } from "@/types";

export function PurchasePanel({ product }: { product: ProductDetailDTO }) {
  const toggleWishlist = useWishlist((s) => s.toggle);
  const wishlisted = useWishlist((s) => s.ids.includes(product.id));

  // Clean WhatsApp number & encoded message for this specific product
  const cleanNumber = DISTRIBUTOR_CONTACT.whatsappNumber.replace(/[^\d+]/g, "");
  const productWhatsappUrl = `https://wa.me/${cleanNumber.replace("+", "")}?text=${encodeURIComponent(
    `Hello National Plasto Team,\nI am interested in getting a quote for the following product:\nProduct: ${product.name}\nSKU: ${product.sku}\nCollection: ${product.collection.name}\n\nPlease share the details, pricing and availability.`
  )}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-500/20 bg-blue-50/50 p-5 dark:bg-slate-900/50">
        <span className="text-xs font-bold uppercase tracking-wider text-[#c8102e]">
          Inquiry-Based Catalogue
        </span>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Connect directly with our team to receive instant wholesale pricing, specifications, and volume discount quotes for <strong>{product.name}</strong>.
        </p>
      </div>

      <Separator />

      {/* Direct Get a Quote CTAs */}
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="flex-1 bg-[#c8102e] hover:bg-[#a80b24] text-white font-extrabold uppercase tracking-wider px-8 py-4 rounded-full shadow-lg"
        >
          <Link href={`/contact?product=${encodeURIComponent(product.name)}`} className="flex items-center justify-center gap-2">
            <span>GET A QUOTE</span>
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </Button>

        <a
          href={productWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba5a] px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 active:scale-95"
          aria-label={`WhatsApp Enquiry for ${product.name}`}
        >
          <span>WhatsApp Quote</span>
        </a>

        <Button
          size="lg"
          variant="outline"
          className="rounded-full shrink-0"
          aria-pressed={wishlisted}
          onClick={() => {
            const saved = toggleWishlist(product.id);
            toast[saved ? "success" : "message"](
              saved ? "Saved to wishlist" : "Removed from wishlist",
              { description: product.name },
            );
          }}
        >
          <Heart className={cn("size-5", wishlisted && "fill-rose-500 text-rose-500")} />
          <span className="sr-only">{wishlisted ? "Saved" : "Save"}</span>
        </Button>
      </div>

      {/* Assurances */}
      <div className="grid gap-3 rounded-2xl border border-border bg-secondary/40 p-5 sm:grid-cols-2">
        <div className="flex gap-3">
          <Truck className="size-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">Pan-India Logistics</p>
            <p className="text-xs text-muted-foreground">Direct factory shipping & bulk supply</p>
          </div>
        </div>
        <div className="flex gap-3">
          <ShieldCheck className="size-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">Quality Checked</p>
            <p className="text-xs text-muted-foreground">ISO certified manufacturing standard</p>
          </div>
        </div>
      </div>
    </div>
  );
}
