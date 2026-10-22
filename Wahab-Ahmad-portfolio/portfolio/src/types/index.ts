export type ProjectCategory =
  | "screen-printing"
  | "textile"
  | "web-app"
  | "social-media";

export type AssetFrame =
  | "tshirt"      // ~3:4 portrait (tee mockup)
  | "poster"      // 2:3 portrait
  | "landscape"   // 16:9
  | "square"      // 1:1
  | "textile"     // repeat / wide
  | "web"         // 16:10 desktop
  | "mobile"      // 9:16
  | "social"      // 4:5 instagram
  | "auto";

export interface Asset {
  id: string;
  name: string;
  dataUrl: string;
  thumbnailUrl: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  frame: AssetFrame;
  aiTitle: string;
  aiDescription: string;
  aiTags: string[];
  enhanced: boolean;
  uploadedAt: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  tags: string[];
  liveUrl?: string;
  downloadUrl?: string;
  coverEmoji?: string;
  coverColor?: string;
  coverImage?: string;
  assets?: Asset[];
  createdAt: number;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  year: string;
  grade?: string;
  marks?: string;
  location?: string;
  notes?: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;           // designation e.g. "Senior Designer & Engineer"
  company: string;
  duration: string;       // "2023 – Present · 2+ years completed"
  location?: string;
  description?: string;   // bullets / summary
  current?: boolean;
}

export type ThemeTemplateId =
  | "midnight"
  | "crimson-studio"
  | "ember-noir"
  | "royal-violet"
  | "midnight-steel"
  | "emerald-labs"
  | "electric-blue"
  | "graphite"
  | "terminal-amber"
  | "ocean-depth"
  | "cream-editorial"
  | "paper-ink"
  | "blush-editorial"
  | "sage-paper"
  | "desert-vintage"
  | "sunset-pop"
  | "mint-bubble"
  | "tangerine"
  | "retro-wave"
  | "lemon-lime"
  | "pure-minimal"
  | "slate-mono"
  | "newsprint"
  | "archive-brutal"
  | "glass-gradient"
  | (string & {});

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  email: string;
  whatsapp: string;
  phone: string;
  location: string;
  accent: string;
  bg: ThemeBg;
  heroImage?: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  template: ThemeTemplateId;
}

export type ThemeBg = string;

export interface Snapshot {
  id: string;
  label: string;
  createdAt: number;
  profile: Record<string, unknown>;
  projects: Project[];
}
