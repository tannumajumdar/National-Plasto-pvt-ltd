"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { UserCheck } from "lucide-react";

/**
 * ============================================================================
 * NATIONAL PLASTO PVT. LTD. — TEAM MEMBERS DATA CONFIGURATION
 * ============================================================================
 *
 * To update team members in the future:
 * Simply replace the `image`, `name`, `designation`, and `description` below.
 * ============================================================================
 */
export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  description: string;
  image: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "member-1",
    name: "Team Member 1",
    designation: "Director",
    description:
      "Leading the organization with a strong focus on quality, innovation and long-term business growth.",
    image: "/images/team/team-member-1.jpg",
  },
  {
    id: "member-2",
    name: "Team Member 2",
    designation: "Management / Operations",
    description:
      "Focused on operational excellence, customer relationships and maintaining high standards across the organization.",
    image: "/images/team/team-member-2.jpg",
  },
];

export function TeamSection() {
  return (
    <section
      id="team"
      aria-label="Our Team"
      className="relative overflow-hidden bg-[#07111F] py-16 sm:py-24 text-white"
    >
      {/* Subtle Background Glow Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-1/4 size-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-[#c8102e]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,17,31,0.8)_100%)]" />
      </div>

      <div className="container-page relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-[#c8102e] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              OUR TEAM
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            Meet Our <span className="text-[#c8102e]">Team</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed font-normal"
          >
            Behind National Plasto is a dedicated team committed to quality, innovation and delivering reliable plastic moulded products to our customers.
          </motion.p>
        </div>

        {/* Team Members Grid — Exactly 2 Cards */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {TEAM_MEMBERS.map((member, index) => (
            <motion.article
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-slate-600 hover:shadow-blue-900/20"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-950">
                <Image
                  src={member.image}
                  alt={`${member.name} — ${member.designation}`}
                  fill
                  priority={index === 0}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Designation Chip */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-slate-700/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 shadow-lg backdrop-blur-md">
                    <UserCheck className="size-3.5 text-[#c8102e]" />
                    {member.designation}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                  {member.name}
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#c8102e]">
                  National Plasto Pvt. Ltd.
                </p>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300 font-normal">
                  {member.description}
                </p>
              </div>

              {/* Accent Bottom Line */}
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#c8102e] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

