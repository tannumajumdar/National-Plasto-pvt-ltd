"use client";

import React from "react";
import { Award, Cog, ShieldCheck, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Award,
    title: "PREMIUM QUALITY",
    description:
      "High-grade raw materials and advanced technology ensure superior quality.",
    bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  },
  {
    icon: Cog,
    title: "PRECISION ENGINEERING",
    description:
      "State-of-the-art machinery and skilled workforce deliver perfect precision.",
    bg: "bg-red-50 text-[#c8102e] dark:bg-red-950/40 dark:text-red-400",
  },
  {
    icon: ShieldCheck,
    title: "DURABLE & RELIABLE",
    description:
      "Products designed for strength, durability and long-lasting performance.",
    bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  },
  {
    icon: Users,
    title: "CUSTOMER FOCUSED",
    description:
      "We value our clients and deliver solutions tailored to their needs.",
    bg: "bg-red-50 text-[#c8102e] dark:bg-red-950/40 dark:text-red-400",
  },
];

export function FeatureBar() {
  return (
    <section className="relative z-10 -mt-6 sm:-mt-8 pb-12">
      <div className="container-page">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  className={`grid size-11 shrink-0 place-items-center rounded-full ${item.bg}`}
                >
                  <IconComponent className="size-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b2545] dark:text-slate-100">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

