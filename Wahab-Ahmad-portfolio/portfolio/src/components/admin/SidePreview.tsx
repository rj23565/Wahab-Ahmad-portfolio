"use client";

import { Check, X, Save } from "lucide-react";
import { usePortfolio, type TemplateDef } from "@/lib/store";
import type { ThemeTemplateId } from "@/types";

interface Props {
  templateId: ThemeTemplateId;
  activeId: ThemeTemplateId;
  onApply: (id: ThemeTemplateId) => void;
  onClose?: () => void;
}

/**
 * Side-preview: shows a scaled, fully-visible mini portfolio mockup on the right
 * side of the Templates tab, with Apply button. Fits inside the side panel
 * without scrolling (using CSS transform: scale).
 */
export default function SidePreview({ templateId, activeId, onApply, onClose }: Props) {
  const { allTemplates } = usePortfolio();
  const t = allTemplates()[templateId];
  if (!t) return null;
  const isActive = activeId === templateId;
  const light = ["cream-editorial","paper-ink","blush-editorial","sage-paper","desert-vintage","mint-bubble","pure-minimal","slate-mono"].includes(t.id);

  const frame: React.CSSProperties = {
    background: t.bg,
    color: t.text,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    overflow: "hidden",
    boxShadow: `0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px ${t.border}`,
  };

  return (
    <div className="rounded-sm border border-white/10 bg-black/40 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-sm grid place-items-center shrink-0" style={{ background: t.accent + "22", border: `1px solid ${t.accent}55` }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: t.accent }} />
          </div>
          <div className="min-w-0">
            <div className="font-serif text-sm text-steel-100 truncate">{t.name}</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-steel-500 truncate">{t.category} · {t.style}</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-6 h-6 grid place-items-center text-steel-500 hover:text-accent-red">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Scaled preview frame — fixed-design at 480×720, scaled down to fit panel */}
      <div className="rounded-sm overflow-hidden" style={{ background: "#0a0a0d", border: "1px solid #1f1f28" }}>
        <div style={{ width: 480 * 0.74, height: 720 * 0.74, position: "relative", margin: "0 auto" }}>
          <div
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: 480, height: 720,
              transformOrigin: "top left",
              transform: "scale(0.74)",
              ...frame,
            }}
          >
            <MockContent t={t} light={light} />
          </div>
        </div>
      </div>

      {/* Meta + actions */}
      <div className="mt-3">
        <p className="text-[10px] leading-snug text-steel-400">{t.desc}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {t.swatches.map((c, i) => (
            <div key={i} className="w-4 h-4 rounded-sm border" style={{ background: c, borderColor: "rgba(255,255,255,0.1)" }} title={c} />
          ))}
          <span className="ml-auto text-[9px] font-mono text-steel-500">accent {t.accent}</span>
        </div>
        <button
          onClick={() => onApply(t.id)}
          disabled={isActive}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest rounded-sm font-semibold transition disabled:opacity-60"
          style={{
            background: isActive ? "rgba(52,211,153,0.15)" : t.accent,
            color: isActive ? "#34d399" : light ? "#000" : "#05070d",
            border: isActive ? "1px solid rgba(52,211,153,0.4)" : "1px solid transparent",
          }}
        >
          {isActive ? <><Check size={11} /> ✓ Currently Live</> : <><Save size={11} /> Apply {t.name}</>}
        </button>
      </div>
    </div>
  );
}

