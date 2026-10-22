"use client";

import type { ProjectCategory, Project, ThemeTemplateId } from "@/types";
import type { ProfileDetails } from "./store";
import { TEMPLATES } from "./store";
import type { TemplateDef } from "./store";

/* -------------------------------------------------------------------------- */
/*  AddMine Agent v2 — multilingual, human-style, confirm-and-commit, with    */
/*  template previews, snapshot/undo, typo-clarification.                     */
/*  100% client-side rule-based LLM with intent routing + NLP heuristics.      */
/* -------------------------------------------------------------------------- */

export type LLMPersona = "creative" | "analyst" | "engineer" | "vision" | "manager";

export interface Persona {
  id: LLMPersona;
  name: string;
  tagline: string;
  color: string;
  icon: string;
}

export const PERSONAS: Persona[] = [
  { id: "creative", name: "Creative", tagline: "Copy · Brand · Tone", color: "text-accent", icon: "✒️" },
  { id: "analyst", name: "Analyst", tagline: "Data · CRO · Metrics", color: "text-accent-cyan", icon: "📊" },
  { id: "engineer", name: "Engineer", tagline: "Code · Performance · SEO", color: "text-emerald-400", icon: "⚙️" },
  { id: "vision", name: "Vision", tagline: "Aesthetics · Palette · Layout", color: "text-fuchsia-400", icon: "👁️" },
  { id: "manager", name: "Manager", tagline: "Tasks · Schedule · Ops", color: "text-orange-400", icon: "📋" },
];

export type Lang = "en" | "roman-ur" | "ur";

export interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  at: number;
  persona?: LLMPersona;
  lang?: Lang;
  pendingConfirm?: ConfirmationPrompt;  // assistant is asking for confirmation
  actions?: AgentAction[];
  templates?: TemplatePreview[];
}

export interface AgentAction {
  id: string;
  label: string;
  kind: "patch" | "add-project" | "delete-project" | "navigate" | "theme" | "apply-template" | "snapshot" | "schedule" | "info" | "add-education" | "add-experience" | "set-lang";
  payload?: unknown;
}

export interface TemplatePreview {
  id: ThemeTemplateId;
  name: string;
  desc: string;
  swatches: string[];
}

export interface ConfirmationPrompt {
  kind: "delete-project" | "reset" | "bulk-change" | "template" | "typo-correction";
  summary: string;
  suggested?: string;   // for typo-correction
  original?: string;
  onConfirmPayload: Record<string, unknown>;
}

export interface ScheduledTask {
  id: string;
  title: string;
  notes: string;
  dueAt: number;
  createdAt: number;
  status: "queued" | "done";
}

/* ---------------------------- Knowledge Base ------------------------------- */

const KB = {
  name: "Wahab Ahmad",
  role: "Designer · Assistant Developer",
  location: "Chak Jhumra, Faisalabad District, Punjab, Pakistan",
  tagline: "Give Me An Idea, I Make It Perfect.",
  email: "rjvlog332@gmail.com",
  whatsapp: "+92 317 0643281",
  phone: "0301 7013821",
  totalYears: "2+ years completed · 3rd year in progress (2023–Present at Galaxy 42A / Inox)",
  disciplines: [
    "Screen printing & multi-color separations",
    "Textile / ladies suit design & repeat patterns",
    "Web & app engineering (Next.js · TypeScript · Tailwind)",
    "Brand identity · Social media · Print collateral",
  ],
  stack: {
    design: ["Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Adobe XD", "Figma UI/UX"],
    dev: ["Next.js (App Router)", "TypeScript", "Tailwind CSS", "Node.js APIs", "Realtime DB", "AI-augmented CI"],
  },
};

/* ------------------------------ i18n -------------------------------------- */

const TR: Record<Lang, Record<string, string>> = {
  en: {
    greet: "Salaam. I'm Wahab's on-device executive — running locally, no cloud. Ask me anything, tell me to change anything, or say 'help'.",
    unknown: "Noted. I didn't parse a command there — say 'help' to see what I can do, or rephrase more specifically (e.g. 'make accent crimson').",
    closing: "Closing console.",
  },
  "roman-ur": {
    greet: "Salaam bhai! Main AddMine agent hoon, bilkul local chal raha hoon — koi cloud nahi. Kuch bhi poocho, ya koi bhi cheez badalne ko kaho, ya 'help' likho.",
    unknown: "Samjha nahi bhai. Zara saaf lafzon mein batao — ya 'help' likho to saaray commands dekh lo.",
    closing: "Console band kar raha hoon.",
  },
  ur: {
    greet: "السلام علیکم! میں ایڈمائن ایجنٹ ہوں، مکمل لوکل — کوئی کلاؤڈ نہیں۔ کچھ بھی پوچھیں، یا کوئی بھی چیز بدلنے کو کہیں، یا 'help' لکھیں۔",
    unknown: "نہیں سمجھا، ذرا واضح الفاظ میں بتائیں۔ مدد کے لیے 'help' لکھیں۔",
    closing: "کنسول بند ہو رہا ہے۔",
  },
};

