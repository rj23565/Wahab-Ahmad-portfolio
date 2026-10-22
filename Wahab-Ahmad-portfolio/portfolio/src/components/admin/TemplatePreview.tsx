"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ArrowLeft, Check, Palette } from "lucide-react";
import { TEMPLATES } from "@/lib/store";
import type { ThemeTemplateId } from "@/types";
import { cn } from "@/lib/cn";

interface Props {
  templateId: ThemeTemplateId | null;
  onClose: () => void;
  onApply: (id: ThemeTemplateId) => void;
  activeId: ThemeTemplateId;
}

/**
 * Full-screen template preview: renders a mini portfolio mockup for a theme
 * using its actual palette — fonts, colors, spacing, card styles, gallery grid,
 * hero, CTA — so the admin sees the design before applying.
 */
export default function TemplatePreview({ templateId, onClose, onApply, activeId }: Props) {
  const t = templateId ? TEMPLATES[templateId] : null;
  if (!t) return null;

  const light = ["cream-editorial","paper-ink","blush-editorial","sage-paper","desert-vintage","mint-bubble","pure-minimal","slate-mono"].includes(t.id);
  const isActive = activeId === t.id;

  const mockStyle: React.CSSProperties = {
    background: t.bg,
    color: t.text,
    borderRadius: 12,
    border: `1px solid ${t.border}`,
    ["--mock-accent" as any]: t.accent,
    ["--mock-text" as any]: t.text,
    ["--mock-muted" as any]: t.muted,
    ["--mock-heading" as any]: t.heading,
    ["--mock-surface" as any]: t.surface,
    ["--mock-border" as any]: t.border,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col"
        onClick={onClose}
      >
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <button onClick={onClose} className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent">
            <ArrowLeft size={14} /> Back to gallery
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm" style={{ background: t.accent }} />
            <div>
              <div className="font-serif text-base text-steel-100">{t.name}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-steel-500">{t.category}</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex gap-1">
              {t.swatches.map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-sm border" style={{ background: c, borderColor: "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onApply(t.id); }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-sm",
                isActive
                  ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40"
                  : "bg-[color:var(--mock-accent)] text-black border border-transparent hover:opacity-90"
              )}
              style={!isActive ? { background: t.accent, color: light ? "#000" : "#05070d" } : undefined}
            >
              <Check size={12} /> {isActive ? "Currently active" : "Apply this template"}
            </button>
            <button onClick={onClose} className="w-9 h-9 grid place-items-center border border-white/20 rounded-sm text-steel-200 hover:border-accent-red hover:text-accent-red">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview frame */}
        <div className="flex-1 overflow-auto p-6 grid place-items-start" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl mx-auto overflow-hidden shadow-2xl"
            style={mockStyle}
          >
            <TemplateMockUp t={t} />
          </motion.div>
          <div className="w-full max-w-6xl mx-auto mt-4 p-4 rounded-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-start gap-2 text-steel-300 text-sm">
              <Palette size={14} className="mt-0.5 text-accent" />
              <div>
                <div className="font-serif text-steel-100">{t.name}</div>
                <div className="text-xs text-steel-400 mt-0.5">{t.desc}</div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono uppercase tracking-widest">
                  <span className="px-1.5 py-0.5 rounded-sm" style={{ border: `1px solid ${t.border}`, color: t.muted }}>{t.category}</span>
                  <span className="px-1.5 py-0.5 rounded-sm" style={{ border: `1px solid ${t.border}`, color: t.muted }}>{t.font}</span>
                  <span className="px-1.5 py-0.5 rounded-sm" style={{ border: `1px solid ${t.border}`, color: t.muted }}>{t.style}</span>
                  <span className="px-1.5 py-0.5 rounded-sm" style={{ border: `1px solid ${t.border}`, color: t.muted }}>accent {t.accent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** The actual rendered mini portfolio mockup for a theme. */
function TemplateMockUp({ t }: { t: ReturnType<typeof getT> }) {
  const accent = t.accent;
  const light = ["cream-editorial","paper-ink","blush-editorial","sage-paper","desert-vintage","mint-bubble","pure-minimal","slate-mono"].includes(t.id);
  const headingStyle: React.CSSProperties = { color: t.heading, fontFamily: t.font === "mono" ? "JetBrains Mono, monospace" : t.font === "display" ? "Bebas Neue, display" : t.font === "sans" ? "Inter, sans-serif" : "Playfair Display, serif" };
  const bodyStyle: React.CSSProperties = { color: t.text, fontFamily: t.font === "mono" ? "JetBrains Mono, monospace" : "Inter, sans-serif" };
  const mutedStyle: React.CSSProperties = { color: t.muted };

  const card = (addStyle?: React.CSSProperties): React.CSSProperties => ({
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: t.radius,
    padding: 18,
    ...addStyle,
  });

  return (
    <div className="relative" style={{ minHeight: 680 }}>
      {/* background noise/grid like real site */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        background: `radial-gradient(600px 300px at 80% -10%, ${accent}22, transparent 60%), radial-gradient(500px 250px at -10% 40%, ${accent}11, transparent 60%)`,
      }} />

      {/* Top nav */}
      <div className="relative flex items-center justify-between px-6 py-4">
        <div style={headingStyle} className="text-xl">
          <span style={{ color: accent, fontWeight: 900 }}>W</span>ahab <span style={{ fontStyle: "italic", fontFamily: "Playfair Display, serif" }}>Ahmad</span>
        </div>
        <div className="hidden sm:flex gap-4 text-[10px] font-mono uppercase tracking-widest" style={mutedStyle}>
          <span>Home</span><span>Workspace</span><span>Toolchain</span><span>Chronicle</span><span>Contact</span>
        </div>
        <div className="text-[10px] font-mono flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ border: `1px solid ${t.border}`, color: t.muted }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399" }} /> Available
        </div>
      </div>

      {/* Hero */}
      <div className="relative px-6 pt-6 pb-8 grid md:grid-cols-5 gap-6 items-center">
        <div className="md:col-span-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.3em] mb-3" style={mutedStyle}>// Portfolio · Vol 01 · Chak Jhumra</div>
          <div className="leading-[0.9]" style={headingStyle}>
            <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: t.font === "display" ? "0.05em" : "normal" }}>
              GIVE ME
            </div>
            <div style={{ fontSize: 56, fontWeight: 900 }}>
              AN <span style={{ color: accent, fontStyle: "italic", fontFamily: "Playfair Display, serif" }}>IDEA,</span>
            </div>
            <div style={{ fontSize: 56, fontWeight: 900 }}>
              I MAKE IT <span style={{ color: accent, fontStyle: "italic", fontFamily: "Playfair Display, serif" }}>PERFECT.</span>
            </div>
          </div>
          <p className="mt-4 max-w-md text-xs leading-relaxed" style={bodyStyle}>
            Multi-disciplinary craftsman bridging industrial textile design with autonomous software engineering — clean, sharp, and built to last.
          </p>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest" style={{ background: accent, color: light ? "#000" : "#05070d", borderRadius: t.radius, fontWeight: 700 }}>View Work →</button>
            <button className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest" style={{ border: `1px solid ${t.border}`, color: t.text, borderRadius: t.radius }}>Open Channel</button>
          </div>
          <div className="mt-5 grid grid-cols-3 text-center" style={{ border: `1px solid ${t.border}`, borderRadius: t.radius, overflow: "hidden" }}>
            {[["04+","Disciplines"],["120+","Works"],["02+","Years"]].map(([k,v])=>(
              <div key={k} className="p-2" style={{ borderRight: `1px solid ${t.border}` }}>
                <div className="text-lg font-black" style={{ color: accent, fontFamily: "Bebas Neue, display" }}>{k}</div>
                <div className="text-[8px] font-mono uppercase tracking-widest" style={mutedStyle}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="relative aspect-[4/5] overflow-hidden" style={{ borderRadius: t.radius, border: `1px solid ${t.border}` }}>
            <Image src="/profile.jpg" alt="Profile" fill sizes="240px" className="object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 50%, ${t.bg}ee 100%), linear-gradient(135deg, ${accent}22, transparent 60%)` }} />
            <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono uppercase tracking-widest p-2" style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.muted, borderRadius: t.radius }}>
              <div style={{ color: t.heading }} className="font-serif text-sm">Wahab Ahmad</div>
              Designer · Assistant Developer
            </div>
          </div>
        </div>
      </div>

      {/* Workspace section */}
      <div className="relative px-6 pb-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.3em]" style={mutedStyle}>// Selected Works</div>
            <div className="text-2xl font-serif" style={headingStyle}>Workspace</div>
          </div>
          <div className="flex gap-1 text-[9px] font-mono uppercase tracking-widest">
            {["All","Print","Textile","Web","Social"].map((f, i) => (
              <span key={f} className="px-2 py-1" style={{ border: `1px solid ${t.border}`, color: i === 0 ? accent : t.muted, borderColor: i === 0 ? accent : t.border, borderRadius: t.radius }}>{f}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["🎨","🧵","💻","📱"].map((em, i) => (
            <div key={i} style={card({ position: "relative" })}>
              <div className="aspect-[4/5] mb-2 grid place-items-center text-3xl rounded-sm" style={{ background: `linear-gradient(135deg, ${accent}22, ${t.bg})`, border: `1px solid ${t.border}` }}>{em}</div>
              <div className="text-[10px] font-serif" style={{ color: t.heading }}>Project {i+1}</div>
              <div className="text-[8px] font-mono uppercase tracking-widest mt-0.5" style={mutedStyle}>
                {["Screen Print","Textile","Web App","Social"][i]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience strip */}
      <div className="relative px-6 pb-6">
        <div style={card()}>
          <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            <span style={{ color: accent }}>Active Role</span>
          </div>
          <div className="font-serif text-base" style={headingStyle}>Senior Designer & Autonomous Engineer</div>
          <div className="font-serif text-sm" style={{ color: accent }}>Galaxy 42A (Inox)</div>
          <div className="text-[9px] font-mono uppercase tracking-widest mt-1" style={mutedStyle}>2023 — Present · Near Shahi Wala, Chak Jhumra</div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative px-6 py-3 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest" style={{ borderTop: `1px solid ${t.border}`, color: t.muted }}>
        <span>© Wahab Ahmad · Built from scratch</span>
        <span>accent: <span style={{ color: accent }}>{accent}</span></span>
      </div>
    </div>
  );
}

// helper for TS inference
function getT() { return (null as unknown as typeof TEMPLATES[keyof typeof TEMPLATES]); }
