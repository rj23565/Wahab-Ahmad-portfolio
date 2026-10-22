"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDownRight, MapPin, Sparkles } from "lucide-react";
import { usePortfolio } from "@/lib/store";

export default function Hero() {
  const { profileImage, profile } = usePortfolio();

  return (
    <section
      id="home"
      className="relative min-h-screen pt-28 pb-20 overflow-hidden"
    >
      {/* Grid / glow ambience */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-cyan/5 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
        {/* Copy */}
        <div className="lg:col-span-7 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="section-label">// Portfolio · Vol. 01</span>
            <span className="flex-1 hairline" />
            <span className="font-mono text-xs text-accent flex items-center gap-1">
              <Sparkles size={12} />
              {profile.location}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-6xl sm:text-7xl lg:text-8xl xl:text-9xl leading-[0.9] tracking-wide text-steel-100"
          >
            GIVE ME <br />
            AN <span className="gold-gradient-text italic font-serif font-black">IDEA,</span>
            <br />
            I MAKE IT <span className="gold-gradient-text font-serif font-black italic">PERFECT.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-8 text-steel-300 max-w-2xl leading-relaxed text-base sm:text-lg"
          >
            {profile.bio}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#work"
              className="btn-edge group inline-flex items-center gap-2 px-6 py-3 bg-accent text-midnight-950 font-semibold tracking-wide text-sm rounded-sm shadow-edge hover:bg-accent-hot transition"
            >
              View Workspace
              <ArrowDownRight size={18} className="group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-steel-100 hover:border-accent/50 hover:text-accent text-sm tracking-wide rounded-sm transition"
            >
              Open a Channel
            </a>
          </motion.div>

          {/* stat strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 grid grid-cols-3 gap-0 border border-white/5 rounded-sm overflow-hidden"
          >
            {[
              { k: "Disciplines", v: "04+" },
              { k: "Launched Works", v: "120+" },
              { k: "Years of Craft", v: "02+" },
            ].map((s, i) => (
              <div
                key={s.k}
                className={`p-5 bg-white/[0.02] ${
                  i !== 0 ? "border-l border-white/5" : ""
                }`}
              >
                <div className="font-display text-3xl sm:text-4xl gold-gradient-text">
                  {s.v}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-steel-400">
                  {s.k}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Portrait */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="lg:col-span-5 relative"
        >
          <div className="relative mx-auto max-w-md">
            {/* outer frame */}
            <div className="absolute -inset-6 border border-accent/20 rounded-sm rotate-[-1deg]" />
            <div className="absolute -inset-3 border border-white/10 rounded-sm rotate-[1deg]" />

            <div className="relative frame-edge rounded-sm overflow-hidden bg-midnight-900 shadow-edge">
              {/* corner brackets */}
              <span className="bracket bracket-tl" />
              <span className="bracket bracket-tr" />
              <span className="bracket bracket-bl" />
              <span className="bracket bracket-br" />

              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={profileImage}
                  alt={`${profile.firstName} ${profile.lastName} — ${profile.role}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 80vw, 420px"
                  className="object-cover object-center"
                />
                {/* gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/80 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-cyan/5 mix-blend-overlay" />

                {/* Status badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-midnight-950/70 backdrop-blur border border-white/10 rounded-sm text-[10px] font-mono uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  On Duty
                </div>

                {/* ID strip bottom */}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="font-serif text-2xl text-white">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="font-mono text-[11px] text-steel-300 tracking-widest uppercase">
                        {profile.role}
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-accent tracking-widest flex items-center gap-1">
                      <MapPin size={10} /> PK
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* decorative side tag */}
            <div className="hidden sm:flex absolute -left-10 top-16 -rotate-90 origin-left">
              <span className="font-mono text-[10px] tracking-[0.5em] text-steel-500">
                EST. 2021 · CHAK JHUMRA
              </span>
            </div>
            <div className="absolute -right-3 -bottom-3 font-mono text-[10px] tracking-widest text-accent/80 bg-midnight-900 border border-accent/30 px-2 py-1">
              ID · 001-WA
            </div>
          </div>
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="mt-20 relative border-y border-white/5 py-4 overflow-hidden bg-white/[0.02]">
        <div className="flex whitespace-nowrap marquee-track gap-12 font-display text-3xl text-steel-100/60">
          {Array.from({ length: 2 }).map((_, r) => (
            <div key={r} className="flex gap-12 items-center">
              {[
                "SCREEN PRINTING",
                "TEXTILE DESIGN",
                "WEB ENGINEERING",
                "BRAND SYSTEMS",
                "AI AUGMENTED",
                "MASTER CRAFT",
              ].map((t) => (
                <span key={t + r} className="flex items-center gap-12">
                  {t}
                  <span className="text-accent">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
