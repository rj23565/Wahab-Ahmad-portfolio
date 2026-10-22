"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Download,
  ExternalLink,
  Filter,
  MonitorPlay,
  Shirt,
  Palette,
  Megaphone,
  X,
  Maximize2,
} from "lucide-react";
import { useEffect } from "react";
import { usePortfolio } from "@/lib/store";
import type { Asset, ProjectCategory } from "@/types";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

const CATEGORIES: {
  id: "all" | ProjectCategory;
  label: string;
  sub: string;
  icon: LucideIcon;
}[] = [
  { id: "all", label: "All Work", sub: "Complete Registry", icon: Filter },
  {
    id: "screen-printing",
    label: "Screen Printing & T-Shirt Layouts",
    sub: "Multi-color separations · Vector accuracy",
    icon: Palette,
  },
  {
    id: "textile",
    label: "Textile & Ladies Suit Designs",
    sub: "Apparel patterns · Retail concepts",
    icon: Shirt,
  },
  {
    id: "web-app",
    label: "Web & App Engineering",
    sub: "Scratch-built codebases · Live previews",
    icon: MonitorPlay,
  },
  {
    id: "social-media",
    label: "Social Media & Brand Collateral",
    sub: "High-converting social design",
    icon: Megaphone,
  },
];

const CAT_COLOR: Record<ProjectCategory, string> = {
  "screen-printing": "text-accent",
  textile: "text-accent-cyan",
  "web-app": "text-emerald-400",
  "social-media": "text-accent-red",
};

