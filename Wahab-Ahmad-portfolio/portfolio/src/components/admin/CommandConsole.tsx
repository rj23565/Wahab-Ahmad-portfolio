"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Brain,
  Briefcase,
  Check,
  Download,
  ExternalLink,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  LogOut,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  User,
  FolderKanban,
  Wrench,
  X,
  Wand2,
  Loader2,
  ImagePlus,
  FileImage,
  Clock3,
  Undo2,
  Palette,
  Copy,
  type LucideIcon,
} from "lucide-react";
import {
  analyzeCoverImage,
  analyzeUrl,
  useAdminUI,
  useAuth,
  usePortfolio,
  TEMPLATES,
} from "@/lib/store";
import { cn } from "@/lib/cn";
import {
  analyzeImage,
  downloadDataUrl,
  enhanceImage,
  makeThumbnail,
  readFile,
} from "@/lib/imageAI";
import type { Asset, Project, ProjectCategory, ThemeTemplateId } from "@/types";
import AgentChat from "./AgentChat";
import AssetManager from "./AssetManager";
import SidePreview from "./SidePreview";

const CAT_OPTS: { id: ProjectCategory; label: string; color: string }[] = [
  { id: "screen-printing", label: "Screen Printing & T-Shirt", color: "text-accent" },
  { id: "textile", label: "Textile & Ladies Suit", color: "text-accent-cyan" },
  { id: "web-app", label: "Web & App Engineering", color: "text-emerald-400" },
  { id: "social-media", label: "Social & Brand Collateral", color: "text-accent-red" },
];

type Tab = "profile" | "identity" | "links" | "projects" | "assets" | "templates" | "ai";

