"use client";

import { usePortfolio } from "@/lib/store";

export default function Footer() {
  const { profile } = usePortfolio();
  return (
    <footer className="relative border-t border-white/5 mt-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="font-serif text-2xl">
            <span className="gold-gradient-text font-black">W</span>
            <span className="text-steel-200">ahab Ahmad</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
            · Craft x Code · {profile.location}
          </span>
        </div>

        <div className="font-mono text-[11px] text-steel-500 flex flex-wrap gap-4">
          <span>© {new Date().getFullYear()} {profile.firstName} {profile.lastName} Studio</span>
          <span className="text-accent">/</span>
          <span>Built from scratch · Next.js · TS · Tailwind</span>
          <span className="text-accent">/</span>
          <span>{profile.location}</span>
        </div>
      </div>
    </footer>
  );
}
