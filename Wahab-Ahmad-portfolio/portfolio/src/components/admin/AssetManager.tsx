"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Download,
  Loader2,
  Wand2,
  Check,
  X,
  Maximize2,
  Layers,
  Grid3x3,
} from "lucide-react";
import { usePortfolio } from "@/lib/store";
import {
  analyzeImage,
  downloadDataUrl,
  enhanceImage,
  makeThumbnail,
  readFile,
} from "@/lib/imageAI";
import type { Asset, AssetFrame, Project } from "@/types";
import { cn } from "@/lib/cn";

const FRAME_LABELS: Record<AssetFrame, { label: string; w: string; h: string; ratio: string }> = {
  tshirt: { label: "T-Shirt", w: "aspect-[3/4]", h: "", ratio: "3:4" },
  poster: { label: "Poster", w: "aspect-[2/3]", h: "", ratio: "2:3" },
  landscape: { label: "Landscape", w: "aspect-[16/9]", h: "", ratio: "16:9" },
  square: { label: "Square", w: "aspect-square", h: "", ratio: "1:1" },
  textile: { label: "Textile Repeat", w: "aspect-[21/9]", h: "", ratio: "21:9" },
  web: { label: "Web Preview", w: "aspect-[16/10]", h: "", ratio: "16:10" },
  mobile: { label: "Mobile/Story", w: "aspect-[9/16]", h: "", ratio: "9:16" },
  social: { label: "Social 4:5", w: "aspect-[4/5]", h: "", ratio: "4:5" },
  auto: { label: "Auto", w: "aspect-auto", h: "", ratio: "native" },
};

