"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Project,
  ProjectCategory,
  EducationEntry,
  ExperienceEntry,
  ThemeTemplateId,
  Snapshot,
} from "@/types";

const STORAGE_KEY = "wahab_portfolio_v7";
const SNAPSHOTS_KEY = "wahab_portfolio_snapshots_v5";

/* -------- Smart AI helpers (URL + image analyzers) ------- */

export function analyzeUrl(url: string) {
  const tags: string[] = [];
  let kind: "live" | "download" | "design" | "code" | "social" | "unknown" = "unknown";
  let suggestedCategory: ProjectCategory | null = null;
  let domain = "";
  let label = "Link";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    domain = u.hostname.replace(/^www\./, "");
    const host = domain.toLowerCase();
    const path = u.pathname.toLowerCase();

    if (/(vercel|netlify|firebase|render|fly\.dev|pages\.dev)/.test(host)) {
      kind = "live"; tags.push("Live Deploy", "Staging"); suggestedCategory = "web-app"; label = "Live Deployment";
    } else if (/(github|gitlab|bitbucket|codesandbox|replit)/.test(host)) {
      kind = "code"; tags.push("Source Code", "Repository"); suggestedCategory = "web-app"; label = "Code Repository";
    } else if (/(drive\.google|dropbox|onedrive|mega\.nz|wetransfer|cdn\.)/.test(host)) {
      kind = "download"; tags.push("Asset", "Downloadable"); label = "Asset Download";
    } else if (/(behance|dribbble|figma\.com)/.test(host)) {
      kind = "design"; tags.push("Design", "Portfolio"); suggestedCategory = "screen-printing"; label = "Design Preview";
    } else if (/(instagram|tiktok|facebook|youtube|vimeo|twitter\.com|x\.com)/.test(host)) {
      kind = "social"; tags.push("Social", "Motion"); suggestedCategory = "social-media"; label = "Social Link";
    } else if (/(wa\.me|whatsapp)/.test(host)) {
      kind = "social"; tags.push("WhatsApp"); label = "WhatsApp";
    } else {
      kind = "live"; tags.push("Preview"); label = "External Link";
    }

    if (/shirt|tee|print|screen/i.test(path)) { suggestedCategory = "screen-printing"; tags.push("Screen Print"); }
    else if (/textile|suit|fabric|embroid/i.test(path)) { suggestedCategory = "textile"; tags.push("Textile"); }
    else if (/app|web|dash|api/i.test(path)) { suggestedCategory = "web-app"; tags.push("Web App"); }
    else if (/brand|social|post/i.test(path)) { suggestedCategory = "social-media"; tags.push("Brand"); }
  } catch {
    return { kind: "unknown", tags: [], suggestedCategory: null, domain: "", label: "Invalid URL" };
  }
  return { kind, tags: Array.from(new Set(tags)), suggestedCategory, domain, label };
}

export function analyzeCoverImage(dataUrl: string): Promise<{ dominant: string; ratio: number; suggestedEmoji: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = 40;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve({ dominant: "#1c2750", ratio: img.width / img.height, suggestedEmoji: "✦" });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 125) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      if (n === 0) n = 1;
      r = Math.max(20, Math.min(210, Math.round((r / n) * 0.85)));
      g = Math.max(20, Math.min(200, Math.round((g / n) * 0.8)));
      b = Math.max(30, Math.min(230, Math.round((b / n) * 1.1)));
      const dominant = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
      const ratio = img.width / img.height;
      let suggestedEmoji = "✦";
      if (ratio > 1.3) suggestedEmoji = "🖼️";
      else if (ratio < 0.8) suggestedEmoji = "📱";
      if (b > r && b > g) suggestedEmoji = "💻";
      else if (r > 140 && g > 100 && b < 100) suggestedEmoji = "🎨";
      else if (r > 150 && g > 120 && b > 80) suggestedEmoji = "🧵";
      resolve({ dominant, ratio, suggestedEmoji });
    };
    img.onerror = () => resolve({ dominant: "#1c2750", ratio: 1.5, suggestedEmoji: "✦" });
    img.src = dataUrl;
  });
}

/* ---------- Data model ---------- */