/* ---------------------------- Language detect ----------------------------- */

function detectLang(input: string): Lang {
  if (/[\u0600-\u06FF]/.test(input)) return "ur";
  const low = input.toLowerCase();
  const romanMarkers = [
    /\b(bhai|bhai jan|salaam|salam|kya|kaise|karo|karo ge|karo gay|karna|hai|hain|hoon|ho|main|tum|aap|kuch|koi|mujhe|mujhy|mera|meri|batao|dikhao|badlo|change karo|theek|achha|acha|nahi|haan|ji|shukriya)\b/,
  ];
  for (const r of romanMarkers) if (r.test(low)) return "roman-ur";
  return "en";
}

/* ------------------------------ Utilities --------------------------------- */

const uid = () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

const WORD_TYPO_MAP: Record<string, string> = {
  // english common misspellings
  teh: "the", te: "the", th: "the",
  wat: "what", wht: "what", "wht's": "what's",
  yu: "you", u: "you", ur: "your", yo: "you",
  plz: "please", pls: "please",
  thnx: "thanks", thx: "thanks", shukriya: "shukriya",
  n8: "night", gn: "good night",
  acccent: "accent", axxent: "accent", acent: "accent",
  buttom: "button", buton: "button", buttn: "button",
  clr: "color", colr: "color", coulor: "color",
  crimsn: "crimson", crimsom: "crimson",
  tehme: "theme", theem: "theme",
  projct: "project", projec: "project",
  wahaab: "wahab",
  // roman urdu translit normalization
  "as-salam": "salaam", assalam: "salaam",
  bhae: "bhai", bahi: "bhai",
  btana: "batao",
  kro: "karo", kur: "karo",
  chenge: "change",
  bdlo: "badlo",
  thk: "theek",
};