export default function AssetManager() {
  const { projects, addProject, updateProject } = usePortfolio();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ cur: number; total: number } | null>(null);
  const [lightbox, setLightbox] = useState<Asset | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const closeLightbox = () => { setLightbox(null); setZoom(1); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
      if (e.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!files.length || !selectedProject) return;
      setBusy(true);
      setProgress({ cur: 0, total: files.length });
      const assets: Asset[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i] as File;
        if (!f.type.startsWith("image/")) continue;
        try {
          const { dataUrl, width, height, mime, size } = await readFile(f);
          const [thumb, analysis] = await Promise.all([
            makeThumbnail(dataUrl, 720),
            analyzeImage(dataUrl),
          ]);
          assets.push({
            id: `a_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
            name: f.name || `asset-${i + 1}`,
            dataUrl: dataUrl,
            thumbnailUrl: thumb,
            mime,
            size,
            width,
            height,
            frame: analysis.frame,
            aiTitle: analysis.aiTitle,
            aiDescription: analysis.aiDescription,
            aiTags: analysis.aiTags,
            enhanced: false,
            uploadedAt: Date.now(),
          });
        } catch (e) {
          console.warn("skip file", f.name, e);
        }
        setProgress({ cur: i + 1, total: files.length });
      }
      if (assets.length) {
        const existing = selectedProject.assets ?? [];
        const cover = selectedProject.coverImage ?? assets[0].thumbnailUrl;
        // auto-merge AI tags
        const newTags = Array.from(
          new Set([...(selectedProject.tags ?? []), ...assets.flatMap((a) => a.aiTags)])
        ).slice(0, 10);
        updateProject(selectedProject.id, {
          assets: [...assets, ...existing],
          coverImage: cover,
          tags: newTags,
        });
      }
      setBusy(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    [selectedProject, updateProject]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const selectAll = () => {
    if (!selectedProject?.assets) return;
    setSelected(new Set(selectedProject.assets.map((a) => a.id)));
  };
  const clearSelection = () => setSelected(new Set());

  const enhanceSelected = async () => {
    if (!selectedProject) return;
    setBusy(true);
    const assets = [...(selectedProject.assets ?? [])];
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      if (!selected.has(a.id) || a.enhanced) continue;
      const enhanced = await enhanceImage(a.dataUrl);
      const enhancedThumb = await makeThumbnail(enhanced, 720);
      assets[i] = {
        ...a,
        dataUrl: enhanced,
        thumbnailUrl: enhancedThumb,
        enhanced: true,
      };
    }
    updateProject(selectedProject.id, { assets });
    setBusy(false);
  };

  const deleteSelected = () => {
    if (!selectedProject) return;
    if (!confirm(`Delete ${selected.size} selected asset(s)?`)) return;
    const remaining = (selectedProject.assets ?? []).filter(
      (a) => !selected.has(a.id)
    );
    updateProject(selectedProject.id, { assets: remaining });
    setSelected(new Set());
  };

  const downloadSelected = () => {
    if (!selectedProject) return;
    (selectedProject.assets ?? [])
      .filter((a) => selected.has(a.id))
      .forEach((a, idx) => {
        setTimeout(() => {
          const base = a.name.replace(/\.[^.]+$/, "");
          downloadDataUrl(a.dataUrl, `${base}${a.enhanced ? "-enhanced" : ""}.jpg`);
        }, idx * 220);
      });
  };

  const deleteOne = (id: string) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, {
      assets: (selectedProject.assets ?? []).filter((a) => a.id !== id),
    });
  };

  const updateAsset = (id: string, patch: Partial<Asset>) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, {
      assets: (selectedProject.assets ?? []).map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    });
  };

  const makeCover = (asset: Asset) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, { coverImage: asset.thumbnailUrl });
  };

  const autoProjectFromSelection = () => {
    if (selected.size === 0 || !selectedProject) return;
    const picks = (selectedProject.assets ?? []).filter((a) => selected.has(a.id));
    if (picks.length === 0) return;
    // pick best category by majority
    const catVote: Record<string, number> = {};
    picks.forEach((p) => {
      const c = guessCatFromFrame(p.frame);
      catVote[c] = (catVote[c] ?? 0) + 1;
    });
    const category = (Object.entries(catVote).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "screen-printing") as Project["category"];
    const title = picks[0].aiTitle || "New AI-Assembled Project";
    addProject({
      title,
      description:
        picks[0].aiDescription ||
        `Auto-assembled from ${picks.length} uploaded design${picks.length > 1 ? "s" : ""}.`,
      category,
      tags: Array.from(new Set(picks.flatMap((p) => p.aiTags))),
      coverImage: picks[0].thumbnailUrl,
      coverEmoji: emojiFor(category),
      coverColor: picks[0] ? awaitDominant(picks[0].dataUrl) : "#1c2750",
      assets: picks,
    });
    // remove from current project
    updateProject(selectedProject.id, {
      assets: (selectedProject.assets ?? []).filter(
        (a) => !selected.has(a.id)
      ),
    });
    setSelected(new Set());
  };

  const assets = selectedProject?.assets ?? [];

  return (
    <div className="card rounded-sm relative overflow-hidden">
      <span className="bracket bracket-tl" />
      <span className="bracket bracket-br" />
      <div className="p-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 grid place-items-center bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 rounded-sm">
            <Layers size={16} />
          </div>
          <div>
            <div className="font-serif text-lg text-steel-100">Asset Studio</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
              Multi-upload · AI titling · Auto-framing · Sharpening
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelected(new Set());
            }}
            className="bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm text-steel-200"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-edge inline-flex items-center gap-2 px-3 py-2 bg-accent text-midnight-950 font-semibold text-sm rounded-sm"
          >
            <Upload size={14} /> Upload Files
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 bg-black/20">
        <div className="flex items-center gap-2 text-xs font-mono text-steel-400">
          <Grid3x3 size={12} className="text-accent" />
          {assets.length} asset{assets.length !== 1 ? "s" : ""} in project
          {selected.size > 0 && (
            <>
              <span className="text-steel-600">·</span>
              <span className="text-accent">{selected.size} selected</span>
            </>
          )}
          {busy && (
            <>
              <span className="text-steel-600">·</span>
              <span className="text-accent-cyan flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                {progress ? `${progress.cur}/${progress.total}` : "processing…"}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={selectAll}
            className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 text-steel-300 hover:text-accent rounded-sm"
          >All</button>
          <button
            onClick={clearSelection}
            className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-white/10 text-steel-300 hover:text-accent rounded-sm"
          >None</button>
          <button
            onClick={enhanceSelected}
            disabled={!selected.size || busy}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10 rounded-sm disabled:opacity-40"
          ><Wand2 size={10} /> AI Sharpen</button>
          <button
            onClick={downloadSelected}
            disabled={!selected.size}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/10 rounded-sm disabled:opacity-40"
          ><Download size={10} /> Download</button>
          <button
            onClick={autoProjectFromSelection}
            disabled={!selected.size}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-accent/40 text-accent hover:bg-accent/10 rounded-sm disabled:opacity-40"
          ><Sparkles size={10} /> New Project from Selection</button>
          <button
            onClick={deleteSelected}
            disabled={!selected.size}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-accent-red/40 text-accent-red hover:bg-accent-red/10 rounded-sm disabled:opacity-40"
          ><Trash2 size={10} /> Delete</button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="p-4">
        {assets.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-3 p-16 border-2 border-dashed border-white/10 rounded-sm cursor-pointer hover:border-accent/40 transition">
            <div className="w-14 h-14 grid place-items-center bg-accent/10 border border-accent/30 text-accent rounded-full">
              <Upload size={22} />
            </div>
            <div className="font-serif text-lg text-steel-200">Drop or upload designs</div>
            <div className="text-xs font-mono text-steel-500 text-center max-w-sm">
              Select one project, then upload as many files as you want. The AI
              will title, tag, frame, sharpen, and catalog each asset. Click an
              asset for a full-res lightbox preview.
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </label>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {assets.map((a) => {
              const frame = FRAME_LABELS[a.frame];
              const isSelected = selected.has(a.id);
              return (
                <div
                  key={a.id}
                  className={cn(
                    "group relative rounded-sm border bg-white/[0.02] overflow-hidden transition",
                    isSelected ? "border-accent ring-1 ring-accent" : "border-white/10 hover:border-accent/40"
                  )}
                >
                  <button
                    onClick={() => setLightbox(a)}
                    className={cn(
                      "relative w-full bg-midnight-900 grid place-items-center overflow-hidden",
                      frame.w
                    )}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={a.thumbnailUrl}
                        alt={a.aiTitle}
                        fill
                        sizes="280px"
                        className="object-contain"
                      />
                    </div>
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-mono bg-black/70 border border-white/10 px-1.5 py-0.5 rounded-sm text-steel-200">
                      {frame.label} · {a.width}×{a.height}
                    </span>
                    {a.enhanced && (
                      <span className="absolute top-1.5 right-8 text-[9px] font-mono bg-emerald-400/20 border border-emerald-400/40 px-1.5 py-0.5 rounded-sm text-emerald-300">
                        AI HD
                      </span>
                    )}
                    <span className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition w-6 h-6 grid place-items-center bg-black/70 border border-white/10 rounded-sm">
                      <Maximize2 size={12} className="text-steel-200" />
                    </span>
                  </button>

                  <button
                    onClick={() => toggleSelect(a.id)}
                    className={cn(
                      "absolute bottom-[42%] left-2 w-6 h-6 grid place-items-center rounded-sm border transition z-10",
                      isSelected
                        ? "bg-accent text-midnight-950 border-accent"
                        : "bg-midnight-950/70 text-steel-400 border-white/20 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isSelected ? <Check size={12} /> : <div className="w-2.5 h-2.5" />}
                  </button>

                  <div className="p-2 border-t border-white/5 bg-black/30">
                    <input
                      value={a.aiTitle}
                      onChange={(e) => updateAsset(a.id, { aiTitle: e.target.value })}
                      className="w-full bg-transparent text-[11px] font-semibold text-steel-100 focus:outline-none focus:text-accent truncate"
                    />
                    <div className="mt-0.5 text-[10px] text-steel-500 line-clamp-2 leading-snug">
                      {a.aiDescription}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {a.aiTags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[9px] font-mono px-1 py-px border border-white/10 rounded-sm text-steel-400">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        <button
                          onClick={() => makeCover(a)}
                          title="Use as project cover"
                          className="w-6 h-6 grid place-items-center border border-white/10 rounded-sm text-steel-400 hover:text-accent hover:border-accent/40"
                        >
                          <ImageIcon size={11} />
                        </button>
                        <button
                          onClick={async () => {
                            setBusy(true);
                            const enhanced = await enhanceImage(a.dataUrl);
                            const thumb = await makeThumbnail(enhanced, 720);
                            updateAsset(a.id, { dataUrl: enhanced, thumbnailUrl: thumb, enhanced: true });
                            setBusy(false);
                          }}
                          title="AI sharpen"
                          className="w-6 h-6 grid place-items-center border border-white/10 rounded-sm text-steel-400 hover:text-emerald-400 hover:border-emerald-400/40"
                        >
                          <Wand2 size={11} />
                        </button>
                        <button
                          onClick={() => downloadDataUrl(a.dataUrl, `${a.aiTitle.replace(/\s+/g, "-")}${a.enhanced ? "-hd" : ""}.jpg`)}
                          title="Download"
                          className="w-6 h-6 grid place-items-center border border-white/10 rounded-sm text-steel-400 hover:text-accent-cyan hover:border-accent-cyan/40"
                        >
                          <Download size={11} />
                        </button>
                      </div>
                      <button
                        onClick={() => deleteOne(a.id)}
                        title="Delete"
                        className="w-6 h-6 grid place-items-center border border-white/10 rounded-sm text-steel-500 hover:text-accent-red hover:border-accent-red/40"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-auto"
          onClick={closeLightbox}
          style={{ cursor: "zoom-out" }}
        >
          {/* Top bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 to-transparent">
            <button
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent"
            >
              ← Back
            </button>
            <div className="text-center">
              <div className="font-serif text-sm text-steel-100">{lightbox.aiTitle}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-steel-500">
                {lightbox.width}×{lightbox.height} · {FRAME_LABELS[lightbox.frame].ratio}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))); }} className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent">−</button>
              <span className="text-[10px] font-mono text-steel-300 px-1 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); }} className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent">+</button>
              <button onClick={(e) => { e.stopPropagation(); setZoom(1); }} className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent hover:text-accent"><Maximize2 size={14} /></button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDataUrl(lightbox.dataUrl, `${lightbox.aiTitle.replace(/\s+/g, "-")}${lightbox.enhanced ? "-hd" : ""}.jpg`);
                }}
                className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent-cyan hover:text-accent-cyan"
              ><Download size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="w-9 h-9 grid place-items-center text-steel-200 border border-white/20 bg-black/50 rounded-sm hover:border-accent-red hover:text-accent-red"><X size={16} /></button>
            </div>
          </div>

          <div className="w-full min-h-[80vh] grid place-items-center p-6" onClick={closeLightbox}>
            <div
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative rounded-sm overflow-hidden border border-accent/30 shadow-edge bg-midnight-900 transition-transform duration-200 max-w-[92vw]"
              )}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center", cursor: zoom > 1 ? "grab" : "default" }}
            >
              <div className={cn("relative", FRAME_LABELS[lightbox.frame].w, "w-[70vw] max-w-5xl")} style={{ maxHeight: "78vh" }}>
                <Image src={lightbox.dataUrl} alt={lightbox.aiTitle} fill sizes="90vw" quality={100} className="object-contain" draggable={false} />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 inset-x-0 pb-4 pt-2 text-center">
            <div className="inline-block bg-black/60 backdrop-blur border border-white/10 rounded-sm px-4 py-2">
              <div className="text-[11px] text-steel-400 max-w-xl">{lightbox.aiDescription}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- helpers --- */
function guessCatFromFrame(frame: AssetFrame): Project["category"] {
  if (frame === "web" || frame === "landscape") return "web-app";
  if (frame === "mobile" || frame === "social" || frame === "square") return "social-media";
  if (frame === "textile") return "textile";
  return "screen-printing";
}
function emojiFor(cat: Project["category"]) {
  return cat === "web-app" ? "💻" : cat === "textile" ? "🧵" : cat === "social-media" ? "📱" : "🎨";
}
function awaitDominant(_dataUrl: string) {
  // quick brand color default; the AI will refine on next pass if needed
  return "#1c2750";
}