const DEFAULT_PROFILE = {
  firstName: "Wahab",
  lastName: "Ahmad",
  role: "Designer · Assistant Developer",
  tagline: "Give Me An Idea, I Make It Perfect.",
  location: "Chak Jhumra, Punjab, Pakistan",
  bio: "I'm Wahab Ahmad, a multi-disciplinary craftsman with 4+ years of hands-on craft mastery bridging master-tier industrial textile design with autonomous software engineering. I build from-scratch web & app ecosystems, engineer high-trust brand systems, and deliver production-ready assets for floors, feeds, and frameworks — clean, sharp, and built to last. Currently in my 3rd professional year at Galaxy 42A (Inox), with 2+ years formally completed on the floor and in the codebase.",
  whatsapp: "+92 317 0643281",
  phone: "0301 7013821",
  email: "rjvlog332@gmail.com",
  companyName: "Galaxy 42A (Inox)",
  companyAddress: "Near Shahi Wala, Chak Jhumra, Faisalabad District, Punjab, Pakistan",
  experienceYears: "2023 — Present · 2+ years completed · 3rd year ongoing",
  // New: multiple education & experience entries
  education: [
    {
      id: "edu_matric",
      degree: "Matriculation (Science)",
      institution: "Board of Intermediate & Secondary Education",
      year: "2019",
      grade: "A+",
      marks: "82%",
      location: "Faisalabad, Punjab",
      notes: "Science group — Mathematics, Physics, Chemistry, Biology foundation.",
    },
    {
      id: "edu_fa",
      degree: "F.A. (Faculty of Arts)",
      institution: "Board of Intermediate & Secondary Education",
      year: "2021",
      grade: "B",
      marks: "64%",
      location: "Faisalabad, Punjab",
      notes: "Humanities, composition, English, Urdu, and critical study.",
    },
    {
      id: "edu_gd",
      degree: "Graphic Design Certification",
      institution: "National Graphics Institute",
      year: "2022 – 2023",
      grade: "Merit",
      marks: "69%",
      location: "Faisalabad, Punjab",
      notes: "Typography · Composition · Print prepress · Digital media · Screen-print separations.",
    },
    {
      id: "edu_web",
      degree: "Web Building & Full-Stack Engineering",
      institution: "Self-directed · Project-based",
      year: "2023 – Present",
      grade: "Pro",
      marks: "—",
      location: "Chak Jhumra, Punjab",
      notes: "Next.js · TypeScript · Tailwind · Node APIs · Realtime DB · Autonomous AI pipelines.",
    },
  ] as EducationEntry[],
  experience: [
    {
      id: "exp_default",
      role: "Senior Designer & Autonomous Engineer",
      company: "Galaxy 42A (Inox)",
      duration: "2023 — Present · 2+ years completed · 3rd year ongoing",
      location: "Near Shahi Wala, Chak Jhumra, Faisalabad District, Punjab, Pakistan",
      description: "Cross-disciplinary floor-to-code role: multi-color screen-print separations, textile repeat & embroidery engineering, brand identity systems, internal production dashboards, and full-stack web/app builds for manufacturing clients.",
      current: true,
    },
  ] as ExperienceEntry[],
  template: "midnight" as ThemeTemplateId,
  accent: "#e0b86c",
  bg: "midnight" as const,
};

const SEED_PROJECTS: Project[] = [
  { id: "p1", title: "Multi-Color Separation — Streetwear Drop 01", description: "Six-color simulated process separation for a premium streetwear run. Vector-locked registration marks, calibrated halftone angles, and press-ready separations delivered with Pantone crosswalks.", category: "screen-printing", tags: ["Photoshop", "Illustrator", "Separations", "Halftones"], liveUrl: "#", downloadUrl: "#", coverEmoji: "🎨", coverColor: "#4a2a1f", createdAt: Date.now() - 864000000 },
  { id: "p2", title: "Minimal Noir Tee — Monochrome Line Art", description: "High-contrast vector illustration with discharge-white base and a gloss-black overprint. Optimized for 230gsm combed cotton bodies with zero bleed.", category: "screen-printing", tags: ["Illustrator", "Vector", "Monochrome"], liveUrl: "#", downloadUrl: "#", coverEmoji: "👕", coverColor: "#1a1e28", createdAt: Date.now() - 691200000 },
  { id: "p3", title: "Embroidered Lawn Suit — 'Midnight Estate'", description: "Complete retail-ready ladies suit concept: neckline embroidery, border patterns, and dupatta motif system. Print repeat engineered for 64\" digital fabric printers.", category: "textile", tags: ["Textile Design", "Repeat Patterns", "Embroidery"], liveUrl: "#", downloadUrl: "#", coverEmoji: "🧵", coverColor: "#152540", createdAt: Date.now() - 1555200000 },
  { id: "p4", title: "Karandi Winter Collection — Geometric Weave", description: "Apparel pattern suite with co-ordinated colorways across shirt, dupatta, and trouser. Delivered as layered PSDs with production cut sheets.", category: "textile", tags: ["Photoshop", "Pattern", "Apparel"], liveUrl: "#", downloadUrl: "#", coverEmoji: "❄️", coverColor: "#1a2a3a", createdAt: Date.now() - 2160000000 },
  { id: "p5", title: "NEXUS Agency — Full-Stack Web App", description: "From-scratch Next.js + TypeScript ecosystem: authentication, project pipelines, client staging previews, and AI-augmented deployment workflows. Built for a 100ms TTI budget.", category: "web-app", tags: ["Next.js", "TypeScript", "Tailwind", "PostgreSQL"], liveUrl: "#", downloadUrl: "#", coverEmoji: "💻", coverColor: "#0f2a2a", createdAt: Date.now() - 172800000 },
  { id: "p6", title: "Inventory OS — Real-Time Production Dashboard", description: "Internal manufacturing dashboard for print/textile production: job cards, per-press throughput, ink/substrate lot tracking, and automated PDF delivery to floor managers.", category: "web-app", tags: ["React", "Node", "Realtime", "Automation"], liveUrl: "#", downloadUrl: "#", coverEmoji: "⚙️", coverColor: "#1a1a2a", createdAt: Date.now() - 432000000 },
  { id: "p7", title: "Lookbook Reels — High-Contrast Social Pack", description: "Instagram/TikTok launch suite: 9-grid typographic posters, 3 motion tease cuts, and story templates tuned for a 4:5 premium-feed ratio.", category: "social-media", tags: ["Photoshop", "Premiere", "Social"], liveUrl: "#", downloadUrl: "#", coverEmoji: "📱", coverColor: "#3a1a28", createdAt: Date.now() - 259200000 },
  { id: "p8", title: "Brand Identity — 'Inox' Manufacturing Division", description: "Complete collateral set: monogram, spec sheet templates, production-floor signage, and business stationery system on matte charcoal stock with foil accents.", category: "social-media", tags: ["Branding", "Identity", "Print"], liveUrl: "#", downloadUrl: "#", coverEmoji: "🪪", coverColor: "#2a2518", createdAt: Date.now() - 1209600000 },
];

