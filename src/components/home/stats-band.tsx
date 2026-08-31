"use client";

import React from "react";
import { Award, Package, ShieldCheck, Users } from "lucide-react";
import type { StatDTO } from "@/types";

const STATS = [
  {
    icon: Award,
    value: "30+",
    label: "YEARS OF EXPERIENCE",
  },
  {
    icon: Users,
    value: "500+",
    label: "HAPPY CLIENTS",
  },
  {
    icon: Package,
    value: "1000+",
    label: "PRODUCTS DELIVERED",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "QUALITY ASSURANCE",
  },
];

export function StatsBand({ stats: _stats }: { stats?: StatDTO[] } = {}) {
  return (
    <section className="bg-[#081b34] text-white py-12 lg:py-16">
      <div className="container-page">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {STATS.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-center gap-4 pt-6 md:pt-0 first:pt-0"
              >
                <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/5 text-white shadow-sm">
                  <IconComp className="size-7 stroke-[1.75]" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white leading-none">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
