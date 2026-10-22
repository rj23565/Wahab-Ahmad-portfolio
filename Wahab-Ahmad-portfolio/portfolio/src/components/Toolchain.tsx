"use client";

import {
  Code2,
  Cpu,
  Figma,
  Layers,
  Paintbrush,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

const DESIGN = [
  { name: "Adobe Photoshop", note: "Separations · Retouching" },
  { name: "Adobe Illustrator", note: "Vector · Patterning" },
  { name: "Adobe InDesign", note: "Print · Layout" },
  { name: "Adobe XD", note: "Rapid Prototyping" },
  { name: "Figma", note: "UI/UX Systems" },
  { name: "Corel / Sketch", note: "Supporting vector" },
];

const DEV = [
  { name: "Next.js · App Router", note: "Production React" },
  { name: "TypeScript", note: "Strict codebases" },
  { name: "Tailwind CSS", note: "Design tokens" },
  { name: "Node.js · APIs", note: "Backend endpoints" },
  { name: "Realtime & DB", note: "Postgres · Realtime" },
  { name: "AI-Augmented CI", note: "Automated pipelines" },
];

const PRINCIPLES = [
  { icon: Zap, label: "100ms TTI Target", sub: "Aggressive budgets" },
  { icon: Layers, label: "Scratch-Built", sub: "No templates" },
  { icon: Sparkles, label: "Pixel-Perfect", sub: "Production accuracy" },
  { icon: Wand2, label: "AI Assisted", sub: "Human in the loop" },
];

export default function Toolchain() {
  return (
    <section id="tools" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="section-label">// 03 — Stack</div>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl text-steel-100">
            Toolchain & <span className="gold-gradient-text italic">Core Competencies</span>
          </h2>
          <p className="mt-4 text-steel-400">
            A refined, high-output toolkit for going from blank canvas to
            shipped product — whether that product is a screen-printed garment,
            a textile collection, or a deployed application.
          </p>
        </div>

        <div className="mt-14 grid lg:grid-cols-2 gap-6">
          {/* Design suite */}
          <div className="card rounded-sm p-8 relative">
            <span className="bracket bracket-tl" />
            <span className="bracket bracket-br" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm grid place-items-center bg-accent/10 border border-accent/30 text-accent">
                <Paintbrush size={18} />
              </div>
              <div>
                <div className="font-serif text-2xl text-steel-100">
                  Design Suite
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">
                  The Atelier
                </div>
              </div>
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-3">
              {DESIGN.map((d) => (
                <li
                  key={d.name}
                  className="flex items-start gap-3 p-3 border border-white/5 bg-white/[0.02] rounded-sm hover:border-accent/30 transition"
                >
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent" />
                  <div>
                    <div className="text-sm text-steel-100 font-medium">
                      {d.name}
                    </div>
                    <div className="text-[11px] text-steel-500 font-mono">
                      {d.note}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Dev */}
          <div className="card rounded-sm p-8 relative">
            <span className="bracket bracket-tr" />
            <span className="bracket bracket-bl" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm grid place-items-center bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                <Code2 size={18} />
              </div>
              <div>
                <div className="font-serif text-2xl text-steel-100">
                  Development Matrix
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">
                  The Foundry
                </div>
              </div>
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-3">
              {DEV.map((d) => (
                <li
                  key={d.name}
                  className="flex items-start gap-3 p-3 border border-white/5 bg-white/[0.02] rounded-sm hover:border-accent-cyan/30 transition"
                >
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                  <div>
                    <div className="text-sm text-steel-100 font-medium">
                      {d.name}
                    </div>
                    <div className="text-[11px] text-steel-500 font-mono">
                      {d.note}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Principles */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRINCIPLES.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                className="card rounded-sm p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 shrink-0 grid place-items-center border border-white/10 bg-white/[0.03] text-accent rounded-sm">
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-sm text-steel-100 font-semibold">
                    {p.label}
                  </div>
                  <div className="text-[11px] font-mono text-steel-500 uppercase tracking-widest mt-1">
                    {p.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center gap-3 text-xs font-mono text-steel-500">
          <Cpu size={14} className="text-accent" />
          Deployments wired with live staging previews · Instant client review
          loops.
        </div>
      </div>
    </section>
  );
}