export interface ProfileDetails {
  firstName: string;
  lastName: string;
  role: string;
  tagline: string;
  location: string;
  bio: string;
  whatsapp: string;
  phone: string;
  email: string;
  companyName: string;
  companyAddress: string;
  experienceYears: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  template: ThemeTemplateId;
  accent: string;
  bg: string;
}

interface Theme {
  accent: string;
  bg: string;
}

interface PortfolioState {
  profileImage: string;
  profile: ProfileDetails;
  projects: Project[];
  theme: Theme;
  snapshots: Snapshot[];
  customTemplates: TemplateDef[];
  setProfileImage: (dataUrl: string) => void;
  setProfile: (patch: Partial<ProfileDetails>) => void;
  setTheme: (patch: Partial<Theme>) => void;
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addEducation: (entry: Omit<EducationEntry, "id">) => void;
  updateEducation: (id: string, patch: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;
  addExperience: (entry: Omit<ExperienceEntry, "id">) => void;
  updateExperience: (id: string, patch: Partial<ExperienceEntry>) => void;
  removeExperience: (id: string) => void;
  applyTemplate: (id: ThemeTemplateId) => void;
  saveCustomTemplate: (tpl: TemplateDef) => void;
  updateCustomTemplate: (id: string, patch: Partial<TemplateDef>) => void;
  deleteCustomTemplate: (id: string) => void;
  allTemplates: () => Record<string, TemplateDef>;
  saveSnapshot: (label: string) => Snapshot;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  resetAll: () => void;
}

export interface TemplateDef {
  id: ThemeTemplateId;
  name: string;
  category: "Dark · Cinematic" | "Dark · Tech" | "Light · Editorial" | "Color · Bold" | "Minimal · Mono" | "Experimental" | "Custom · Mine";
  accent: string;
  bg: string;
  surface: string;      // card bg
  border: string;       // border color
  text: string;         // body text
  muted: string;        // muted text
  heading: string;      // heading text
  font: "serif" | "sans" | "mono" | "display" | "mixed";
  radius: string;
  style: "sharp" | "soft" | "brutal" | "glass" | "gradient" | "paper" | "neon" | "grid" | "vintage" | "editorial" | "terminal" | "luxury" | "sporty" | "botanical" | "archive";
  desc: string;
  swatches: string[];
}

export const TEMPLATES: Record<ThemeTemplateId, TemplateDef> = {
  /* ---------- DARK · CINEMATIC ---------- */
  "midnight":        { id: "midnight",        name: "Midnight Gold",       category: "Dark · Cinematic", accent: "#e0b86c", bg: "#05070d", surface: "rgba(18,21,28,0.8)", border: "rgba(255,255,255,0.06)", text: "#e9ecf3", muted: "#8b93a7", heading: "#f3f4f6", font: "serif", radius: "2px", style: "sharp", desc: "Original cinematic dark portfolio with warm gold accent, bracket corners, ring-pulse, and film-noir mood.", swatches: ["#05070d","#0f1622","#1c2740","#e0b86c"] },
  "crimson-studio":  { id: "crimson-studio",  name: "Crimson Studio",      category: "Dark · Cinematic", accent: "#f25c54", bg: "#0a0506", surface: "rgba(26,8,11,0.75)", border: "rgba(242,92,84,0.18)", text: "#f5e6e8", muted: "#a8787a", heading: "#fff", font: "serif", radius: "2px", style: "sharp", desc: "Fashion-editorial black with crimson glow — gallery-ready, high drama, Vogue-style typography.", swatches: ["#0a0506","#1a080b","#2a0d12","#f25c54"] },
  "ember-noir":      { id: "ember-noir",      name: "Ember Noir",          category: "Dark · Cinematic", accent: "#ff7a4d", bg: "#0c0604", surface: "rgba(28,14,10,0.8)", border: "rgba(255,122,77,0.22)", text: "#f5e7df", muted: "#a48172", heading: "#fff2ea", font: "display", radius: "2px", style: "gradient", desc: "Charred obsidian with ember-orange edges — fire-lit, luxury fashion editorial.", swatches: ["#0c0604","#2a1108","#4a1a0c","#ff7a4d"] },
  "royal-violet":    { id: "royal-violet",    name: "Royal Violet",        category: "Dark · Cinematic", accent: "#c084fc", bg: "#08050f", surface: "rgba(22,14,38,0.8)", border: "rgba(192,132,252,0.22)", text: "#ece2ff", muted: "#9583bd", heading: "#f6eeff", font: "serif", radius: "2px", style: "luxury", desc: "Deep midnight violet with gilded purple accents — regal, royal, jewel-toned.", swatches: ["#08050f","#1a102e","#2d1b50","#c084fc"] },

  /* ---------- DARK · TECH ---------- */
  "midnight-steel":  { id: "midnight-steel",  name: "Steel Cyan",          category: "Dark · Tech",      accent: "#5eead4", bg: "#060a13", surface: "rgba(11,18,32,0.75)", border: "rgba(94,234,212,0.15)", text: "#d6dee9", muted: "#7c8a9e", heading: "#f0f7ff", font: "sans", radius: "4px", style: "glass", desc: "Cool steel substrate with cyan engineering accents — dev/SaaS-forward aesthetic.", swatches: ["#060a13","#0b1220","#162235","#5eead4"] },
  "emerald-labs":    { id: "emerald-labs",    name: "Emerald Labs",        category: "Dark · Tech",      accent: "#34d399", bg: "#040a08", surface: "rgba(8,22,18,0.75)", border: "rgba(52,211,153,0.18)", text: "#dbf5e9", muted: "#6b9985", heading: "#eafff3", font: "mono", radius: "4px", style: "terminal", desc: "Obsidian with emerald matrix-green — hacker-labs, biotech, code-led vibe.", swatches: ["#040a08","#081612","#0d241c","#34d399"] },
  "electric-blue":   { id: "electric-blue",   name: "Electric Blue",       category: "Dark · Tech",      accent: "#6bd6ff", bg: "#03060f", surface: "rgba(9,17,34,0.75)", border: "rgba(107,214,255,0.2)", text: "#dff1ff", muted: "#6b88a5", heading: "#f2f9ff", font: "sans", radius: "8px", style: "neon", desc: "Deep black with electric blue neon glow — cyberpunk, futuristic, screen-ready.", swatches: ["#03060f","#0a1629","#132b4f","#6bd6ff"] },
  "graphite":        { id: "graphite",        name: "Graphite Pro",        category: "Dark · Tech",      accent: "#94a3b8", bg: "#0c0f18", surface: "rgba(20,24,34,0.8)", border: "rgba(255,255,255,0.07)", text: "#e2e8f0", muted: "#8b96ab", heading: "#f8fafc", font: "sans", radius: "6px", style: "soft", desc: "Professional muted graphite — Apple/Square-style minimal SaaS, monochrome.", swatches: ["#0c0f18","#141822","#1f2433","#94a3b8"] },
  "terminal-amber":  { id: "terminal-amber",  name: "Terminal Amber",      category: "Dark · Tech",      accent: "#ffb000", bg: "#050402", surface: "#0a0805", border: "#3a2c00", text: "#f6e2a0", muted: "#8a7434", heading: "#ffc940", font: "mono", radius: "0px", style: "terminal", desc: "CRT/terminal green-screen homage in amber — hacker nostalgia, monospace, scanlines.", swatches: ["#050402","#0f0a03","#1f160a","#ffb000"] },
  "ocean-depth":     { id: "ocean-depth",     name: "Ocean Depth",         category: "Dark · Tech",      accent: "#38bdf8", bg: "#031424", surface: "rgba(8,32,56,0.75)", border: "rgba(56,189,248,0.2)", text: "#cde8f6", muted: "#6a96af", heading: "#e8f5fc", font: "sans", radius: "8px", style: "glass", desc: "Deep abyssal blue with sky-blue highlights — immersive, nautical, fintech-cool.", swatches: ["#031424","#0a2a44","#103d64","#38bdf8"] },

  /* ---------- LIGHT · EDITORIAL ---------- */
  "cream-editorial": { id: "cream-editorial", name: "Cream Editorial",     category: "Light · Editorial", accent: "#8b3a2c", bg: "#f2ebde", surface: "rgba(255,250,240,0.9)", border: "rgba(60,40,20,0.12)", text: "#1a1410", muted: "#6d5a40", heading: "#1a1410", font: "serif", radius: "2px", style: "paper", desc: "Cream-paper high-contrast editorial — magazine, serif-heavy, coffee-table book.", swatches: ["#f2ebde","#e3d8c2","#2a221b","#8b3a2c"] },
  "paper-ink":       { id: "paper-ink",       name: "Paper & Ink",         category: "Light · Editorial", accent: "#111111", bg: "#f7f5ef", surface: "#ffffff", border: "#111111", text: "#111", muted: "#666", heading: "#000", font: "serif", radius: "0px", style: "editorial", desc: "Swiss-design inspired pure black on off-white — brutalist newspaper, zero chrome.", swatches: ["#f7f5ef","#ffffff","#111111","#111111"] },
  "blush-editorial": { id: "blush-editorial", name: "Blush Atelier",       category: "Light · Editorial", accent: "#b84a6e", bg: "#faf1ee", surface: "#ffffff", border: "rgba(184,74,110,0.2)", text: "#3a2028", muted: "#8c6a72", heading: "#2a141c", font: "serif", radius: "0px", style: "editorial", desc: "Soft blush-pink editorial with rose accents — bridal, fashion atelier, feminine luxury.", swatches: ["#faf1ee","#f4dede","#3a2028","#b84a6e"] },
  "sage-paper":      { id: "sage-paper",      name: "Sage Paper",          category: "Light · Editorial", accent: "#3f5e4b", bg: "#eceee6", surface: "#fafaf4", border: "rgba(63,94,75,0.25)", text: "#202b23", muted: "#5e6e62", heading: "#141c17", font: "serif", radius: "2px", style: "botanical", desc: "Sage green naturalist paper — botanical, organic, calm and earthy.", swatches: ["#eceee6","#d5dcc8","#202b23","#3f5e4b"] },
  "desert-vintage":  { id: "desert-vintage",  name: "Desert Vintage",      category: "Light · Editorial", accent: "#b4732b", bg: "#efe3d0", surface: "#f9f2e6", border: "rgba(180,115,43,0.3)", text: "#2b1f10", muted: "#826747", heading: "#1a1209", font: "serif", radius: "2px", style: "vintage", desc: "Warm sand/ochre vintage travel poster aesthetic — grainy, sun-faded, nostalgic.", swatches: ["#efe3d0","#e6cfa7","#3a2a16","#b4732b"] },

  /* ---------- COLOR · BOLD ---------- */
  "sunset-pop":      { id: "sunset-pop",      name: "Sunset Pop",          category: "Color · Bold",      accent: "#ff4fa3", bg: "#0b0612", surface: "rgba(25,12,34,0.8)", border: "rgba(255,79,163,0.3)", text: "#fdeaf3", muted: "#b08ca4", heading: "#fff", font: "display", radius: "12px", style: "gradient", desc: "Vibrant magenta on deep violet with gradient blooms — pop, Gen-Z, music/entertainment.", swatches: ["#0b0612","#271038","#ff4fa3","#ff4fa3"] },
  "mint-bubble":     { id: "mint-bubble",     name: "Mint Bubble",         category: "Color · Bold",      accent: "#00d4aa", bg: "#eafff6", surface: "#ffffff", border: "rgba(0,212,170,0.3)", text: "#0a2f26", muted: "#4a8070", heading: "#061a14", font: "display", radius: "999px", style: "soft", desc: "Playful mint cream with pill shapes — soft, friendly, creator/influencer energy.", swatches: ["#eafff6","#b9ffe8","#0a2f26","#00d4aa"] },
  "tangerine":      { id: "tangerine",      name: "Tangerine Sport",     category: "Color · Bold",      accent: "#ff6b1a", bg: "#0d0703", surface: "rgba(30,16,6,0.8)", border: "rgba(255,107,26,0.3)", text: "#ffe8d6", muted: "#c0895e", heading: "#fff6ec", font: "display", radius: "4px", style: "sporty", desc: "Jet black with screaming tangerine — sportswear/streetwear energy, loud and confident.", swatches: ["#0d0703","#2d1406","#5a2408","#ff6b1a"] },
  "retro-wave":      { id: "retro-wave",      name: "Retro Wave",          category: "Color · Bold",      accent: "#ff44cc", bg: "#0b0420", surface: "rgba(25,10,60,0.8)", border: "rgba(255,68,204,0.3)", text: "#f4e4ff", muted: "#9c7fc8", heading: "#fff", font: "display", radius: "0px", style: "neon", desc: "80s synthwave — hot-pink + electric-purple grid, chrome, nostalgic vaporwave.", swatches: ["#0b0420","#200a55","#4a148c","#ff44cc"] },
  "lemon-lime":      { id: "lemon-lime",      name: "Lemon Lime Zest",     category: "Color · Bold",      accent: "#c8f542", bg: "#0e1205", surface: "rgba(25,34,10,0.8)", border: "rgba(200,245,66,0.2)", text: "#eef7d0", muted: "#96a369", heading: "#f7ffe0", font: "display", radius: "8px", style: "gradient", desc: "Electric lime green on forest black — zesty, street, sneakers/youth culture.", swatches: ["#0e1205","#223010","#3f5818","#c8f542"] },

  /* ---------- MINIMAL · MONO ---------- */
  "pure-minimal":    { id: "pure-minimal",    name: "Pure Minimal",        category: "Minimal · Mono",    accent: "#000000", bg: "#ffffff", surface: "#ffffff", border: "#eaeaea", text: "#1a1a1a", muted: "#888", heading: "#000", font: "sans", radius: "0px", style: "brutal", desc: "Pure white with black lines — Dieter Rams / MUJI minimalism, extreme restraint.", swatches: ["#ffffff","#f5f5f5","#1a1a1a","#000000"] },
  "slate-mono":      { id: "slate-mono",      name: "Slate Mono",          category: "Minimal · Mono",    accent: "#334155", bg: "#f1f5f9", surface: "#ffffff", border: "#cbd5e1", text: "#0f172a", muted: "#64748b", heading: "#020617", font: "mono", radius: "4px", style: "grid", desc: "Technical slate mono — Figma/Linear-inspired, subtle grid, restrained engineering.", swatches: ["#f1f5f9","#e2e8f0","#334155","#334155"] },

  /* ---------- EXPERIMENTAL ---------- */
  "archive-brutal":  { id: "archive-brutal",  name: "Archive Brutalist",   category: "Experimental",     accent: "#ffee00", bg: "#000000", surface: "#0a0a0a", border: "#ffee00", text: "#fff", muted: "#999", heading: "#ffee00", font: "mono", radius: "0px", style: "brutal", desc: "Black/yellow high-contrast brutalism — raw HTML energy, Visigothic, loud.", swatches: ["#000","#0a0a0a","#ffee00","#ffee00"] },
  "newsprint":       { id: "newsprint",       name: "Newsprint Tabloid",   category: "Experimental",     accent: "#d00000", bg: "#ece6d4", surface: "#f8f4e8", border: "#1a1a1a", text: "#1a1a1a", muted: "#6b6354", heading: "#000", font: "serif", radius: "0px", style: "editorial", desc: "Tabloid newspaper energy — heavy serif headlines, red masthead, torn edges, print-media grit.", swatches: ["#ece6d4","#f8f4e8","#1a1a1a","#d00000"] },
  "glass-gradient":  { id: "glass-gradient",  name: "Aurora Glass",       category: "Experimental",     accent: "#f472b6", bg: "#070815", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "#e9e9f2", muted: "#7a7d98", heading: "#fff", font: "sans", radius: "12px", style: "glass", desc: "Frosted glass morphism over flowing aurora gradients — iOS/macOS big-sur style.", swatches: ["#070815","#1a1b3a","#4c2a75","#f472b6"] },
};

const PortfolioContext = createContext<PortfolioState | null>(null);

const CUSTOM_TEMPLATES_KEY = "wahab_portfolio_custom_templates_v1";

// Determine if a hex color is light (for light/dark color-scheme switching)
function hexLight(hex: string): boolean {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  // Perceived brightness (ITU-R BT.709)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [profileImage, setProfileImageState] = useState<string>("/profile.jpg");
  const [profile, setProfileState] = useState<ProfileDetails>(DEFAULT_PROFILE);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [theme, setThemeState] = useState<Theme>({ accent: DEFAULT_PROFILE.accent, bg: DEFAULT_PROFILE.bg });
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [customTemplates, setCustomTemplates] = useState<TemplateDef[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* ---- load ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.profileImage) setProfileImageState(parsed.profileImage);
        if (parsed.profile) {
          const merged = {
            ...DEFAULT_PROFILE,
            ...parsed.profile,
            education: Array.isArray(parsed.profile.education) && parsed.profile.education.length
              ? parsed.profile.education
              : DEFAULT_PROFILE.education,
            experience: Array.isArray(parsed.profile.experience) && parsed.profile.experience.length
              ? parsed.profile.experience
              : DEFAULT_PROFILE.experience,
            template: parsed.profile.template || "midnight",
            accent: parsed.profile.accent || parsed.theme?.accent || DEFAULT_PROFILE.accent,
            bg: parsed.profile.bg || parsed.theme?.bg || DEFAULT_PROFILE.bg,
          };
          setProfileState(merged);
          setThemeState({ accent: merged.accent, bg: merged.bg });
        }
        if (Array.isArray(parsed.projects) && parsed.projects.length) setProjects(parsed.projects);
        if (parsed.theme && !parsed.profile?.accent) setThemeState({ accent: parsed.theme.accent || DEFAULT_PROFILE.accent, bg: parsed.theme.bg || DEFAULT_PROFILE.bg });
      }
      const snapRaw = localStorage.getItem(SNAPSHOTS_KEY);
      if (snapRaw) {
        const s = JSON.parse(snapRaw);
        if (Array.isArray(s)) setSnapshots(s.slice(0, 20));
      }
      const custRaw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      if (custRaw) {
        const c = JSON.parse(custRaw);
        if (Array.isArray(c)) setCustomTemplates(c);
      }
    } catch { /* ignore */ }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- persist + apply CSS vars ---- */
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.accent);
    const bgMap: Record<string, string> = {
      midnight: "#05070d", darker: "#02030a", steel: "#080b14", charcoal: "#0c0f18",
      "midnight-steel": "#060a13", "cream-editorial": "#f2ebde",
      "crimson-studio": "#0a0506", "emerald-labs": "#040a08",
    };
    const bgVal = bgMap[theme.bg] || theme.bg || "#05070d";
    root.style.setProperty("--bg", bgVal);

    // Apply full template palette inline (works for built-in AND custom templates)
    const currentTpl = allTemplates()[theme.bg || "midnight"];
    if (currentTpl) {
      root.setAttribute("data-theme", theme.bg || "midnight");
      root.style.setProperty("--bg", currentTpl.bg);
      root.style.setProperty("--surface", currentTpl.surface);
      root.style.setProperty("--border", currentTpl.border);
      root.style.setProperty("--text", currentTpl.text);
      root.style.setProperty("--muted", currentTpl.muted);
      root.style.setProperty("--heading", currentTpl.heading);
      root.style.setProperty("--accent", currentTpl.accent);
      root.style.setProperty("--radius", currentTpl.radius);
      const isLight = /editorial|paper|sage|desert|mint|pure-minimal|slate-mono|newsprint/.test(currentTpl.id) || currentTpl.bg.toLowerCase().replace(/[^a-f0-9]/g, "").length === 6 && hexLight(currentTpl.bg);
      root.style.colorScheme = isLight ? "light" : "dark";
      root.style.setProperty("--fg", isLight ? "#141010" : "#e6e7ea");
      root.style.setProperty("--steel-300", isLight ? "#3a332a" : "#b6bcc8");
      root.style.setProperty("--steel-500", isLight ? "#6d6357" : "#5b6573");
    } else {
      root.setAttribute("data-theme", theme.bg || "midnight");
      root.style.setProperty("--fg", "#e6e7ea");
      root.style.setProperty("--steel-300", "#b6bcc8");
      root.style.setProperty("--steel-500", "#5b6573");
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profileImage,
          profile: { ...profile, accent: theme.accent, bg: theme.bg },
          projects,
          theme,
        })
      );
    } catch { /* quota */ }
  }, [profileImage, profile, projects, theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots)); } catch { /* ignore */ }
  }, [snapshots, hydrated]);

  const genId = () => (crypto.randomUUID?.() ?? `x_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  const allTemplates = () => {
    const merged: Record<string, TemplateDef> = { ...TEMPLATES };
    customTemplates.forEach((t) => { merged[t.id] = t; });
    return merged;
  };

  const applyTemplate = (id: ThemeTemplateId) => {
    const t = allTemplates()[id];
    if (!t) return;
    setThemeState({ accent: t.accent, bg: id });
    setProfileState((prev) => ({ ...prev, template: id, accent: t.accent, bg: id }));
    // Apply CSS vars inline for custom themes (since they aren't in globals.css)
    if (typeof window !== "undefined" && !TEMPLATES[id]) {
      const root = document.documentElement;
      root.setAttribute("data-theme", "custom");
      root.style.setProperty("--bg", t.bg);
      root.style.setProperty("--surface", t.surface);
      root.style.setProperty("--border", t.border);
      root.style.setProperty("--text", t.text);
      root.style.setProperty("--muted", t.muted);
      root.style.setProperty("--heading", t.heading);
      root.style.setProperty("--accent", t.accent);
      root.style.setProperty("--radius", t.radius);
    }
  };

  // Persist custom templates
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates)); } catch { /* ignore */ }
  }, [customTemplates, hydrated]);

  // Re-apply CSS vars for custom template on hydration (so refreshes restore look)
  useEffect(() => {
    if (!hydrated) return;
    const t = allTemplates()[profile.template];
    if (t && !TEMPLATES[profile.template]) applyTemplate(t.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const saveCustomTemplate = (tpl: TemplateDef) => {
    setCustomTemplates((prev) => {
      const exists = prev.find((x) => x.id === tpl.id);
      if (exists) return prev.map((x) => (x.id === tpl.id ? tpl : x));
      return [...prev, tpl];
    });
  };
  const updateCustomTemplate = (id: string, patch: Partial<TemplateDef>) => {
    setCustomTemplates((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } as TemplateDef : x)));
  };
  const deleteCustomTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((x) => x.id !== id));
    if (profile.template === id) {
      applyTemplate("midnight");
    }
  };

  const saveSnapshot = (label: string): Snapshot => {
    const snap: Snapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: label || `Snapshot ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      profile: { ...(profile as unknown as Record<string, unknown>), accent: theme.accent, bg: theme.bg },
      projects: JSON.parse(JSON.stringify(projects)),
    };
    setSnapshots((prev) => [snap, ...prev].slice(0, 20));
    return snap;
  };
  const loadSnapshot = (id: string) => {
    const s = snapshots.find((x) => x.id === id);
    if (!s) return;
    setProfileState({ ...DEFAULT_PROFILE, ...(s.profile as Partial<ProfileDetails>) } as ProfileDetails);
    setProjects(JSON.parse(JSON.stringify(s.projects)));
    setThemeState({ accent: (s.profile.accent as string) ?? DEFAULT_PROFILE.accent, bg: (s.profile.bg as string) ?? DEFAULT_PROFILE.bg });
  };
  const deleteSnapshot = (id: string) => setSnapshots((prev) => prev.filter((s) => s.id !== id));

  const value = useMemo<PortfolioState>(
    () => ({
      profileImage,
      profile,
      projects,
      theme,
      snapshots,
      setProfileImage: (d) => setProfileImageState(d),
      setProfile: (patch) => setProfileState((prev) => ({ ...prev, ...patch })),
      setTheme: (patch) => setThemeState((prev) => ({ ...prev, ...patch })),
      addProject: (p) => setProjects((prev) => [{ ...p, id: genId(), createdAt: Date.now() }, ...prev]),
      updateProject: (id, patch) => setProjects((prev) => prev.map((pr) => (pr.id === id ? { ...pr, ...patch } : pr))),
      deleteProject: (id) => setProjects((prev) => prev.filter((pr) => pr.id !== id)),
      addEducation: (entry) => setProfileState((prev) => ({ ...prev, education: [{ ...entry, id: genId() }, ...prev.education] })),
      updateEducation: (id, patch) => setProfileState((prev) => ({ ...prev, education: prev.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEducation: (id) => setProfileState((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) })),
      addExperience: (entry) => setProfileState((prev) => ({ ...prev, experience: [{ ...entry, id: genId() }, ...prev.experience] })),
      updateExperience: (id, patch) => setProfileState((prev) => ({ ...prev, experience: prev.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeExperience: (id) => setProfileState((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) })),
      applyTemplate,
      customTemplates,
      saveCustomTemplate,
      updateCustomTemplate,
      deleteCustomTemplate,
      allTemplates,
      saveSnapshot,
      loadSnapshot,
      deleteSnapshot,
      resetAll: () => {
        setProfileImageState("/profile.jpg");
        setProfileState(DEFAULT_PROFILE);
        setProjects(SEED_PROJECTS);
        setThemeState({ accent: DEFAULT_PROFILE.accent, bg: DEFAULT_PROFILE.bg });
        setSnapshots([]);
        setCustomTemplates([]);
        try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(SNAPSHOTS_KEY); localStorage.removeItem(CUSTOM_TEMPLATES_KEY); } catch { /* ignore */ }
      },
    }),
    [profileImage, profile, projects, theme, snapshots, customTemplates]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

/* ---------- Admin UI modal control ---------- */

interface AdminUI {
  open: boolean;
  stage: "closed" | "gate" | "dashboard";
  openGate: () => void;
  closeAll: () => void;
  openDashboard: () => void;
}
const AdminUIContext = createContext<AdminUI | null>(null);

export function AdminUIProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<AdminUI["stage"]>("closed");
  const value = useMemo<AdminUI>(
    () => ({
      open: stage !== "closed",
      stage,
      openGate: () => setStage("gate"),
      openDashboard: () => setStage("dashboard"),
      closeAll: () => setStage("closed"),
    }),
    [stage]
  );
  return <AdminUIContext.Provider value={value}>{children}</AdminUIContext.Provider>;
}

export function useAdminUI() {
  const ctx = useContext(AdminUIContext);
  if (!ctx) throw new Error("useAdminUI must be used within AdminUIProvider");
  return ctx;
}

/* ---------- Auth ---------- */

const VALID_KEYS = new Set<string>([
  "/addmine",
  "/addmine/330",
  "/addmine/3310",
  "/addmine/3310/Wahab",
  "/addmine/3310/wahab",
  "/addmine/1122",
  "/addmine/Moiz/1122",
  "/addmine/Wahab",
]);
const AUTH_KEY = "wahab_admin_auth_v4";

interface AuthCtx {
  authed: boolean;
  tryKey: (key: string) => boolean;
  logout: () => void;
  usedKey: string | null;
}
const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [usedKey, setUsedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.authed && VALID_KEYS.has(p.usedKey)) {
          setAuthed(true);
          setUsedKey(p.usedKey);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const tryKey = (rawKey: string) => {
    let key = rawKey.trim().replace(/\/+$/, "");
    if (!key.startsWith("/")) key = "/" + key;
    if (VALID_KEYS.has(key)) {
      setAuthed(true); setUsedKey(key);
      try { sessionStorage.setItem(AUTH_KEY, JSON.stringify({ authed: true, usedKey: key })); } catch { /* ignore */ }
      return true;
    }
    if (key.toLowerCase() === "/addmine/3310/wahab" && VALID_KEYS.has("/addmine/3310/Wahab")) {
      setAuthed(true); setUsedKey("/addmine/3310/Wahab");
      try { sessionStorage.setItem(AUTH_KEY, JSON.stringify({ authed: true, usedKey: "/addmine/3310/Wahab" })); } catch { /* ignore */ }
      return true;
    }
    return false;
  };
  const logout = () => {
    setAuthed(false); setUsedKey(null);
    try { sessionStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
  };

  return <AuthContext.Provider value={{ authed, tryKey, logout, usedKey }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