export default function Workspace() {
  const { projects } = usePortfolio();
  const [active, setActive] = useState<"all" | ProjectCategory>("all");
  const [lightboxAsset, setLightboxAsset] = useState<{
    asset: Asset;
    projectTitle: string;
  } | null>(null);
  const [zoom, setZoom] = useState(1);

  const closeLightbox = () => {
    setLightboxAsset(null);
    setZoom(1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxAsset) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
      if (e.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxAsset]);

  const filtered = useMemo(() => {
    if (active === "all") return projects;
    return projects.filter((p) => p.category === active);
  }, [projects, active]);

  return (
    <section id="work" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="section-label">// 02 — Registry</div>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl text-steel-100">
              Dynamic <span className="gold-gradient-text italic">Workspace</span>
            </h2>
            <p className="mt-4 text-steel-400 max-w-xl">
              A categorized portfolio of production-ready assets spanning
              physical print, textile production, engineered software, and brand
              systems. Click any asset to open a high-resolution framed preview.
            </p>
          </div>
          <div className="font-mono text-xs text-steel-400 border border-white/10 px-3 py-2 rounded-sm">
            <span className="text-accent">{filtered.length}</span> project
            {filtered.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-accent">
              {filtered.reduce(
                (n, p) => n + (p.assets?.length ?? 0),
                0
              )}
            </span>{" "}
            assets
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-10">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={cn(
                  "group relative px-4 py-3 border rounded-sm text-left transition-all duration-300 flex items-center gap-3 min-w-[180px]",
                  isActive
                    ? "border-accent/60 bg-accent/5 text-steel-100"
                    : "border-white/10 bg-white/[0.02] text-steel-300 hover:border-white/25 hover:text-steel-100"
                )}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-accent" : "text-steel-400"}
                />
                <div>
                  <div className="text-xs font-semibold tracking-wide">
                    {c.label}
                  </div>
                  <div className="text-[10px] font-mono text-steel-500 mt-0.5 hidden sm:block">
                    {c.sub}
                  </div>
                </div>
                {isActive && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute left-0 right-0 -bottom-px h-px bg-accent"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => {
              const cat = CATEGORIES.find((c) => c.id === p.category);
              const primaryAssets = (p.assets ?? []).slice(0, 4);
              const moreCount = (p.assets?.length ?? 0) - primaryAssets.length;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className="card rounded-sm p-5 relative group"
                >
                  <span className="bracket bracket-tl" />
                  <span className="bracket bracket-tr" />
                  <span className="bracket bracket-bl" />
                  <span className="bracket bracket-br" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 grid place-items-center border border-white/10 bg-white/[0.03] text-2xl rounded-sm relative overflow-hidden"
                        style={{
                          background:
                            p.coverImage
                              ? undefined
                              : `linear-gradient(135deg, ${p.coverColor ?? "#1c2750"}, #0a0e1a)`,
                        }}
                      >
                        {p.coverImage ? (
                          <Image
                            src={p.coverImage}
                            alt={p.title}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <span>{p.coverEmoji ?? "✦"}</span>
                        )}
                      </div>
                      <div>
                        <div
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-widest",
                            CAT_COLOR[p.category]
                          )}
                        >
                          {p.category.replace("-", " / ")}
                        </div>
                        <div className="font-mono text-[10px] text-steel-500">
                          ID · {p.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-5 font-serif text-xl text-steel-100 leading-tight">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-steel-400 leading-relaxed line-clamp-3">
                    {p.description}
                  </p>

                  {/* Asset thumbnail strip */}
                  {primaryAssets.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-1.5">
                      {primaryAssets.map((a) => {
                        const frame = frameClass(a.frame);
                        return (
                          <button
                            key={a.id}
                            onClick={() =>
                              setLightboxAsset({ asset: a, projectTitle: p.title })
                            }
                            className={cn(
                              "relative bg-midnight-950 border border-white/10 rounded-sm overflow-hidden hover:border-accent/50 transition group/t",
                              frame
                            )}
                            title={`${a.aiTitle} — click to preview`}
                          >
                            <div className="relative w-full h-full">
                              <Image
                                src={a.thumbnailUrl}
                                alt={a.aiTitle}
                                fill
                                sizes="80px"
                                className="object-contain"
                              />
                            </div>
                            <span className="absolute inset-0 bg-black/0 group-hover/t:bg-black/30 transition grid place-items-center">
                              <Maximize2
                                size={12}
                                className="text-white opacity-0 group-hover/t:opacity-100 transition"
                              />
                            </span>
                          </button>
                        );
                      })}
                      {moreCount > 0 && (
                        <div className="grid place-items-center bg-white/[0.03] border border-white/10 rounded-sm text-[10px] font-mono text-steel-400">
                          +{moreCount}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-white/10 text-steel-300 rounded-sm bg-white/[0.02]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    {p.liveUrl && p.liveUrl !== "#" ? (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hot"
                      >
                        <ExternalLink size={12} /> Live Preview
                      </a>
                    ) : (
                      <span className="text-xs text-steel-500 font-mono">
                        {p.assets?.length
                          ? `${p.assets.length} file${p.assets.length > 1 ? "s" : ""} attached`
                          : "Preview coming soon"}
                      </span>
                    )}
                    {p.downloadUrl && p.downloadUrl !== "#" ? (
                      <a
                        href={p.downloadUrl}
                        className="inline-flex items-center gap-1.5 text-xs text-steel-300 hover:text-accent"
                      >
                        <Download size={12} /> Asset
                      </a>
                    ) : p.assets?.length ? (
                      <button
                        onClick={() =>
                          setLightboxAsset({
                            asset: p.assets![0],
                            projectTitle: p.title,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs text-steel-300 hover:text-accent"
                      >
                        <Maximize2 size={12} /> Open Gallery
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-sm text-steel-500 font-mono text-sm">
            // No entries in this category yet — add one from the command console.
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-black/95 backdrop-blur-xl"
            onClick={closeLightbox}
            style={{ cursor: "zoom-out" }}
          >
            {/* Top bar */}
            <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
              <button
                onClick={closeLightbox}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent"
              >
                ← Back
              </button>
              <div className="text-center">
                <div className="font-serif text-sm text-steel-100">{lightboxAsset.projectTitle}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-steel-500">
                  {lightboxAsset.asset.width}×{lightboxAsset.asset.height} · {frameLabel(lightboxAsset.asset.frame)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))); }}
                  className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent"
                  title="Zoom out"
                >−</button>
                <span className="text-[10px] font-mono text-steel-300 px-1 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); }}
                  className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent"
                  title="Zoom in"
                >+</button>
                <button
                  onClick={(e) => { e.stopPropagation(); setZoom(1); }}
                  className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent"
                  title="Reset zoom"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const a = document.createElement("a");
                    a.href = lightboxAsset.asset.dataUrl;
                    a.download = `${lightboxAsset.asset.aiTitle.replace(/\s+/g, "-")}.jpg`;
                    a.click();
                  }}
                  className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent-cyan hover:text-accent-cyan"
                  title="Download original"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                  className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent-red hover:text-accent-red"
                  title="Close (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="w-full h-full grid place-items-center p-10 overflow-auto" onClick={closeLightbox}>
              <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "relative rounded-sm overflow-hidden border border-accent/30 shadow-edge bg-midnight-900 transition-transform duration-200",
                  "max-w-[92vw]"
                )}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  cursor: zoom > 1 ? "grab" : "default",
                }}
              >
                <div className={cn("relative", frameClass(lightboxAsset.asset.frame), "w-[70vw] max-w-5xl")} style={{ maxHeight: "78vh" }}>
                  <Image
                    src={lightboxAsset.asset.dataUrl}
                    alt={lightboxAsset.asset.aiTitle}
                    fill
                    sizes="90vw"
                    quality={100}
                    className="object-contain"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Caption */}
            <div className="absolute bottom-4 inset-x-0 text-center px-6 pointer-events-none">
              <div className="inline-block bg-black/60 backdrop-blur border border-white/10 rounded-sm px-4 py-2 pointer-events-auto">
                <div className="font-serif text-base text-steel-100">{lightboxAsset.asset.aiTitle}</div>
                <div className="text-[11px] text-steel-400 max-w-xl mx-auto mt-1">
                  {lightboxAsset.asset.aiDescription}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function frameClass(frame: Asset["frame"]) {
  switch (frame) {
    case "tshirt": return "aspect-[3/4]";
    case "poster": return "aspect-[2/3]";
    case "landscape": return "aspect-[16/9]";
    case "square": return "aspect-square";
    case "textile": return "aspect-[21/9]";
    case "web": return "aspect-[16/10]";
    case "mobile": return "aspect-[9/16]";
    case "social": return "aspect-[4/5]";
    default: return "aspect-auto";
  }
}
function frameLabel(frame: Asset["frame"]) {
  const labels: Record<Asset["frame"], string> = {
    tshirt: "T-Shirt 3:4", poster: "Poster 2:3", landscape: "Landscape 16:9",
    square: "Square 1:1", textile: "Textile Repeat 21:9", web: "Web 16:10",
    mobile: "Mobile/Story 9:16", social: "Social 4:5", auto: "Native",
  };
  return labels[frame];
}
