"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mail, Building2, ShieldCheck, Truck } from "lucide-react";
import { DISTRIBUTOR_CONTACT } from "@/lib/constants";

/** Custom WhatsApp SVG Icon */
function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
      <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
    </svg>
  );
}

export function DistributorSection() {
  // Format WhatsApp link with encoded pre-filled text
  const cleanWhatsAppNumber = DISTRIBUTOR_CONTACT.whatsappNumber.replace(/[^\d+]/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsAppNumber.replace("+", "")}?text=${encodeURIComponent(
    DISTRIBUTOR_CONTACT.whatsappMessage
  )}`;

  // Format Email mailto link with encoded subject & body
  const mailtoUrl = `mailto:${DISTRIBUTOR_CONTACT.emailAddress}?subject=${encodeURIComponent(
    DISTRIBUTOR_CONTACT.emailSubject
  )}&body=${encodeURIComponent(DISTRIBUTOR_CONTACT.emailBody)}`;

  const highlights = [
    { icon: Building2, label: "Direct Factory Supply" },
    { icon: ShieldCheck, label: "Certified Premium Quality" },
    { icon: Truck, label: "Pan-India Logistics" },
  ];

  return (
    <section
      id="distributor"
      aria-label="Distributor and Partnership Opportunities"
      className="relative overflow-hidden bg-[#07111F] py-16 sm:py-24 text-white"
    >
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-[#c8102e]/25 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="container-page relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Section Subtitle / Category Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-[#c8102e] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              PARTNER WITH NATIONAL PLASTO
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            Become a <span className="bg-gradient-to-r from-blue-400 via-white to-rose-400 bg-clip-text text-transparent">Distributor</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed font-normal"
          >
            Looking to partner with a trusted manufacturer of high-quality plastic moulded products?
            Connect with our team directly to explore distributor and business partnership opportunities.
          </motion.p>

          {/* Supporting Line */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-sm sm:text-base font-bold text-amber-400/90 tracking-wide"
          >
            Let&apos;s build a stronger business network together.
          </motion.p>

          {/* Key Value Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 max-w-3xl mx-auto"
          >
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur-sm text-slate-200 text-xs sm:text-sm font-semibold shadow-inner"
                >
                  <Icon className="size-4 text-blue-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </motion.div>

          {/* Direct CTA Buttons: WhatsApp + Email */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            {/* WhatsApp CTA Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-[#25D366] hover:bg-[#20ba5a] px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-xl shadow-[#25D366]/20 transition-all hover:scale-105 hover:shadow-2xl active:scale-95 group"
              aria-label="Connect with National Plasto on WhatsApp for distributor enquiries"
            >
              <WhatsAppIcon className="size-5 shrink-0 transition-transform group-hover:rotate-6" />
              <span>WhatsApp Us</span>
            </a>

            {/* Email CTA Button */}
            <a
              href={mailtoUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-[#c8102e] hover:bg-[#a80b24] px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-xl shadow-[#c8102e]/20 transition-all hover:scale-105 hover:shadow-2xl active:scale-95 group"
              aria-label="Email National Plasto for distributor enquiries"
            >
              <Mail className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5" />
              <span>Email Us</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