function autocorrect(input: string): { corrected: string; fixes: string[] } {
  const fixes: string[] = [];
  const tokens = input.split(/(\s+|[.,!?;:"'/()])/);
  const out = tokens.map((tok) => {
    if (/^\s+$/.test(tok) || /^[.,!?;:"'/()]$/.test(tok)) return tok;
    const low = tok.toLowerCase();
    if (WORD_TYPO_MAP[low]) {
      fixes.push(`${tok} → ${WORD_TYPO_MAP[low]}`);
      // preserve original casing for first letter
      const rep = WORD_TYPO_MAP[low];
      return tok[0] === tok[0].toUpperCase() ? rep[0].toUpperCase() + rep.slice(1) : rep;
    }
    return tok;
  });
  return { corrected: out.join(""), fixes };
}

function parseTimePhrase(input: string): { at?: Date; delayMs?: number; label?: string } {
  const now = new Date();
  const low = input.toLowerCase();
  let delayMs = 0; let label = "";
  const m = low.match(/in\s+(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|ghanta|ghantay)/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    if (unit.startsWith("s")) delayMs = n * 1000;
    else if (unit.startsWith("m")) delayMs = n * 60 * 1000;
    else delayMs = n * 60 * 60 * 1000;
    label = `in ${n} ${unit}`;
  } else if (low.includes("tomorrow") || /kal\s*(subah|morning)?/.test(low)) {
    const t = new Date(now); t.setDate(t.getDate() + 1); t.setHours(10, 0, 0, 0);
    return { at: t, label: "tomorrow 10:00" };
  } else if (low.includes("tonight") || /aaj\s*raat/.test(low)) {
    const t = new Date(now); t.setHours(22, 0, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return { at: t, label: "tonight 22:00" };
  }
  if (delayMs > 0) return { at: new Date(now.getTime() + delayMs), delayMs, label };
  return {};
}

const hexRegex = /#([0-9a-f]{6}|[0-9a-f]{3})/i;

const colorMap: Record<string, string> = {
  gold: "#e0b86c", amber: "#f5b041", bronze: "#c78d48",
  crimson: "#e74c3c", red: "#ff4d57", laal: "#e74c3c", surkh: "#e74c3c",
  rose: "#f43f5e", pink: "#f472b6", gulabi: "#f472b6",
  emerald: "#34d399", green: "#10b981", sabz: "#10b981", hara: "#10b981",
  teal: "#2dd4bf", cyan: "#6bd6ff", ferozi: "#2dd4bf", asmani: "#6bd6ff",
  blue: "#3b82f6", neela: "#3b82f6", indigo: "#6366f1",
  violet: "#a78bfa", purple: "#c084fc", jamni: "#a78bfa",
  fuchsia: "#e879f9", orange: "#fb923c", narangi: "#fb923c",
  silver: "#c4c9d6", chandi: "#c4c9d6", white: "#f0f2f8", sufaid: "#f0f2f8",
  black: "#05070d", kala: "#05070d",
};

type AgentContext = {
  profile: ProfileDetails;
  projects: Project[];
  theme: { accent: string; bg: string };
  setTheme: (patch: Partial<{ accent: string; bg: string }>) => void;
  setProfile: (p: Partial<ProfileDetails>) => void;
  addProject: (p: Omit<Project, "id" | "createdAt">) => void;
  deleteProject: (id: string) => void;
  addEducation: (e: Omit<import("@/types").EducationEntry, "id">) => void;
  addExperience: (e: Omit<import("@/types").ExperienceEntry, "id">) => void;
  applyTemplate: (id: ThemeTemplateId) => void;
  saveSnapshot: (label: string) => import("@/types").Snapshot;
  loadSnapshot: (id: string) => void;
  snapshots: import("@/types").Snapshot[];
  closeAdmin: () => void;
  scrollTo?: (id: string) => void;
  setLang?: (l: Lang) => void;
};

type AgentResult = {
  reply: string;
  lang: Lang;
  actions?: AgentAction[];
  statePatches?: {
    profile?: Partial<ProfileDetails>;
    theme?: Partial<{ accent: string; bg: string }>;
    addProject?: Omit<Project, "id" | "createdAt">;
    addEducation?: Omit<import("@/types").EducationEntry, "id">;
    addExperience?: Omit<import("@/types").ExperienceEntry, "id">;
    applyTemplate?: ThemeTemplateId;
    saveSnapshot?: string;
    setLang?: Lang;
  };
  schedule?: { title: string; notes: string; at: Date };
  pendingConfirm?: ConfirmationPrompt;
  templates?: TemplatePreview[];
};

/* ----------------------- intent helpers ----------------------------------- */

function humanTone(persona: LLMPersona, lang: Lang): string {
  if (persona === "manager") {
    if (lang === "roman-ur") return "Brief note: ";
    if (lang === "ur") return "خلاصہ: ";
    return "Brief: ";
  }
  if (persona === "creative") return "✒️ ";
  if (persona === "engineer") return "⚙️ ";
  if (persona === "vision") return "👁️ ";
  if (persona === "analyst") return "📊 ";
  return "";
}

/* --------------------------------- Model ---------------------------------- */

export function runAgent(
  inputRaw: string,
  ctx: AgentContext,
  persona: LLMPersona,
  opts?: { expectingConfirmation?: boolean; lastPrompt?: ConfirmationPrompt }
): AgentResult {
  const pre = autocorrect(inputRaw.trim());
  let input = pre.corrected;
  const lang = detectLang(input);
  const low = input.toLowerCase();
  const t = humanTone(persona, lang);

  // ----- language switch commands -----
  if (/(speak|talk|use|switch|language).*(urdu|roman|english|hindi)/i.test(low) || /(urdu|roman urdu|english) mein (bolo|bat karo|baat)/i.test(low)) {
    let target: Lang = lang;
    if (/urdu/.test(low) && !/roman/.test(low)) target = "ur";
    else if (/roman/.test(low)) target = "roman-ur";
    else if (/english/.test(low)) target = "en";
    const msg = target === "ur" ? "ab urdu mein baat karta hoon ✓"
      : target === "roman-ur" ? "Ab Roman Urdu mein baat karta hoon ✓"
      : "Switched to English ✓";
    return { reply: t + msg, lang, statePatches: { setLang: target } };
  }

  // ----- typo clarification (only if at least one non-trivial fix) -----
  if (pre.fixes.length && !opts?.expectingConfirmation) {
    const unique = Array.from(new Set(pre.fixes));
    // only surface when fixes are interesting (ignore trivial short words)
    const interesting = unique.filter((f) => f.split(" → ")[0].length >= 3);
    if (interesting.length) {
      const fixList = interesting.slice(0, 4).join(", ");
      const msg = lang === "ur"
        ? `${t}آپ کی ٹائپنگ میں معمولی غلطی نظر آئی: ${fixList}۔ کیا میں درست کر کے آگے بڑھوں؟`
        : lang === "roman-ur"
          ? `${t}Bhai, thodi si typo lag rahi hai — ${fixList}. Theek kar ke aage barhoon?`
          : `${t}I noticed a small typo: ${fixList}. Correct it and continue?`;
      return {
        reply: msg,
        lang,
        pendingConfirm: {
          kind: "typo-correction",
          summary: fixList,
          original: inputRaw,
          suggested: input,
          onConfirmPayload: { useCorrected: true },
        },
        actions: [
          { id: "typo-yes", label: lang === "en" ? "Yes, correct it" : lang === "ur" ? "جی ہاں، درست کریں" : "Haan theek karo", kind: "patch", payload: { useCorrected: true } },
          { id: "typo-no", label: lang === "en" ? "No, keep as-is" : lang === "ur" ? "نہیں، ایسے ہی رہنے دیں" : "Nahi, as-is rakho", kind: "patch", payload: { useCorrected: false } },
        ],
      };
    }
  }

  // ----- confirmation resolution -----
  if (opts?.expectingConfirmation && opts.lastPrompt) {
    const yes = /(yes|haan|jee haan|ji haan|haan ji|haan g|kar do|karo|karde|theek hai|ok|okay|achi baat|bhej do|apply|lagao|lagadu|jaldi|go|confirm|bilkul|yep|y|sure|ji|jee)\b/i.test(low);
    const no = /(no|nahi|nahin|na|mat karo|mat kro|rehne do|rehn do|cancel|ruk jao|stop|nope|n)\b/i.test(low);
    if (yes && opts.lastPrompt.kind === "typo-correction") {
      return runAgent(opts.lastPrompt.suggested || inputRaw, ctx, persona);
    }
    if (yes && opts.lastPrompt.kind === "delete-project") {
      const pid = opts.lastPrompt.onConfirmPayload.projectId as string;
      const p = ctx.projects.find((x) => x.id === pid);
      if (p) ctx.deleteProject(p.id);
      const msg = lang === "ur" ? `پروجیکٹ «${p?.title}» حذف ہو گیا۔` : lang === "roman-ur" ? `Project «${p?.title}» delete kar diya.` : `Deleted project "${p?.title}". I auto-saved a snapshot before removing it so you can undo.`;
      return { reply: t + msg, lang, statePatches: { saveSnapshot: `Before deleting ${p?.title ?? "project"}` } };
    }
    if (yes && opts.lastPrompt.kind === "template") {
      const tid = opts.lastPrompt.onConfirmPayload.templateId as ThemeTemplateId;
      return {
        reply: t + (lang === "ur" ? `ٹیمپلیٹ «${TEMPLATES[tid].name}» نافذ کر رہا ہوں۔`
          : lang === "roman-ur" ? `Template «${TEMPLATES[tid].name}» apply kar raha hoon (auto-snapshot liya hua hai).`
          : `Applying template "${TEMPLATES[tid].name}". I saved a snapshot first so you can undo anytime.`),
        lang,
        statePatches: { applyTemplate: tid, saveSnapshot: `Before switching to ${TEMPLATES[tid].name}` },
      };
    }
    if (yes && opts.lastPrompt.kind === "reset") {
      return { reply: t + (lang === "en" ? "Reset confirmed — but I require you to press the red Reset button in Identity tab (prevents accidental nukes)." : lang === "roman-ur" ? "Reset ke liye Identity tab mein laal Reset button dabao (galti se data na ujray)." : "ری سیٹ کے لیے شناختی ٹیب میں سرخ بٹن دبائیں۔"), lang };
    }
    if (no) {
      return { reply: t + (lang === "en" ? "Cancelled. Nothing changed." : lang === "roman-ur" ? "Mannat cancel. Kuch nahi badla." : "منسوخ۔ کچھ نہیں بدلا۔"), lang };
    }
  }

  // ----- greetings -----
  if (/^(hi|hello|hey|salam|salaam|as[ -]?salam|adaab|yo|haan ji)\b/.test(low)) {
    return { reply: t + TR[lang].greet, lang };
  }
  if (/who are you|what are you|ap kaun|tum kaun|aap kaun|your name|apka naam/.test(low)) {
    return {
      reply: t + (lang === "ur"
        ? "میں AddMine ایجنٹ ہوں — Wahab Ahmad کے پورٹ فولیو میں مکمل لوکل چلنے والا معاون۔ پانچ شخصیات، کثیر اللسانی ڈیزائن کنٹرول، اور براہ راست اسٹیٹ میں ترمیم کر سکتا ہوں۔"
        : lang === "roman-ur"
          ? "Main AddMine agent hoon — Wahab ke portfolio mein local chalne wala AI assistant. 5 personas, multilingual, aur live state edit kar sakta hoon."
          : "I am AddMine Agent v2 — Wahab Ahmad's on-device executive. Five personas, English/Urdu/Roman-Urdu, typo-aware, confirm-before-commit, and I can preview templates before applying them."),
      lang,
    };
  }

  // ----- Experience -----
  if (/experience|work history|where.*work|company|job|roles|kaam kahan|kahan kaam|company konsi|kis company/.test(low)) {
    const exps = ctx.profile.experience.length ? ctx.profile.experience : [];
    const lines = exps.map((e, i) => `${i + 1}. ${e.role} — ${e.company} (${e.duration})${e.location ? `\n   📍 ${e.location}` : ""}${e.description ? `\n   ${e.description.slice(0, 220)}` : ""}`).join("\n\n");
    return {
      reply: t + (lang === "ur"
        ? `کام کا ریکارڈ (${KB.totalYears}):\n\n${lines}`
        : lang === "roman-ur"
          ? `Experience (${KB.totalYears}):\n\n${lines}\n\nAgar koi naya experience add karna ho to bolo: "add experience: Designer at Nike, 2024, Lahore".`
          : `Experience (${KB.totalYears}):\n\n${lines}\n\nTo add another role say: "add experience: Senior Designer, Nike, 2024–present, Lahore".`),
      lang,
    };
  }
  if (/contact|email|whatsapp|phone|number|reach|rabta|number|contact ka|number do/.test(low)) {
    return {
      reply: t + (lang === "en"
        ? `Channels:\n• WhatsApp: ${ctx.profile.whatsapp}\n• Mobile: ${ctx.profile.phone}\n• Email: ${ctx.profile.email}\n• Location: ${ctx.profile.location}`
        : lang === "roman-ur"
          ? `Rabta:\n• WhatsApp: ${ctx.profile.whatsapp}\n• Mobile: ${ctx.profile.phone}\n• Email: ${ctx.profile.email}\n• Location: ${ctx.profile.location}`
        : `رابطہ:\n• واٹس ایپ: ${ctx.profile.whatsapp}\n• فون: ${ctx.profile.phone}\n• ای میل: ${ctx.profile.email}\n• مقام: ${ctx.profile.location}`),
      lang,
    };
  }
  if (/education|study|qualification|certificate|matric|fa|talim|parhai/.test(low)) {
    const edus = ctx.profile.education.map((e, i) => `${i + 1}. ${e.degree} — ${e.institution} (${e.year})${e.grade ? ` · ${e.grade}` : ""}`).join("\n");
    return { reply: t + (lang === "en" ? `Education:\n${edus}\n\nAdd more by saying: "add education: BS CS, FAST, 2023–2027".` : lang === "roman-ur" ? `Education:\n${edus}\n\nNeecha add karne ke liye bolo: "add education: BS CS, FAST, 2023-2027".` : `تعلیم:\n${edus}`), lang };
  }
  if (/stack|tool|tech|software|skill|tools kon se|kya aata/.test(low)) {
    return { reply: t + `Design: ${KB.stack.design.join(", ")}\nDev: ${KB.stack.dev.join(", ")}\n\n${lang === "roman-ur" ? "Aur skill chahiye to batao." : "Tell me to add a skill to the toolchain."}`, lang };
  }

  // ----- Add Education -----
  const addEd = low.match(/add education[:\s]+(.{8,200})/i);
  if (addEd) {
    // parse: "Degree, Institution, Year, Grade"
    const parts = addEd[1].split(/[,|·]/).map((s) => s.trim()).filter(Boolean);
    const [degree = "Degree", institution = "Institution", year = "", grade = "", location = ""] = parts;
    return {
      reply: t + (lang === "en" ? `Adding education entry: ${degree} — ${institution} (${year}).` : lang === "roman-ur" ? `Education add kar raha hoon: ${degree} — ${institution} (${year}).` : `تعلیمی اندراج شامل کر رہا ہوں: ${degree}۔`),
      lang,
      statePatches: { addEducation: { degree, institution, year, grade, location } },
    };
  }

  // ----- Add Experience -----
  const addEx = low.match(/add experience[:\s]+(.{10,260})/i);
  if (addEx) {
    const parts = addEx[1].split(/[,|·]/).map((s) => s.trim()).filter(Boolean);
    const [role = "Designer", company = "Company", duration = "", location = "", description = ""] = parts;
    return {
      reply: t + (lang === "en" ? `Adding role: ${role} @ ${company} (${duration}).` : lang === "roman-ur" ? `Role add kar raha hoon: ${role} @ ${company} (${duration}).` : `عہدہ شامل ہو رہا ہے: ${role}۔`),
      lang,
      statePatches: { addExperience: { role, company, duration, location, description, current: /present|current|jari|ongoing/.test(duration.toLowerCase()) } },
    };
  }

  // ----- Profile edits -----
  const nameMatch = low.match(/(?:my name is|call me|set name(?: to)?|update name(?: to)?|naam|mera naam)\s+(.+)/i);
  if (nameMatch) {
    const val = nameMatch[1].trim().replace(/[.!?]+$/, "");
    const parts = val.split(/\s+/);
    const firstName = parts[0] || ctx.profile.firstName;
    const lastName = parts.slice(1).join(" ") || ctx.profile.lastName;
    return { reply: t + (lang === "en" ? `Identity updated → ${firstName} ${lastName}.` : lang === "roman-ur" ? `Naam update ho gaya → ${firstName} ${lastName}.` : `نام اپ ڈیٹ ہو گیا → ${firstName} ${lastName}۔`), lang, statePatches: { profile: { firstName, lastName } } };
  }
  const taglineMatch = low.match(/(?:tagline|headline|slogan|slogan ko|catchline)(?: is| to| ko)?[:\s]+["']?([^"']{6,160})["']?/i);
  if (taglineMatch) return { reply: t + `✓ Tagline: "${taglineMatch[1].trim()}"`, lang, statePatches: { profile: { tagline: taglineMatch[1].trim() } } };
  const roleMatch = low.match(/(?:role|title|ohda|designation)(?: is| to| ko)?[:\s]+["']?([^"']{4,100})["']?/i);
  if (roleMatch) return { reply: t + `✓ Role → ${roleMatch[1].trim()}`, lang, statePatches: { profile: { role: roleMatch[1].trim() } } };
  const emailMatch = low.match(/(?:email|mail|e-mail)(?: is| to| ko)?[:\s]+([a-z0-9_.+-]+@[a-z0-9-]+\.[a-z0-9-.]+)/i);
  if (emailMatch) return { reply: t + `✓ Email → ${emailMatch[1]}`, lang, statePatches: { profile: { email: emailMatch[1] } } };
  const phoneMatch = low.match(/(?:phone|mobile|call|number|whatsapp)(?: is| to| ka| ko)?[:\s]+([+\d\s-]{7,})/i);
  if (phoneMatch && phoneMatch[1].replace(/\D/g, "").length >= 7) {
    const which = /whatsapp/.test(low) ? "whatsapp" : /phone|mobile|call|number/.test(low) ? "phone" : "phone";
    return { reply: t + `✓ ${which} → ${phoneMatch[1].trim()}`, lang, statePatches: { profile: { [which]: phoneMatch[1].trim() } as Partial<ProfileDetails> } };
  }
  const locationMatch = low.match(/(?:location|city|based in|shehr|city is|location is)(?: is| to| ko)?[:\s]+(.+?)(?:\.|$)/i);
  if (locationMatch) return { reply: t + `✓ Location → ${locationMatch[1].trim()}`, lang, statePatches: { profile: { location: locationMatch[1].trim() } } };
  const bioMatch = low.match(/(?:bio|summary|about me)(?: is| to)?[:\s]+(.{30,700})$/i);
  if (bioMatch) return { reply: t + "✓ Bio updated.", lang, statePatches: { profile: { bio: bioMatch[1].trim() } } };

  // ----- Color / accent -----
  const colorPhrase = low.match(/(?:accent|color|theme|highlight|brand color|button colour|button color|rang|color ko|button)(?: to| is| ko| ka)?\s+([a-z]+|#[0-9a-f]{3,6})/i);
  if (colorPhrase) {
    const raw = colorPhrase[1].toLowerCase();
    const hex = hexRegex.test(raw) ? raw : colorMap[raw];
    if (hex) {
      // Also change button colors immediately? Buttons inherit --accent so this already propagates
      return { reply: t + (lang === "en" ? `Accent/button color set to ${raw} (${hex}). Buttons, links, glows, and borders all shift live.` : lang === "roman-ur" ? `Accent color ${raw} (${hex}) set. Buttons, borders, sab kuch live badal jayega.` : `رنگ ${raw} مقرر ہو گیا۔`), lang, statePatches: { theme: { accent: hex } } };
    }
    return { reply: t + (lang === "en" ? `Unknown color. Try: ${Object.keys(colorMap).slice(0, 14).join(", ")} or #hex.` : lang === "roman-ur" ? `Yeh color nahi janta. Gold, crimson, teal, emerald, cyan, ferozi, sabz, laal, surkh, jamni, narangi aazmao.` : "یہ رنگ نہیں جانتا۔"), lang };
  }

  // ----- Template preview / apply -----
  const templateMatch = low.match(/(?:template|theme|look|style|design|skin)\s*(show|list|dikhao|batao|preview)?\s*(switch|change|apply|lagao|badlo)?/i);
  if (templateMatch && !/(redesign|improve|polish|redesign the hero)/.test(low) ) {
    const previews: TemplatePreview[] = Object.values(TEMPLATES).map((t) => ({ id: t.id, name: t.name, desc: t.desc, swatches: t.swatches }));
    return {
      reply: t + (lang === "en"
        ? "Here are the portfolio templates. Tap a preview to apply — I'll save a snapshot first so you can undo instantly:"
        : lang === "roman-ur"
          ? "Yeh templates available hain. Kisi pe tap karo (snapshot pehle save ho jayega, undo ho jayega):"
          : "یہ ٹیمپلیٹس دستیاب ہیں۔ لاگو کرنے سے پہلے خودکار سنیپ شاٹ لے لیا جائے گا۔"),
      lang,
      templates: previews,
      actions: previews.map((p) => ({ id: `tpl-${p.id}`, label: p.name, kind: "apply-template" as const, payload: { templateId: p.id } })),
    };
  }
  if (/undo|wapas|pichla|previous|revert|rollback|undo karo/.test(low)) {
    if (ctx.snapshots.length === 0) return { reply: t + (lang === "en" ? "No snapshots to undo yet — I auto-save before any template switch or deletion." : lang === "roman-ur" ? "Abhi koi snapshot nahi hai. Template apply karo ya delete karo to auto-save ho jata hai." : "ابھی کوئی سنیپ شاٹ موجود نہیں۔"), lang };
    const s = ctx.snapshots[0];
    return {
      reply: t + (lang === "en" ? `Reverting to snapshot: "${s.label}" (${new Date(s.createdAt).toLocaleString()}).` : lang === "roman-ur" ? `Snapshot restore kar raha hoon: "${s.label}".` : `سنیپ شاٹ بحال ہو رہا ہے۔`),
      lang,
      actions: [{ id: "snap-load", label: "Undo now", kind: "snapshot", payload: { snapshotId: s.id } }],
    };
  }

  // ----- Add project -----
  const addProj = low.match(/add (?:a |new )?(project|work|asset|kaam)(?: called| named| by name| ka naam|:)?\s*["']?([^"']{3,80})["']?/i);
  if (addProj) {
    let cat: ProjectCategory = "web-app";
    if (/shirt|tee|print|screen/.test(input)) cat = "screen-printing";
    else if (/textile|suit|fabric|ladies|embroid|kapra|kapaD/.test(input)) cat = "textile";
    else if (/social|post|brand|instagram|reel|story/.test(input)) cat = "social-media";
    const title = addProj[2].trim();
    return {
      reply: t + (lang === "en" ? `New ${cat.replace("-", " ")} project "${title}" queued. AI will stub copy — edit in Projects tab.` : lang === "roman-ur" ? `Naya project "${title}" add ho raha hai (${cat}).` : `نیا پروجیکٹ «${title}» شامل ہو رہا ہے۔`),
      lang,
      statePatches: { addProject: { title, description: `${title} — added via AddMine agent.`, category: cat, tags: ["AI-Added", "Draft"], coverEmoji: cat === "screen-printing" ? "🎨" : cat === "textile" ? "🧵" : cat === "social-media" ? "📱" : "💻", coverColor: "#1c2750" } },
    };
  }

  // ----- Delete project (with confirmation) -----
  const delProj = low.match(/(?:delete|remove|hatao|hatado|delete karo) (?:project |kaam )?(?:called |named )?["']?([^"']{2,80})["']?/i);
  if (delProj) {
    const name = delProj[1].toLowerCase();
    const hit = ctx.projects.find((p) => p.title.toLowerCase().includes(name));
    if (hit) {
      return {
        reply: t + (lang === "en" ? `Delete project "${hit.title}"? I'll snapshot first so you can undo.` : lang === "roman-ur" ? `Bhai, project "${hit.title}" delete kar doon? Pehle snapshot le loonga (undo ho jayega).` : `کیا پروجیکٹ «${hit.title}» حذف کر دوں؟`),
        lang,
        pendingConfirm: { kind: "delete-project", summary: hit.title, onConfirmPayload: { projectId: hit.id } },
        actions: [
          { id: "del-yes", label: lang === "en" ? "Yes, delete" : "Haan delete karo", kind: "delete-project", payload: { projectId: hit.id } },
          { id: "del-no", label: lang === "en" ? "Cancel" : "Rehne do", kind: "patch", payload: {} },
        ],
      };
    }
    return { reply: t + (lang === "en" ? `No project matched "${delProj[1]}".` : lang === "roman-ur" ? `"${delProj[1]}" naam ka project nahi mila.` : "کوئی پروجیکٹ نہیں ملا۔"), lang };
  }

  // ----- Schedule -----
  if (/schedule|remind|by |at |later|tomorrow|tonight|kal|aaj raat/.test(low) && /(redesign|improve|design|update|refresh|optimize|polish|badalna|design kar)/.test(low)) {
    const { at, label } = parseTimePhrase(input);
    const due = at ?? new Date(Date.now() + 60 * 60 * 1000);
    const title = /redesign|refresh/.test(low) ? "Design refresh" : /optimiz|perf/.test(low) ? "Performance pass" : /update/.test(low) ? "Content update" : "Design iteration";
    return { reply: t + (lang === "en" ? `Scheduled: ${title} ${label ?? "in 1 hour"} (${due.toLocaleString()}).` : lang === "roman-ur" ? `Schedule kar diya: ${title} ${label ?? "1 ghante mein"}.` : `شیڈول ہو گیا۔`), lang, schedule: { title, notes: input, at: due } };
  }

  // ----- Design improvement / proposals -----
  if (/(redesign|improve|better|upgrade|polish|enhance|behtar|behtar banao|sundar).*(design|site|portfolio|hero|layout|look|aesthetic|button|color)/i.test(low) || /make it (better|prettier|sharper|more premium|elite|cleaner|faster|khoobsurat|behtar)/i.test(low)) {
    return {
      reply: t + (lang === "en"
        ? "Three upgrade directions ready — tap a card to preview, then Apply. I'll snapshot first."
        : lang === "roman-ur"
          ? "Teen upgrade options tayyar hain. Kisi pe tap kar ke preview dekho, phir Apply."
          : "تین اپ گریڈ آپشنز تیار ہیں۔"),
      lang,
      templates: Object.values(TEMPLATES).map((t) => ({ id: t.id, name: t.name, desc: t.desc, swatches: t.swatches })),
    };
  }

  // ----- Apply by name or option number -----
  const optMatch = low.match(/(?:apply|lagao|choose|use|switch to)\s*(?:template\s*)?(?:option\s*)?([a-z0-9-]+|"[^"]+"|'[^']+')/i);
  if (optMatch) {
    const raw = optMatch[1].replace(/['"]/g, "").toLowerCase().trim();
    const allIds = Object.keys(TEMPLATES) as ThemeTemplateId[];
    let tid: ThemeTemplateId | null = null;
    for (const k of allIds) {
      if (k === raw || TEMPLATES[k].name.toLowerCase() === raw || TEMPLATES[k].name.toLowerCase().includes(raw)) { tid = k; break; }
    }
    if (!tid && /^\d+$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (n >= 1 && n <= allIds.length) tid = allIds[n - 1];
    }
    if (tid) {
      return { reply: t + (lang === "en" ? `Applying ${TEMPLATES[tid].name}.` : lang === "roman-ur" ? `${TEMPLATES[tid].name} apply kar raha hoon.` : `${TEMPLATES[tid].name} نافذ ہو رہا ہے۔`), lang, statePatches: { applyTemplate: tid, saveSnapshot: `Before switching to ${TEMPLATES[tid].name}` } };
    }
  }

  // ----- Nav / close -----
  if (/(go|navigate|le chalo|take me|open|show|kholo|dikhao)\s*(home|work|workspace|tools|toolchain|chrono|experience|contact|admin)/i.test(low)) {
    const sec = low.match(/(home|work|workspace|tools|toolchain|chrono|experience|contact)/i)?.[1].toLowerCase();
    const map: Record<string, string> = { home: "home", work: "work", workspace: "work", tools: "tools", toolchain: "tools", chrono: "chrono", experience: "chrono", contact: "contact" };
    return { reply: t + `→ ${sec}`, lang, actions: [{ id: "nav", label: `Go to ${sec}`, kind: "navigate", payload: { section: map[sec!] } }] };
  }
  if (/close.*(console|admin|panel)|exit|minimize|band karo|close karo|band/.test(low)) {
    return { reply: t + TR[lang].closing, lang, actions: [{ id: "close", label: "Close", kind: "navigate", payload: { close: true } }] };
  }

  if (/help|madad|commands|capabilities|kya kar sakte/.test(low)) {
    return {
      reply: t + (lang === "en"
        ? "I can:\n• Answer about experience/education/contact/stack\n• Edit identity (name, role, tagline, bio, location) + add education/experience entries\n• Change accent/button color instantly\n• Show & apply portfolio templates with live previews (auto-snapshot for undo)\n• Add/delete projects (deletes get confirmed first)\n• Schedule redesigns/optimizations\n• Switch languages: English / Roman Urdu / Urdu\n• Navigate sections / close console\n\nType 'templates' to browse skins, 'add education' or 'add experience' to extend your resume, 'make accent crimson' to test a color."
        : lang === "roman-ur"
          ? "Main kar sakta hoon:\n• Experience/education/contact bata sakta hoon\n• Name, role, tagline, bio, location edit + education/experience add\n• Button/accent color fori badal sakta hoon\n• Templates dikha ke live preview ke saath apply (snapshot + undo)\n• Project add/delete (delete se pehle confirm)\n• Redesign schedule\n• English / Roman Urdu / Urdu\n• Section jump / console band\n\nTry: 'templates', 'make accent teal', 'add education: BS CS, FAST, 2023-2027', 'add experience: Designer, Nike, 2024-present, Lahore'."
        : "میں یہ سب کر سکتا ہوں: تعلیم و تجربہ، رنگ، ٹیمپلیٹس، پروجیکٹ، نظام الاوقات، اور زبان تبدیل کرنا۔"),
      lang,
    };
  }

  return { reply: t + TR[lang].unknown, lang };
}