/** Mini portfolio mockup content, designed at 480×720. */
function MockContent({ t, light }: { t: TemplateDef; light: boolean }) {
  const h: React.CSSProperties = { color: t.heading, fontFamily: t.font === "mono" ? "'JetBrains Mono', monospace" : t.font === "display" ? "'Bebas Neue', sans-serif" : t.font === "sans" ? "Inter, sans-serif" : "'Playfair Display', serif" };
  return (
    <div style={{ width: 480, height: 720, position: "relative", background: `radial-gradient(500px 240px at 80% -10%, ${t.accent}22, transparent 60%), radial-gradient(380px 200px at -10% 40%, ${t.swatches[1]}55, transparent 60%), ${t.bg}`, display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <div style={{ padding: "18px 22px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={h}>
          <span style={{ fontWeight: 900, fontSize: 24, color: t.accent }}>W</span><span style={{ fontSize: 20, color: t.heading }}>ahab</span>
          <span style={{ fontSize: 20, fontStyle: "italic", color: t.heading, marginLeft: 2 }}>Ahmad</span>
          <span style={{ marginLeft: 4, color: t.accent, fontSize: 14 }}>_</span>
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: t.muted, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          <span>Home</span><span>Work</span><span>Tools</span><span>Chron</span>
        </div>
      </div>

      {/* Hero tagline */}
      <div style={{ padding: "4px 22px 0" }}>
        <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.3em", textTransform: "uppercase", color: t.muted }}>// Portfolio · Vol 01</div>
        <div style={{ marginTop: 6, ...h, fontSize: 38, lineHeight: 0.9, fontWeight: 900, letterSpacing: t.font === "display" ? "0.03em" : "normal" }}>
          <div>GIVE ME</div>
          <div>AN <span style={{ color: t.accent, fontStyle: "italic" }}>IDEA,</span></div>
          <div>I MAKE IT</div>
          <div><span style={{ color: t.accent, fontStyle: "italic" }}>PERFECT.</span></div>
        </div>
        <div style={{ marginTop: 8, height: 3, width: "65%", borderRadius: 2, background: `linear-gradient(90deg, ${t.accent}88, ${t.accent}22)` }} />
      </div>

      {/* CTAs */}
      <div style={{ padding: "10px 22px 0", display: "flex", gap: 6 }}>
        <div style={{ background: t.accent, color: light ? "#000" : "#05070d", padding: "6px 12px", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, borderRadius: t.radius }}>View Work →</div>
        <div style={{ border: `1px solid ${t.border}`, color: t.text, padding: "6px 12px", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.15em", borderRadius: t.radius }}>Contact</div>
      </div>

      {/* Works grid */}
      <div style={{ padding: "14px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
        {[
          { emoji: "🎨", label: "Screen Print", cat: "SCREEN PRINT" },
          { emoji: "🧵", label: "Textile", cat: "TEXTILE" },
          { emoji: "💻", label: "Web App", cat: "WEB APP" },
          { emoji: "📱", label: "Social", cat: "SOCIAL" },
        ].map((w, i) => (
          <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius, overflow: "hidden" }}>
            <div style={{ aspectRatio: "3/4", position: "relative", background: `linear-gradient(135deg, ${t.swatches[1]}44, ${t.bg})`, display: "grid", placeItems: "center", fontSize: 24 }}>
              {w.emoji}
            </div>
            <div style={{ padding: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: t.heading }}>{w.label}</div>
              <div style={{ fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: t.muted, marginTop: 1 }}>{w.cat}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active role card */}
      <div style={{ margin: "14px 22px 0", padding: 10, border: `1px solid ${t.border}`, background: t.surface, borderRadius: t.radius, position: "relative" }}>
        <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: t.accent, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent }} /> Active Role
        </div>
        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: t.heading, ...h }}>Senior Designer & Engineer</div>
        <div style={{ fontSize: 12, fontStyle: "italic", color: t.accent, ...h }}>Galaxy 42A (Inox)</div>
        <div style={{ marginTop: 3, fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: t.muted }}>
          2023 — Present · Chak Jhumra
        </div>
      </div>

      {/* Education chips row */}
      <div style={{ margin: "10px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {["Matric · 82%", "F.A. · 64%", "Graphic Design · 69% · Merit", "Web Building · Pro"].map((e, i) => (
          <div key={i} style={{ padding: "5px 8px", border: `1px solid ${t.border}`, background: t.surface, borderRadius: t.radius, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: i === 2 ? t.accent : t.accent + "88" }} />
            <span style={{ fontSize: 7, fontFamily: "'JetBrains Mono', monospace", color: t.text, letterSpacing: "0.05em" }}>{e}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", padding: "8px 22px", borderTop: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: t.muted }}>
        <span>© Wahab Ahmad · Built from scratch</span>
        <span style={{ color: t.accent }}>ACCENT: {t.accent.toUpperCase()}</span>
      </div>
    </div>
  );
}