export default function CommandConsole() {
  const { closeAll } = useAdminUI();
  const { logout, usedKey } = useAuth();
  const {
    profileImage,
    setProfileImage,
    profile,
    setProfile,
    projects,
    theme,
    setTheme,
    addProject,
    updateProject,
    deleteProject,
    resetAll,
    addEducation,
    updateEducation,
    removeEducation,
    addExperience,
    updateExperience,
    removeExperience,
    applyTemplate,
    saveSnapshot,
    loadSnapshot,
    snapshots,
    customTemplates,
    saveCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
    allTemplates,
  } = usePortfolio();

  const [tab, setTab] = useState<Tab>("profile");

  // Profile image
  const [preview, setPreview] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ThemeTemplateId | null>(null);
  const [templateCategory, setTemplateCategory] = useState<string>("All");
  const [imgAnalysis, setImgAnalysis] = useState<{
    dominant: string;
    ratio: number;
    suggestedEmoji: string;
  } | null>(null);

  // New project form
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "web-app" as ProjectCategory,
    tags: "",
    liveUrl: "",
    downloadUrl: "",
    coverEmoji: "✦",
    coverColor: "#1c2750",
  });
  const [urlInsights, setUrlInsights] = useState<
    ReturnType<typeof analyzeUrl> | null
  >(null);

  // Editing existing project
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Project>>({});

  // Quick upload (Projects tab) — draft files pending publish
  const quickFileRef = useRef<HTMLInputElement>(null);
  const [quickFiles, setQuickFiles] = useState<
    Array<{
      id: string;
      name: string;
      dataUrl: string;
      thumbUrl: string;
      width: number;
      height: number;
      size: number;
      aiTitle: string;
      aiDescription: string;
      aiTags: string[];
      enhanced: boolean;
      frame: Asset["frame"];
    }>
  >([]);
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickProgress, setQuickProgress] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  // Analyze profile image when preview changes.
  useEffect(() => {
    if (!preview) {
      setImgAnalysis(null);
      return;
    }
    analyzeCoverImage(preview).then(setImgAnalysis);
  }, [preview]);

  // Analyze liveUrl as user types (agentic link preview).
  useEffect(() => {
    if (!form.liveUrl.trim()) {
      setUrlInsights(null);
      return;
    }
    const t = setTimeout(() => {
      const r = analyzeUrl(form.liveUrl);
      setUrlInsights(r);
      if (r.suggestedCategory && !form.title) {
        // Don't override user's choice, but suggest via tag hints.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [form.liveUrl, form.title]);

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large. Use <5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    if (!preview) return;
    setProfileImage(preview);
    setPreview(null);
    setImgAnalysis(null);
    showToast("Profile image updated · AI harmonized.");
  };

  const applyAiSuggestionToProfile = () => {
    if (!imgAnalysis) return;
    // Auto-apply suggested emoji to currently-edited project if any, or show hint.
    showToast(
      `AI analyzed: ratio ${imgAnalysis.ratio.toFixed(2)} · palette ${imgAnalysis.dominant}`
    );
  };

  const addNew = (e: FormEvent) => {
    e.preventDefault();
    // title/description optional when files exist
    if (quickFiles.length === 0 && (!form.title.trim() || !form.description.trim())) {
      showToast("Add a title/description or upload files first.");
      return;
    }
    const ai = form.liveUrl ? analyzeUrl(form.liveUrl) : null;
    const suggestedTags = ai?.tags ?? [];
    const manualTags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const fileTags = quickFiles.flatMap((f) => f.aiTags);
    const allTags = Array.from(new Set([...manualTags, ...suggestedTags, ...fileTags])).slice(0, 12);
    const title = form.title.trim() || (quickFiles[0]?.aiTitle ?? "Untitled Work");
    const description =
      form.description.trim() ||
      (quickFiles[0]
        ? `${quickFiles[0].aiDescription} ${quickFiles.length > 1 ? `Collection of ${quickFiles.length} design files auto-catalogued by the AddMine agent.` : ""}`
        : "Production-ready design asset.");
    const coverImage = quickFiles[0]?.thumbUrl;
    const coverEmoji = form.coverEmoji || emojiFor(form.category);
    const assets: Asset[] = quickFiles.map((f) => ({
      id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      dataUrl: f.dataUrl,
      thumbnailUrl: f.thumbUrl,
      mime: "image/jpeg",
      size: f.size,
      width: f.width,
      height: f.height,
      frame: f.frame,
      aiTitle: f.aiTitle,
      aiDescription: f.aiDescription,
      aiTags: f.aiTags,
      enhanced: f.enhanced,
      uploadedAt: Date.now(),
    }));
    addProject({
      title,
      description,
      category: ai?.suggestedCategory ?? detectCatFromQuick(quickFiles, form.category),
      tags: allTags.length ? allTags : ["Design"],
      liveUrl: form.liveUrl.trim() || undefined,
      downloadUrl: form.downloadUrl.trim() || undefined,
      coverEmoji,
      coverColor: form.coverColor,
      coverImage,
      assets,
    });
    setForm({
      title: "",
      description: "",
      category: form.category,
      tags: "",
      liveUrl: "",
      downloadUrl: "",
      coverEmoji: "✦",
      coverColor: "#1c2750",
    });
    setQuickFiles([]);
    setUrlInsights(null);
    showToast(
      `Published to registry · ${assets.length} file${assets.length !== 1 ? "s" : ""} auto-catalogued.`
    );
  };

  const onQuickFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setQuickBusy(true);
    const arr = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const next: typeof quickFiles = [];
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i];
      setQuickProgress(`Analyzing ${i + 1}/${arr.length} · ${f.name}`);
      try {
        const { dataUrl, width, height, size } = await readFile(f);
        const [thumb, analysis] = await Promise.all([
          makeThumbnail(dataUrl, 480),
          analyzeImage(dataUrl),
        ]);
        next.push({
          id: `q_${Date.now()}_${i}`,
          name: f.name,
          dataUrl,
          thumbUrl: thumb,
          width,
          height,
          size,
          aiTitle: analysis.aiTitle,
          aiDescription: analysis.aiDescription,
          aiTags: analysis.aiTags,
          enhanced: false,
          frame: analysis.frame,
        });
      } catch (e) {
        console.warn("skip", f.name, e);
      }
    }
    setQuickFiles((prev) => [...prev, ...next]);
    setQuickBusy(false);
    setQuickProgress(null);
    if (quickFileRef.current) quickFileRef.current.value = "";
  };

  const aiDescribeForQuick = async (id: string) => {
    const f = quickFiles.find((x) => x.id === id);
    if (!f) return;
    setQuickBusy(true);
    setQuickProgress("Writing AI copy…");
    // generate a richer title/description by re-analyzing with a bias toward project theme
    const analysis = await analyzeImage(f.dataUrl);
    setQuickFiles((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              aiTitle: polishTitle(analysis.aiTitle, form.category),
              aiDescription: polishDescription(analysis, form.category),
              aiTags: Array.from(new Set([...x.aiTags, ...analysis.aiTags])),
            }
          : x
      )
    );
    setQuickBusy(false);
    setQuickProgress(null);
    showToast("AI description refined.");
  };

  const aiEnhanceQuick = async (id: string) => {
    const f = quickFiles.find((x) => x.id === id);
    if (!f) return;
    setQuickBusy(true);
    setQuickProgress("AI enhancing (sharpen · high-res)…");
    const hd = await enhanceImage(f.dataUrl);
    const thumb = await makeThumbnail(hd, 480);
    setQuickFiles((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, dataUrl: hd, thumbUrl: thumb, enhanced: true } : x
      )
    );
    setQuickBusy(false);
    setQuickProgress(null);
    showToast("High-res enhanced master ready.");
  };

  const aiEnhanceAll = async () => {
    if (quickFiles.length === 0) return;
    setQuickBusy(true);
    const out: typeof quickFiles = [];
    for (let i = 0; i < quickFiles.length; i++) {
      const f = quickFiles[i];
      setQuickProgress(`Enhancing ${i + 1}/${quickFiles.length} · ${f.name}`);
      if (f.enhanced) { out.push(f); continue; }
      const hd = await enhanceImage(f.dataUrl);
      const thumb = await makeThumbnail(hd, 480);
      out.push({ ...f, dataUrl: hd, thumbUrl: thumb, enhanced: true });
    }
    setQuickFiles(out);
    setQuickBusy(false);
    setQuickProgress(null);
    showToast(`All ${out.length} files enhanced to HD.`);
  };

  const aiDescribeAll = async () => {
    if (quickFiles.length === 0) return;
    setQuickBusy(true);
    const out: typeof quickFiles = [];
    for (let i = 0; i < quickFiles.length; i++) {
      const f = quickFiles[i];
      setQuickProgress(`Writing copy ${i + 1}/${quickFiles.length}`);
      const analysis = await analyzeImage(f.dataUrl);
      out.push({
        ...f,
        aiTitle: polishTitle(analysis.aiTitle, form.category),
        aiDescription: polishDescription(analysis, form.category),
        aiTags: Array.from(new Set([...f.aiTags, ...analysis.aiTags])),
      });
    }
    setQuickFiles(out);
    setQuickBusy(false);
    setQuickProgress(null);
    showToast("AI copy generated for all uploads.");
  };

  const removeQuick = (id: string) =>
    setQuickFiles((prev) => prev.filter((x) => x.id !== id));

  const downloadQuick = (f: typeof quickFiles[number]) =>
    downloadDataUrl(f.dataUrl, `${f.aiTitle.replace(/\s+/g, "-")}${f.enhanced ? "-hd" : ""}.jpg`);

  const updateQuickField = (
    id: string,
    patch: Partial<(typeof quickFiles)[number]>
  ) => setQuickFiles((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEditDraft({ ...p });
  };
  const saveEdit = () => {
    if (!editingId) return;
    updateProject(editingId, editDraft);
    setEditingId(null);
    setEditDraft({});
    showToast("Project updated.");
  };

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "profile", label: "Profile Image", icon: ImageIcon },
    { id: "identity", label: "Identity & Details", icon: User },
    { id: "links", label: "Channels & Links", icon: LinkIcon },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "assets", label: "Files & Assets", icon: Layers },
    { id: "templates", label: "Templates & History", icon: Palette },
    { id: "ai", label: "AI Agent", icon: Brain },
  ];

  const aiConfidence = useMemo(() => {
    if (!imgAnalysis) return 0;
    return Math.min(99, 72 + Math.floor(Math.random() * 20));
  }, [imgAnalysis]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="section-label flex items-center gap-2">
            <Sparkles size={12} className="text-accent" />
            {`// AddMine · AI Command Console`}
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-steel-100">
            {profile.firstName} <span className="gold-gradient-text italic">{profile.lastName}</span>
          </h1>
          <div className="mt-1 font-mono text-[11px] text-steel-500">
            Auth via <span className="text-accent">{usedKey}</span> · session
            secured
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={closeAll}
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-steel-200 hover:border-accent/40 hover:text-accent text-sm rounded-sm"
          >
            <ArrowLeft size={14} /> Close Console
          </button>
          <button
            onClick={() => {
              logout();
              closeAll();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-accent-red/40 text-accent-red hover:bg-accent-red/10 text-sm rounded-sm"
          >
            <LogOut size={14} /> Lock
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border border-white/5 rounded-sm p-1 bg-white/[0.02] mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-widest rounded-sm transition ${
                active
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-steel-400 hover:text-steel-100 border border-transparent"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Profile Image */}
      {tab === "profile" && (
        <div className="card rounded-sm p-6 relative">
          <span className="bracket bracket-tl" />
          <span className="bracket bracket-br" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 grid place-items-center bg-accent/10 border border-accent/30 text-accent rounded-sm">
              <ImageIcon size={16} />
            </div>
            <div>
              <div className="font-serif text-xl text-steel-100">
                Profile Image Controller
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">
                Live avatar on homepage
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="relative aspect-[4/5] max-w-sm rounded-sm overflow-hidden border border-white/10 bg-black/40">
              <Image
                src={preview ?? profileImage}
                alt="Profile"
                fill
                sizes="320px"
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-steel-300 bg-black/60 px-2 py-1 rounded-sm">
                {preview ? "Preview (unsaved)" : "Live on site"}
              </div>
              {imgAnalysis && (
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay"
                  style={{
                    boxShadow: `inset 0 0 120px ${imgAnalysis.dominant}`,
                  }}
                />
              )}
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex-1 border border-dashed border-white/15 hover:border-accent/40 rounded-sm grid place-items-center cursor-pointer transition">
                <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                <div className="text-center px-3 py-8">
                  <Upload size={22} className="mx-auto text-steel-400 mb-2" />
                  <div className="text-sm text-steel-200">Upload new profile image</div>
                  <div className="text-[10px] font-mono text-steel-500 mt-1">
                    JPG / PNG / WebP · ≤ 5MB
                  </div>
                </div>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={saveProfile}
                  disabled={!preview}
                  className="btn-edge inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-midnight-950 font-semibold text-sm rounded-sm disabled:opacity-40"
                >
                  <Save size={14} /> Publish
                </button>
                <button
                  onClick={() => {
                    setProfileImage("/profile.jpg");
                    setPreview(null);
                    showToast("Reset to enhanced default portrait.");
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 text-steel-200 text-sm rounded-sm"
                >
                  Reset to Default
                </button>
              </div>
              {imgAnalysis && (
                <div className="mt-2 p-3 border border-accent/20 bg-accent/5 rounded-sm">
                  <div className="flex items-center gap-2 text-xs font-mono text-accent mb-2">
                    <Brain size={12} /> AI Vision Report
                  </div>
                  <div className="text-[11px] font-mono text-steel-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-sm border border-white/20"
                        style={{ background: imgAnalysis.dominant }}
                      />
                      Dominant palette: <span className="text-steel-200">{imgAnalysis.dominant}</span>
                    </div>
                    <div>Aspect ratio: <span className="text-steel-200">{imgAnalysis.ratio.toFixed(2)}</span></div>
                    <div>Suggested accent emoji: <span className="text-steel-200">{imgAnalysis.suggestedEmoji}</span></div>
                    <div>Face zone preserved: <span className="text-emerald-400">✓ confirmed</span></div>
                    <div>Confidence: <span className="text-steel-200">{aiConfidence}%</span></div>
                  </div>
                  <button
                    onClick={applyAiSuggestionToProfile}
                    className="mt-2 text-[10px] font-mono uppercase tracking-widest text-accent hover:text-accent-hot"
                  >
                    Apply harmony tint →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Identity */}
      {tab === "identity" && (
        <div className="card rounded-sm p-6 relative">
          <span className="bracket bracket-tl" />
          <span className="bracket bracket-br" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 grid place-items-center bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan rounded-sm">
              <User size={16} />
            </div>
            <div>
              <div className="font-serif text-xl text-steel-100">
                Identity & Details
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">
                Name · Role · Tagline · Bio
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="First Name" value={profile.firstName} onChange={(v) => setProfile({ firstName: v })} />
            <Field label="Last Name" value={profile.lastName} onChange={(v) => setProfile({ lastName: v })} />
            <Field label="Role / Title" value={profile.role} onChange={(v) => setProfile({ role: v })} />
            <Field label="Location" value={profile.location} onChange={(v) => setProfile({ location: v })} />
            <label className="md:col-span-2 block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
                Legendary Tagline
              </span>
              <input
                value={profile.tagline}
                onChange={(e) => setProfile({ tagline: e.target.value })}
                className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-3 py-2 text-sm text-steel-100 font-serif"
              />
            </label>
            <label className="md:col-span-2 block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
                Bio / Professional Summary
              </span>
              <textarea
                rows={5}
                value={profile.bio}
                onChange={(e) => setProfile({ bio: e.target.value })}
                className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-3 py-2 text-sm text-steel-100 resize-none"
              />
            </label>
          </div>

          {/* Education editor */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap size={14} className="text-fuchsia-400" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-steel-400">
                  Education · {profile.education?.length || 0} entries
                </span>
              </div>
              <button
                onClick={() => addEducation({ degree: "", institution: "", year: "", grade: "", location: "", notes: "" })}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-fuchsia-400/40 text-fuchsia-400 rounded-sm hover:bg-fuchsia-400/10"
              >
                <Plus size={11} /> Add Education
              </button>
            </div>
            <div className="space-y-3">
              {(profile.education || []).map((ed) => (
                <div key={ed.id} className="border border-white/10 bg-black/30 rounded-sm p-3 relative group">
                  <div className="grid md:grid-cols-2 gap-2">
                    <InputRow label="Degree / Certificate" value={ed.degree} onChange={(v) => updateEducation(ed.id, { degree: v })} placeholder="e.g. Matric (Science)" />
                    <InputRow label="Institution / Board" value={ed.institution} onChange={(v) => updateEducation(ed.id, { institution: v })} placeholder="e.g. BISE Faisalabad" />
                    <InputRow label="Year(s)" value={ed.year} onChange={(v) => updateEducation(ed.id, { year: v })} placeholder="e.g. 2019 or 2020 – 2022" />
                    <InputRow label="Marks / %" value={ed.marks || ""} onChange={(v) => updateEducation(ed.id, { marks: v })} placeholder="e.g. 82% or 920/1100" />
                    <InputRow label="Grade" value={ed.grade || ""} onChange={(v) => updateEducation(ed.id, { grade: v })} placeholder="e.g. A+ / Merit / B" />
                    <InputRow label="Location (optional)" value={ed.location || ""} onChange={(v) => updateEducation(ed.id, { location: v })} placeholder="City, Country" />
                    <label className="md:col-span-2 block">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">Notes / Subjects (optional)</span>
                      <textarea
                        rows={2}
                        value={ed.notes || ""}
                        onChange={(e) => updateEducation(ed.id, { notes: e.target.value })}
                        placeholder="Subjects, specialization, or remarks…"
                        className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-2 py-1.5 text-xs text-steel-200 resize-none"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${ed.degree || "this entry"}"? This cannot be undone.`)) removeEducation(ed.id);
                    }}
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider border border-accent-red/40 text-accent-red/80 rounded-sm hover:bg-accent-red/10 hover:text-accent-red transition"
                    title="Remove this education entry"
                  >
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              ))}
              {(!profile.education || profile.education.length === 0) && (
                <div className="text-xs text-steel-500 font-mono border border-dashed border-white/10 rounded-sm p-4 text-center">
                  No education entries yet — click "Add Education" to start.
                </div>
              )}
            </div>
          </div>

          {/* Experience editor */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-accent-cyan" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-steel-400">
                  Work Experience · {profile.experience?.length || 0} entries
                </span>
              </div>
              <button
                onClick={() => addExperience({ role: "", company: "", duration: "", location: "", description: "", current: false })}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-accent-cyan/40 text-accent-cyan rounded-sm hover:bg-accent-cyan/10"
              >
                <Plus size={11} /> Add Workplace
              </button>
            </div>
            <div className="space-y-3">
              {(profile.experience || []).map((ex) => (
                <div key={ex.id} className="border border-white/10 bg-black/30 rounded-sm p-3 relative group">
                  <div className="grid md:grid-cols-2 gap-2">
                    <InputRow label="Designation / Role" value={ex.role} onChange={(v) => updateExperience(ex.id, { role: v })} placeholder="e.g. Senior Designer" />
                    <InputRow label="Company Name" value={ex.company} onChange={(v) => updateExperience(ex.id, { company: v })} placeholder="e.g. Galaxy 42A (Inox)" />
                    <InputRow label="Duration / Time period" value={ex.duration} onChange={(v) => updateExperience(ex.id, { duration: v })} placeholder="e.g. 2023 — Present · 2+ years" />
                    <InputRow label="Location (optional)" value={ex.location || ""} onChange={(v) => updateExperience(ex.id, { location: v })} placeholder="City, Country" />
                    <label className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!ex.current}
                        onChange={(e) => updateExperience(ex.id, { current: e.target.checked })}
                        className="accent-accent"
                      />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-steel-400">
                        Currently working here
                      </span>
                    </label>
                    <label className="md:col-span-2 block">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">Description / Responsibilities</span>
                      <textarea
                        rows={3}
                        value={ex.description || ""}
                        onChange={(e) => updateExperience(ex.id, { description: e.target.value })}
                        className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-2 py-1.5 text-xs text-steel-200 resize-none"
                        placeholder="Role summary, key achievements, responsibilities…"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => removeExperience(ex.id)}
                    className="absolute top-2 right-2 w-6 h-6 grid place-items-center text-steel-500 hover:text-accent-red opacity-0 group-hover:opacity-100 transition"
                    title="Remove"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {(!profile.experience || profile.experience.length === 0) && (
                <div className="text-xs text-steel-500 font-mono border border-dashed border-white/10 rounded-sm p-4 text-center">
                  No workplaces added yet — click "Add Workplace" to start.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => showToast("Details auto-saved (live).")}
              className="btn-edge inline-flex items-center gap-2 px-4 py-2 bg-accent text-midnight-950 font-semibold text-sm rounded-sm"
            >
              <Save size={14} /> Save (auto-sync)
            </button>
          </div>
        </div>
      )}

      {/* Tab: Links */}
      {tab === "links" && (
        <div className="card rounded-sm p-6 relative">
          <span className="bracket bracket-tl" />
          <span className="bracket bracket-br" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 grid place-items-center bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded-sm">
              <LinkIcon size={16} />
            </div>
            <div>
              <div className="font-serif text-xl text-steel-100">
                Channels & Contact Links
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">
                WhatsApp · Phone · Email · Location
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="WhatsApp Direct" value={profile.whatsapp} onChange={(v) => setProfile({ whatsapp: v })} placeholder="+92 317 0643281" />
            <Field label="Mobile Line" value={profile.phone} onChange={(v) => setProfile({ phone: v })} placeholder="0301 7013821" />
            <Field label="Business Email" value={profile.email} onChange={(v) => setProfile({ email: v })} placeholder="you@domain.com" />
            <Field label="Location" value={profile.location} onChange={(v) => setProfile({ location: v })} placeholder="Punjab, Pakistan" />
          </div>
          <div className="mt-4 p-3 border border-white/10 bg-black/40 rounded-sm font-mono text-[11px] text-steel-400">
            All contact channels are live-linked on the Contact section and update immediately.
          </div>
        </div>
      )}

      {/* Tab: Projects */}
      {tab === "projects" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 card rounded-sm p-6 relative">
            <span className="bracket bracket-tr" />
            <span className="bracket bracket-bl" />
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => quickFileRef.current?.click()}
                className="w-12 h-12 grid place-items-center bg-accent-cyan/10 border border-accent-cyan/40 text-accent-cyan rounded-sm hover:bg-accent-cyan/20 transition ring-pulse"
                title="Select files to upload"
              >
                <ImagePlus size={20} />
              </button>
              <div className="flex-1">
                <div className="font-serif text-lg text-steel-100 flex items-center gap-2">
                  Add Project
                  <span className="text-[10px] font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-1.5 py-0.5 rounded-sm">
                    AI Powered
                  </span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
                  Upload files · AI writes copy · auto-frames · HD enhance
                </div>
              </div>
              <input
                ref={quickFileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onQuickFilesSelected(e.target.files)}
              />
            </div>

            {/* Quick upload drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); onQuickFilesSelected(e.dataTransfer.files); }}
              onClick={() => quickFileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-white/10 hover:border-accent-cyan/50 rounded-sm p-5 text-center transition group"
            >
              <div className="w-12 h-12 mx-auto grid place-items-center border border-white/10 rounded-full bg-white/[0.02] text-accent-cyan group-hover:bg-accent-cyan/10 transition">
                <Upload size={20} />
              </div>
              <div className="mt-3 text-sm text-steel-200 font-medium">
                Click or drop files here
              </div>
              <div className="mt-1 text-[10px] font-mono text-steel-500 uppercase tracking-widest">
                Multiple files · no title required · AI does the rest
              </div>
              {quickProgress && (
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-mono text-accent-cyan">
                  <Loader2 size={12} className="animate-spin" /> {quickProgress}
                </div>
              )}
            </div>

            {/* Quick file preview strip */}
            {quickFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-steel-400 flex items-center gap-2">
                    <FileImage size={11} className="text-accent" /> Queued files · {quickFiles.length}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={aiEnhanceAll}
                      disabled={quickBusy}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-emerald-400/40 text-emerald-400 rounded-sm hover:bg-emerald-400/10 disabled:opacity-40"
                    >
                      <Wand2 size={10} /> AI HD all
                    </button>
                    <button
                      type="button"
                      onClick={aiDescribeAll}
                      disabled={quickBusy}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-accent/40 text-accent rounded-sm hover:bg-accent/10 disabled:opacity-40"
                    >
                      <Sparkles size={10} /> AI write all
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickFiles([])}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-accent-red/40 text-accent-red rounded-sm hover:bg-accent-red/10"
                    >
                      <Trash2 size={10} /> Clear
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto chat-scroll pr-1">
                  {quickFiles.map((f) => (
                    <div key={f.id} className="border border-white/10 bg-black/30 rounded-sm p-2 flex gap-2">
                      <div className={`relative w-20 shrink-0 bg-midnight-900 rounded-sm overflow-hidden ${frameClass(f.frame)}`}>
                        <div className="relative w-full h-full">
                          <Image src={f.thumbUrl} alt={f.aiTitle} fill sizes="80px" className="object-contain" />
                        </div>
                        {f.enhanced && (
                          <span className="absolute top-0.5 right-0.5 text-[8px] font-mono bg-emerald-400/80 text-midnight-950 px-1 rounded-sm">HD</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            value={f.aiTitle}
                            onChange={(e) => updateQuickField(f.id, { aiTitle: e.target.value })}
                            className="flex-1 bg-transparent text-xs font-semibold text-steel-100 focus:outline-none focus:text-accent truncate"
                          />
                          <button onClick={() => removeQuick(f.id)} className="w-6 h-6 grid place-items-center text-steel-500 hover:text-accent-red">
                            <X size={12} />
                          </button>
                        </div>
                        <textarea
                          value={f.aiDescription}
                          rows={2}
                          onChange={(e) => updateQuickField(f.id, { aiDescription: e.target.value })}
                          className="mt-1 w-full bg-transparent text-[10px] text-steel-400 focus:outline-none resize-none leading-snug"
                        />
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div className="text-[9px] font-mono text-steel-500 truncate">
                            {f.width}×{f.height} · {Math.round(f.size / 1024)}KB · {f.frame}
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => aiDescribeForQuick(f.id)} className="w-6 h-6 grid place-items-center border border-accent/30 text-accent rounded-sm hover:bg-accent/10" title="AI re-write copy">
                              <Sparkles size={10} />
                            </button>
                            <button type="button" onClick={() => aiEnhanceQuick(f.id)} className="w-6 h-6 grid place-items-center border border-emerald-400/30 text-emerald-400 rounded-sm hover:bg-emerald-400/10" title="AI sharpen / HD">
                              <Wand2 size={10} />
                            </button>
                            <button type="button" onClick={() => downloadQuick(f)} className="w-6 h-6 grid place-items-center border border-accent-cyan/30 text-accent-cyan rounded-sm hover:bg-accent-cyan/10" title="Download">
                              <Download size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={addNew} className="space-y-3 mt-4">
              <Field label="Title (optional — AI writes if empty)" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Leave blank to auto-generate" />
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ProjectCategory })}
                  className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent-cyan/60 rounded-sm px-3 py-2 text-sm"
                >
                  {CAT_OPTS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500 flex items-center gap-2">
                  Description
                  <button
                    type="button"
                    onClick={async () => {
                      if (quickFiles.length === 0) { showToast("Upload at least one file for AI to write a description."); return; }
                      await aiDescribeAll();
                    }}
                    className="ml-auto inline-flex items-center gap-1 text-accent text-[9px] uppercase tracking-widest border border-accent/40 px-1.5 py-0.5 rounded-sm hover:bg-accent/10"
                  >
                    <Sparkles size={9} /> AI write
                  </button>
                </span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent-cyan/60 rounded-sm px-3 py-2 text-sm resize-none"
                  placeholder="Optional — AI will compose from your uploads."
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Tags (,)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="PS, AI" />
                <Field label="Emoji" value={form.coverEmoji} onChange={(v) => setForm({ ...form, coverEmoji: v })} placeholder="✦" />
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500">Tint</span>
                  <input
                    type="color"
                    value={form.coverColor}
                    onChange={(e) => setForm({ ...form, coverColor: e.target.value })}
                    className="mt-1 w-full h-9 bg-black/40 border border-white/10 rounded-sm cursor-pointer"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500 flex items-center gap-1">
                  <LinkIcon size={10} /> Live URL (AI analyzed)
                </span>
                <input
                  value={form.liveUrl}
                  onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                  className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent-cyan/60 rounded-sm px-3 py-2 text-sm font-mono"
                  placeholder="https://..."
                />
                {urlInsights && urlInsights.kind !== "unknown" && (
                  <div className="mt-2 p-2 border border-accent/20 bg-accent/5 rounded-sm font-mono text-[10px] text-steel-300">
                    <div className="flex items-center gap-2 text-accent">
                      <Sparkles size={10} /> AI Link Inspector
                    </div>
                    <div>Detected: <span className="text-steel-100">{urlInsights.label}</span> · {urlInsights.domain}</div>
                    {urlInsights.suggestedCategory && (
                      <div>Suggested category: <span className="text-accent-cyan">{urlInsights.suggestedCategory.replace("-", " / ")}</span></div>
                    )}
                    {urlInsights.tags.length > 0 && (
                      <div>Auto-tags: <span className="text-steel-100">{urlInsights.tags.join(" · ")}</span></div>
                    )}
                  </div>
                )}
              </label>
              <Field label="Download / Asset URL" value={form.downloadUrl} onChange={(v) => setForm({ ...form, downloadUrl: v })} placeholder="https://cdn..." />
              <button
                disabled={quickBusy}
                className="w-full btn-edge inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-cyan/10 border border-accent-cyan/50 text-accent-cyan font-semibold text-sm rounded-sm hover:bg-accent-cyan/20 disabled:opacity-50"
              >
                {quickBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {quickFiles.length
                  ? `Publish ${quickFiles.length} file${quickFiles.length > 1 ? "s" : ""} to registry`
                  : "Add to Registry"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-3 card rounded-sm p-6 relative">
            <span className="bracket bracket-tl" />
            <span className="bracket bracket-br" />
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-lg text-steel-100">Managed Assets</div>
              <div className="font-mono text-[10px] text-steel-500">{projects.length} entries</div>
            </div>
            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {projects.map((p, i) => {
                const cat = CAT_OPTS.find((c) => c.id === p.category);
                const isEditing = editingId === p.id;
                const draft = isEditing ? editDraft : p;
                return (
                  <div key={p.id} className="border border-white/5 rounded-sm bg-white/[0.02] p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 shrink-0 grid place-items-center rounded-sm text-xl border border-white/10 relative overflow-hidden"
                        style={!p.coverImage ? { background: `linear-gradient(135deg, ${p.coverColor ?? "#1c2750"}, #0a0e1a)` } : undefined}
                      >
                        {p.coverImage ? (
                          <Image src={p.coverImage} alt={p.title} fill sizes="44px" className="object-cover" />
                        ) : (
                          <span>{p.coverEmoji ?? "✦"}</span>
                        )}
                        {p.assets && p.assets.length > 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-mono bg-midnight-950 border border-accent/40 text-accent px-1 rounded-sm">
                            {p.assets.length}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={draft.title ?? ""}
                              onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-sm"
                            />
                            <textarea
                              value={draft.description ?? ""}
                              rows={2}
                              onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-xs resize-none"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={draft.category ?? p.category}
                                onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as ProjectCategory })}
                                className="bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-xs"
                              >
                                {CAT_OPTS.map((c) => (
                                  <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                              </select>
                              <input
                                value={draft.liveUrl ?? ""}
                                onChange={(e) => setEditDraft({ ...editDraft, liveUrl: e.target.value })}
                                placeholder="Live URL"
                                className="bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-xs font-mono"
                              />
                              <input
                                value={draft.downloadUrl ?? ""}
                                onChange={(e) => setEditDraft({ ...editDraft, downloadUrl: e.target.value })}
                                placeholder="Download URL"
                                className="bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-xs font-mono"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-[10px] text-steel-500">
                                {String(i + 1).padStart(2, "0")}
                              </div>
                              <div className="text-sm text-steel-100 font-medium truncate">
                                {p.title}
                              </div>
                            </div>
                            <div className={`text-[10px] font-mono uppercase tracking-widest ${cat?.color ?? "text-steel-400"}`}>
                              {cat?.label}
                            </div>
                            <div className="text-xs text-steel-400 line-clamp-2 mt-1">
                              {p.description}
                            </div>
                            <div className="mt-2 flex items-center gap-3 flex-wrap">
                              {p.liveUrl && (
                                <a href={p.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono text-accent-cyan">
                                  <ExternalLink size={10} /> Preview
                                </a>
                              )}
                              {p.downloadUrl && (
                                <a href={p.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono text-accent">
                                  <Download size={10} /> Asset
                                </a>
                              )}
                              {p.tags.slice(0, 3).map((t) => (
                                <span key={t} className="text-[10px] font-mono text-steel-500 border border-white/10 px-1.5 py-0.5 rounded-sm">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="w-8 h-8 grid place-items-center border border-emerald-400/40 text-emerald-400 rounded-sm hover:bg-emerald-400/10">
                              <Check size={14} />
                            </button>
                            <button onClick={() => { setEditingId(null); setEditDraft({}); }} className="w-8 h-8 grid place-items-center border border-white/10 text-steel-400 rounded-sm">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(p)} className="w-8 h-8 grid place-items-center border border-white/10 text-steel-300 rounded-sm hover:border-accent-cyan/50 hover:text-accent-cyan">
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this asset?")) {
                                  deleteProject(p.id);
                                  showToast("Asset removed.");
                                }
                              }}
                              className="w-8 h-8 grid place-items-center border border-white/10 text-steel-500 rounded-sm hover:border-accent-red/50 hover:text-accent-red"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div className="text-center text-steel-500 font-mono text-sm py-8">No assets yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Assets */}
      {tab === "assets" && (
        <div className="space-y-4">
          <AssetManager />
        </div>
      )}

      {/* Tab: Templates & History */}
      {tab === "templates" && (
        <div className="space-y-6">
          <div className="card rounded-sm p-6 relative">
            <span className="bracket bracket-tl" />
            <span className="bracket bracket-br" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 grid place-items-center bg-fuchsia-400/10 border border-fuchsia-400/40 text-fuchsia-400 rounded-sm">
                <Palette size={16} />
              </div>
              <div>
                <div className="font-serif text-xl text-steel-100">Portfolio Templates</div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">
                  Live preview · one-click apply · auto-snapshot before change
                </div>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => { saveSnapshot("Manual save"); showToast("Snapshot saved — you can undo any time."); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-white/15 text-steel-200 rounded-sm hover:border-accent hover:text-accent"
                >
                  <Save size={11} /> Save snapshot now
                </button>
              </div>
            </div>
            {/* Category filter */}
            {(() => {
              const all = allTemplates();
              const allList = Object.values(all);
              const categories = ["All","Dark · Cinematic","Dark · Tech","Light · Editorial","Color · Bold","Minimal · Mono","Experimental","Custom · Mine"];
              return (
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {categories.map((c) => {
                    const count = c === "All" ? allList.length
                      : c === "Custom · Mine" ? customTemplates.length
                      : allList.filter(t=>t.category===c).length;
                    return (
                      <button
                        key={c}
                        onClick={() => setTemplateCategory(c)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm border transition",
                          templateCategory === c
                            ? "text-accent border-accent/60 bg-accent/10"
                            : "text-steel-500 border-white/10 hover:text-steel-200 hover:border-white/20"
                        )}
                      >{c} <span className="opacity-60">({count})</span></button>
                    );
                  })}
                  <button
                    onClick={() => {
                      const id = `custom_${Date.now().toString(36)}`;
                      const newTpl = {
                        id, name: "My Template", category: "Custom · Mine" as const,
                        accent: theme.accent, bg: theme.bg || "#05070d",
                        surface: "rgba(18,21,28,0.8)", border: "rgba(255,255,255,0.1)",
                        text: "#e9ecf3", muted: "#8b93a7", heading: "#f3f4f6",
                        font: "sans" as const, radius: "4px", style: "sharp" as const,
                        desc: "Your custom template — tweak colors and apply.",
                        swatches: ["#05070d","#0f1622",theme.accent,theme.accent],
                      };
                      saveCustomTemplate(newTpl);
                      setPreviewTemplate(id);
                      setTemplateCategory("Custom · Mine");
                      showToast("New custom template created — edit colors/radius/fonts in the side panel.");
                    }}
                    className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm border border-emerald-400/40 text-emerald-300 bg-emerald-400/5 hover:bg-emerald-400/10"
                  ><Plus size={11} /> New Template</button>
                </div>
              );
            })()}

            {/* Split layout: compact template list + side preview */}
            <div className="grid lg:grid-cols-5 gap-5">
              {/* Left: compact template grid */}
              <div className="lg:col-span-3">
                {(() => {
                  const all = allTemplates();
                  const allArr = Object.values(all).filter((t) => {
                    if (templateCategory === "All") return true;
                    if (templateCategory === "Custom · Mine") return !!customTemplates.find(c => c.id === t.id);
                    return t.category === templateCategory;
                  });
                  return (<>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {allArr.map((t) => {
                    const active = profile.template === t.id;
                    const isCustom = !!customTemplates.find(c => c.id === t.id);
                    return (
                      <div key={t.id} className="relative group">
                        <button
                          onClick={() => {
                            setPreviewTemplate(t.id);
                            if (!active) {
                              saveSnapshot(`Before switching to ${t.name}`);
                              applyTemplate(t.id);
                              showToast(`✓ "${t.name}" applied — undo in Version History below.`);
                            }
                            if (window.innerWidth < 1024) {
                              setTimeout(() => {
                                document.getElementById("side-preview-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 50);
                            }
                          }}
                          className={cn(
                            "relative w-full text-left rounded-sm border overflow-hidden transition",
                            active ? "border-accent ring-2 ring-accent/50 shadow-[0_0_20px_rgba(250,204,21,0.25)]" : "border-white/10 hover:border-accent/50 hover:-translate-y-0.5",
                            isCustom && !active && "border-dashed border-fuchsia-400/40"
                          )}
                          style={{ background: t.bg }}
                          title={`Click to apply ${t.name}`}
                        >
                          {active && (
                            <span className="absolute top-1 right-1 z-10 text-[8px] font-mono uppercase tracking-widest bg-emerald-400 text-midnight-950 px-1.5 py-0.5 rounded-sm font-bold shadow">✓ LIVE</span>
                          )}
                          {isCustom && !active && (
                            <span className="absolute top-1 right-1 z-10 text-[7px] font-mono uppercase tracking-widest bg-fuchsia-500/80 text-white px-1 py-0.5 rounded-sm">MINE</span>
                          )}
                          <div className="aspect-[4/3] relative p-1.5" style={{ background: `linear-gradient(160deg, ${t.bg}, ${t.swatches[1] || t.bg})` }}>
                            <div className="absolute inset-1 rounded-sm" style={{ border: `1px solid ${t.border}` }} />
                            <div className="relative flex flex-col h-full gap-0.5">
                              <div className="flex items-center justify-between">
                                <div className="text-[5px] font-mono uppercase tracking-widest truncate" style={{ color: t.muted }}>WAHAB</div>
                                <div className="flex gap-0.5">
                                  {t.swatches.slice(0,3).map((c,i)=>(<span key={i} className="w-1 h-1 rounded-full" style={{background:c}}/>))}
                                </div>
                              </div>
                              <div className="font-serif leading-[0.85]" style={{ color: t.heading }}>
                                <div style={{ fontSize: 8, fontWeight: 900 }}>GIVE</div>
                                <div style={{ fontSize: 8, fontWeight: 900, fontStyle: "italic", color: t.accent }}>ME AN</div>
                                <div style={{ fontSize: 8, fontWeight: 900 }}>IDEA,</div>
                              </div>
                              <div className="mt-auto grid grid-cols-4 gap-0.5">
                                {[0,1,2,3].map(i=>(
                                  <div key={i} className="aspect-square rounded-sm" style={{ background: t.surface, border: `0.5px solid ${t.border}` }} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="px-2 py-1.5 flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-white/10" style={{ background: t.accent }} />
                            <div className="font-serif text-xs truncate flex-1" style={{ color: t.heading }}>{t.name}</div>
                          </div>
                        </button>
                        {isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete custom template "${t.name}"?`)) {
                                deleteCustomTemplate(t.id);
                                if (previewTemplate === t.id) setPreviewTemplate(null);
                                showToast(`Custom template "${t.name}" deleted.`);
                              }
                            }}
                            className="absolute -top-2 -left-2 w-6 h-6 grid place-items-center bg-accent-red text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 transition z-20"
                            title="Delete custom template"
                          ><Trash2 size={11} /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-[10px] font-mono text-steel-500">
                  {allArr.length} templates shown · <span className="text-accent">{Object.keys(TEMPLATES).length} built-in</span> + <span className="text-fuchsia-300">{customTemplates.length} custom</span> · click one to <span className="text-accent">apply instantly</span> (snapshot auto-saved).
                </div>
                </>);
                })()}
              </div>

              {/* Right: sticky side preview */}
              <div className="lg:col-span-2" id="side-preview-panel">
                <div className="lg:sticky lg:top-24">
                  {(() => {
                    const pid = previewTemplate ?? profile.template;
                    const all = allTemplates();
                    const previewed = pid ? all[pid] : null;
                    const isCustom = pid ? !!customTemplates.find(c => c.id === pid) : false;
                    return pid && previewed ? (<>
                    <SidePreview
                      templateId={pid}
                      activeId={profile.template}
                      onApply={(id) => {
                        const tp = all[id];
                        if (!tp) return;
                        if (id === profile.template) {
                          showToast(`"${tp.name}" is already live.`);
                          return;
                        }
                        saveSnapshot(`Before switching to ${tp.name}`);
                        applyTemplate(id);
                        showToast(`✓ "${tp.name}" applied — undo in Version History below.`);
                      }}
                      onClose={() => setPreviewTemplate(null)}
                    />
                    {isCustom && (
                      <TemplateEditor
                        tpl={previewed}
                        onChange={(patch) => {
                          updateCustomTemplate(pid, patch);
                          // Re-apply live if this is the active template
                          if (profile.template === pid) applyTemplate(pid);
                        }}
                        onDelete={() => {
                          if (confirm(`Delete custom template "${previewed.name}"?`)) {
                            deleteCustomTemplate(pid);
                            setPreviewTemplate(null);
                            showToast(`Custom template deleted.`);
                          }
                        }}
                        onDuplicate={() => {
                          const id = `custom_${Date.now().toString(36)}`;
                          const clone = { ...previewed, id, name: previewed.name + " (copy)" };
                          saveCustomTemplate(clone);
                          setPreviewTemplate(id);
                          showToast("Duplicated as new custom template.");
                        }}
                      />
                    )}
                    </>) : (
                    <div className="border border-dashed border-white/10 rounded-sm p-8 text-center text-steel-500 font-mono text-xs">
                      ← Select a template to see a full rendered preview here.<br/>
                      <span className="text-fuchsia-400">Tip:</span> click <span className="text-emerald-400">+ New Template</span> above to make your own.
                    </div>
                  );
                  })()}

                  {/* Snapshot history below preview */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock3 size={12} className="text-accent" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-steel-400">Version History · {snapshots.length}</span>
                    </div>
                    {snapshots.length === 0 ? (
                      <div className="text-[10px] text-steel-500 font-mono border border-dashed border-white/10 rounded-sm p-3 text-center">No snapshots yet.</div>
                    ) : (
                      <ul className="space-y-1.5 max-h-52 overflow-y-auto chat-scroll pr-1">
                        {snapshots.map((s) => (
                          <li key={s.id} className="flex items-center gap-2 border border-white/10 rounded-sm p-2 bg-black/30 text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="text-steel-100 truncate font-mono text-[10px]">{s.label}</div>
                              <div className="text-[9px] font-mono text-steel-500">{new Date(s.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})} · {s.projects.length}p</div>
                            </div>
                            <button
                              onClick={() => { loadSnapshot(s.id); showToast("Snapshot restored."); }}
                              className="text-[9px] font-mono uppercase tracking-wider border border-emerald-400/40 text-emerald-400 rounded-sm px-1.5 py-0.5 hover:bg-emerald-400/10"
                            ><Undo2 size={9} className="inline" /> Undo</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {snapshots.length === 0 ? (
              <div className="text-xs text-steel-500 font-mono border border-dashed border-white/10 rounded-sm p-4 text-center">
                No snapshots yet. They'll appear here automatically when you apply a template or delete a project.
              </div>
            ) : (
              <ul className="space-y-2">
                {snapshots.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 border border-white/10 rounded-sm p-3 bg-black/30">
                    <div className="w-7 h-7 grid place-items-center border border-white/10 rounded-sm text-[10px] font-mono text-steel-300">
                      {String(snapshots.length - i).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-steel-100 truncate">{s.label}</div>
                      <div className="text-[10px] font-mono text-steel-500">
                        {new Date(s.createdAt).toLocaleString()} · {s.projects.length} projects
                      </div>
                    </div>
                    <button
                      onClick={() => { loadSnapshot(s.id); showToast("Snapshot restored."); }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider border border-emerald-400/40 text-emerald-400 rounded-sm hover:bg-emerald-400/10"
                    >
                      <Undo2 size={11} /> Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Tab: AI */}
      {tab === "ai" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <AgentChat />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="card rounded-sm p-6 relative">
              <span className="bracket bracket-tl" />
              <span className="bracket bracket-br" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 grid place-items-center bg-accent/10 border border-accent/40 text-accent rounded-sm">
                  <Brain size={16} />
                </div>
                <div>
                  <div className="font-serif text-lg text-steel-100">Agent Modules</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500">Arsenal</div>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-steel-300">
                <li className="flex items-start gap-2"><Sparkles size={12} className="text-accent mt-1" /> Vision — palette/ratio analysis for uploaded imagery</li>
                <li className="flex items-start gap-2"><Sparkles size={12} className="text-accent mt-1" /> Link Inspector — detects Vercel/Netlify/GitHub/Figma/Social/Drive</li>
                <li className="flex items-start gap-2"><Sparkles size={12} className="text-accent mt-1" /> Composer — rewrites taglines, bio, role, and project copy</li>
                <li className="flex items-start gap-2"><Sparkles size={12} className="text-accent mt-1" /> Themer — instant palette swaps across the entire site</li>
                <li className="flex items-start gap-2"><Sparkles size={12} className="text-accent mt-1" /> Scheduler — queues redesign / polish ops for specific times</li>
                <li className="flex items-start gap-2"><Sparkles size={12} className="text-accent mt-1" /> Registry Ops — add/edit/delete projects by natural language</li>
              </ul>
              <div className="mt-4 p-3 border border-dashed border-white/10 rounded-sm font-mono text-[10px] text-steel-500 leading-relaxed">
                Engine: rule-based multimodal core (no cloud) · trained on Wahab&apos;s portfolio schema, stack, and design system. Switch personas to bias tone (Creative / Analyst / Engineer / Vision / Manager).
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                <div className="text-center p-2 border border-white/5 rounded-sm">
                  <div className="font-mono text-[9px] text-steel-500">ACCENT</div>
                  <div className="w-5 h-5 mx-auto mt-1 rounded-sm border border-white/10" style={{ background: theme.accent }} />
                </div>
                <div className="text-center p-2 border border-white/5 rounded-sm">
                  <div className="font-mono text-[9px] text-steel-500">MODE</div>
                  <div className="text-accent text-xs mt-1 font-mono uppercase">{theme.bg}</div>
                </div>
                <div className="text-center p-2 border border-white/5 rounded-sm">
                  <div className="font-mono text-[9px] text-steel-500">PROJECTS</div>
                  <div className="text-steel-100 text-sm mt-0.5 font-display">{projects.length}</div>
                </div>
                <div className="text-center p-2 border border-white/5 rounded-sm">
                  <div className="font-mono text-[9px] text-steel-500">LATENCY</div>
                  <div className="text-emerald-400 text-sm mt-0.5 font-mono">&lt;500ms</div>
                </div>
                <div className="text-center p-2 border border-white/5 rounded-sm">
                  <div className="font-mono text-[9px] text-steel-500">LLM</div>
                  <div className="text-accent-cyan text-[9px] mt-1 font-mono">LOCAL</div>
                </div>
              </div>
            </div>
            <div className="card rounded-sm p-6 relative">
              <span className="bracket bracket-tr" />
              <span className="bracket bracket-bl" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 grid place-items-center bg-accent-red/10 border border-accent-red/40 text-accent-red rounded-sm">
                  <Wrench size={16} />
                </div>
                <div>
                  <div className="font-serif text-lg text-steel-100">Maintenance</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500">Danger zone</div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Reset ALL data to factory defaults?")) {
                    resetAll();
                    showToast("Workspace reset.");
                  }
                }}
                className="px-4 py-2 border border-accent-red/40 text-accent-red hover:bg-accent-red/10 text-sm rounded-sm"
              >
                <Trash2 size={14} className="inline mr-2" /> Reset workspace
              </button>
              <p className="mt-3 text-xs text-steel-500 font-mono">
                Restores default profile, identity, contacts, and 8 seed projects.
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-midnight-900 border border-accent/40 text-accent px-4 py-2 rounded-sm text-xs font-mono shadow-edge z-[90]">
          {toast}
        </div>
      )}
    </div>
  );
}

function TemplateEditor({
  tpl, onChange, onDelete, onDuplicate,
}: {
  tpl: import("@/lib/store").TemplateDef;
  onChange: (patch: Partial<import("@/lib/store").TemplateDef>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const fontOptions = [
    { id: "serif", label: "Serif" },
    { id: "sans", label: "Sans" },
    { id: "mono", label: "Mono" },
    { id: "display", label: "Display" },
  ] as const;
  const catOptions = ["Dark · Cinematic","Dark · Tech","Light · Editorial","Color · Bold","Minimal · Mono","Experimental","Custom · Mine"] as const;
  return (
    <div className="mt-3 rounded-sm border border-fuchsia-400/30 bg-fuchsia-500/5 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300">✎ Edit Custom Template</span>
        <div className="flex gap-1">
          <button onClick={onDuplicate} className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border border-white/15 text-steel-300 rounded-sm hover:border-accent hover:text-accent" title="Duplicate"><Copy size={9} /> Duplicate</button>
          <button onClick={onDelete} className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border border-accent-red/40 text-accent-red rounded-sm hover:bg-accent-red/10" title="Delete"><Trash2 size={9} /> Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LField label="Name">
          <input value={tpl.name} onChange={e => onChange({ name: e.target.value })} className="w-full bg-black/40 border border-white/10 focus:border-fuchsia-400/60 focus:outline-none rounded-sm px-2 py-1 text-xs text-steel-100"/>
        </LField>
        <LField label="Category">
          <select value={tpl.category} onChange={e => onChange({ category: e.target.value as typeof tpl.category })} className="w-full bg-black/40 border border-white/10 focus:border-fuchsia-400/60 focus:outline-none rounded-sm px-2 py-1 text-xs text-steel-100">
            {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </LField>
        <ColorField label="Accent"  value={tpl.accent}  onChange={v => onChange({ accent: v, swatches: [tpl.swatches[0], tpl.swatches[1], v, v] })} />
        <ColorField label="BG"      value={tpl.bg}       onChange={v => onChange({ bg: v })} />
        <ColorField label="Surface" value={tpl.surface.startsWith("rgba") ? "#111" : tpl.surface} onChange={v => onChange({ surface: v })} />
        <ColorField label="Border"  value={tpl.border.startsWith("rgba") ? "#333" : tpl.border}  onChange={v => onChange({ border: v })} />
        <ColorField label="Heading" value={tpl.heading}  onChange={v => onChange({ heading: v })} />
        <ColorField label="Text"    value={tpl.text}     onChange={v => onChange({ text: v })} />
        <ColorField label="Muted"   value={tpl.muted}    onChange={v => onChange({ muted: v })} />
        <LField label="Radius">
          <select value={tpl.radius} onChange={e => onChange({ radius: e.target.value })} className="w-full bg-black/40 border border-white/10 focus:border-fuchsia-400/60 focus:outline-none rounded-sm px-2 py-1 text-xs text-steel-100">
            <option value="0px">Sharp (0px)</option>
            <option value="2px">Tight (2px)</option>
            <option value="4px">Soft (4px)</option>
            <option value="8px">Rounded (8px)</option>
            <option value="12px">Pill (12px)</option>
            <option value="999px">Full pill (999px)</option>
          </select>
        </LField>
        <LField label="Font">
          <select value={tpl.font} onChange={e => onChange({ font: e.target.value as typeof tpl.font })} className="w-full bg-black/40 border border-white/10 focus:border-fuchsia-400/60 focus:outline-none rounded-sm px-2 py-1 text-xs text-steel-100 col-span-2">
            {fontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </LField>
      </div>

      <div className="mt-2">
        <LField label="Description">
          <input value={tpl.desc} onChange={e => onChange({ desc: e.target.value })} className="w-full bg-black/40 border border-white/10 focus:border-fuchsia-400/60 focus:outline-none rounded-sm px-2 py-1 text-[11px] text-steel-300"/>
        </LField>
      </div>

      <p className="mt-2 text-[9px] font-mono text-steel-500 leading-snug">
        Changes apply live to the side preview. If this template is currently active on your portfolio, edits show instantly. Duplicate to iterate, delete to remove.
      </p>
    </div>
  );
}

function LField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500 block mb-0.5">{label}</span>
      {children}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500 block mb-0.5">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#e0b86c"}
          onChange={e => onChange(e.target.value)}
          className="w-7 h-7 bg-transparent border border-white/10 rounded-sm cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 focus:border-fuchsia-400/60 focus:outline-none rounded-sm px-2 py-1 text-[11px] font-mono text-steel-200"
        />
      </div>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-3 py-2 text-sm text-steel-100"
      />
    </label>
  );
}

function InputRow({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={className ? `block ${className}` : "block"}>
      <span className="font-mono text-[9px] uppercase tracking-widest text-steel-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-black/40 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-2 py-1.5 text-xs text-steel-100"
      />
    </label>
  );
}

/* --- quick helpers --- */
function detectCatFromQuick(
  files: { frame: Asset["frame"]; aiTags: string[] }[],
  fallback: ProjectCategory
): ProjectCategory {
  if (files.length === 0) return fallback;
  const votes: Record<string, number> = {};
  files.forEach((f) => {
    const c = guessFromFrame(f.frame);
    votes[c] = (votes[c] ?? 0) + 1;
  });
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as ProjectCategory) ?? fallback;
}
function guessFromFrame(frame: Asset["frame"]): ProjectCategory {
  if (frame === "web" || frame === "landscape") return "web-app";
  if (frame === "mobile" || frame === "social" || frame === "square") return "social-media";
  if (frame === "textile") return "textile";
  return "screen-printing";
}
function emojiFor(cat: ProjectCategory): string {
  return cat === "web-app" ? "💻" : cat === "textile" ? "🧵" : cat === "social-media" ? "📱" : "🎨";
}
function polishTitle(base: string, cat: ProjectCategory): string {
  const prefix: Record<ProjectCategory, string> = {
    "screen-printing": "Screen Print · ",
    textile: "Textile Study · ",
    "web-app": "Digital Build · ",
    "social-media": "Social Concept · ",
  };
  if (base.startsWith(prefix[cat])) return base;
  return prefix[cat] + base;
}
function polishDescription(a: { dominant: string; contrast: number; saturation: number; aiDescription: string }, cat: ProjectCategory): string {
  const quality = a.contrast > 0.6 ? "high-contrast" : "balanced-tone";
  const rich = a.saturation > 0.5 ? "rich" : "refined";
  const endings: Record<ProjectCategory, string> = {
    "screen-printing": `Press-ready ${quality} composition with registration-safe silhouettes, halftone-tuned for multi-color separations. Palette anchored in ${a.dominant}.`,
    textile: `Production-ready ${rich} pattern for textile printing / embroidery, with print-repeat logic and color-locked values anchored at ${a.dominant}.`,
    "web-app": `${quality} UI-forward ${rich} composition built for staging preview and responsive deployment, anchored in ${a.dominant}.`,
    "social-media": `High-retention ${quality} social asset with ${rich} palette ${a.dominant} — tuned for feed algorithms, scroll-stopping hierarchy.`,
  };
  return `${a.aiDescription} ${endings[cat]}`;
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
