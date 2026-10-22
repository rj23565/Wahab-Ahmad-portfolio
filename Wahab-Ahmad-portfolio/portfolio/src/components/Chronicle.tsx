"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Clock3,
  Milestone,
  Factory,
  Star,
  BookOpen,
  Building2,
} from "lucide-react";
import { usePortfolio } from "@/lib/store";
import { cn } from "@/lib/cn";

export default function Chronicle() {
  const { profile } = usePortfolio();

  const experiences = profile.experience && profile.experience.length
    ? profile.experience
    : [{
        id: "legacy",
        role: profile.role || "Designer · Assistant Developer",
        company: profile.companyName || "Galaxy 42A (Inox)",
        duration: profile.experienceYears || "2023 — Present · 2+ years completed",
        location: profile.companyAddress || "Chak Jhumra, Punjab, Pakistan",
        description: "Cross-disciplinary floor-to-code role.",
        current: true,
      }];

  const educations = profile.education && profile.education.length
    ? profile.education
    : [
        { id: "e1", degree: "Matriculation (Science)", institution: "BISE", year: "", grade: "", location: "", notes: "Sciences & mathematics foundation." },
        { id: "e2", degree: "Faculty of Arts (F.A.)", institution: "", year: "", grade: "", location: "", notes: "Humanities, composition, critical study." },
        { id: "e3", degree: "Graphic Design Certificate", institution: "", year: "", grade: "69% Merit", location: "", notes: "Typography · Composition · Print · Digital media." },
      ];

  const numericMark = (m?: string) => {
    if (!m) return 0;
    const n = parseInt((m.match(/(\d+)/)?.[1] ?? "0"), 10);
    if (m.includes("/")) {
      const parts = m.split("/").map((x) => parseInt(x.replace(/[^\d]/g, ""), 10));
      return parts[1] > 0 ? Math.round((parts[0] / parts[1]) * 100) : 0;
    }
    return n > 100 ? Math.min(100, n) : n;
  };
  // Pick hero cert: prefer certificate/merit tier entries over school marks
  const cert = educations.find((e) => /merit|cert|distinction|pro/i.test((e.grade || "") + " " + (e.degree || "")))
            || educations.find((e) => /graphic|web|engineering/i.test(e.degree || ""))
            || [...educations].sort((a, b) => numericMark(b.marks) - numericMark(a.marks))[0]
            || educations[0];
  const certNum = numericMark(cert?.marks) || parseInt((cert?.grade?.match(/(\d+)/)?.[1] ?? "69"), 10) || 69;
  const certGrade = String(certNum);
  const primaryCert = cert;

  return (
    <section id="chrono" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mb-14">
          <div className="section-label">// 04 — Chronicle</div>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl text-steel-100">
            Experience & <span className="gold-gradient-text italic">Background</span>
          </h2>
          <p className="mt-4 text-steel-400">
            {profile.firstName} {profile.lastName}&apos;s trajectory pairs
            production-floor discipline with a formal design foundation —
            bridging industrial craft and modern software.
          </p>
        </div>

        {/* Active role + Cert: same framed-card treatment as hero cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card rounded-sm p-8 relative lg:col-span-2"
          >
            <span className="bracket bracket-tl" />
            <span className="bracket bracket-br" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 grid place-items-center bg-accent/10 border border-accent/40 text-accent rounded-sm ring-pulse">
                <Briefcase size={20} />
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-accent flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Active Role
                </div>
                <div className="mt-1 font-serif text-2xl text-steel-100">
                  {experiences[0]?.role}
                </div>
                <div className="mt-1 text-accent font-serif text-xl">
                  {experiences[0]?.company}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-steel-400">
                  {experiences[0]?.duration && (
                    <span className="flex items-center gap-1.5">
                      <Clock3 size={12} className="text-accent" />
                      {experiences[0].duration}
                    </span>
                  )}
                  {experiences[0]?.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-accent-red" />
                      {experiences[0].location}
                    </span>
                  )}
                </div>
                <p className="mt-5 text-sm text-steel-400 leading-relaxed">
                  {experiences[0]?.description ||
                    "Specializing in manufacturing design logic, automated asset workflows, and technical production."}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="card rounded-sm p-8 relative"
          >
            <span className="bracket bracket-tr" />
            <span className="bracket bracket-bl" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 grid place-items-center bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded-sm">
                <Award size={18} />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
                  Highest Certification
                </div>
                <div className="font-serif text-xl text-steel-100">
                  {primaryCert?.degree?.slice(0, 26) || "Graphic Design Cert."}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="font-display text-6xl gold-gradient-text leading-none">
                {certGrade}%
              </div>
              <div className="pb-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500">Evaluated Grade</div>
                <div className="text-sm text-steel-300">Merit Tier</div>
              </div>
            </div>
            <div className="mt-6 h-2 bg-white/5 rounded-sm overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-700 via-[var(--accent)] to-amber-200" style={{ width: `${certGrade}%` }} />
            </div>
            <p className="mt-5 text-sm text-steel-400 leading-relaxed">
              {primaryCert?.notes || "Certified specialist — typography, composition, print, and digital media."}
            </p>
          </motion.div>
        </div>

        {/* Work History + Education — toolchain-style dual cards */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          {/* Work History card */}
          <div className="card rounded-sm p-8 relative">
            <span className="bracket bracket-tl" />
            <span className="bracket bracket-br" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 grid place-items-center bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan rounded-sm">
                <Factory size={18} />
              </div>
              <div>
                <div className="font-serif text-2xl text-steel-100">Work History</div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">Career Timeline · {experiences.length}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {experiences.map((e, i) => (
                <div key={e.id || i} className="relative pl-6 border-l border-white/10">
                  <span className="absolute -left-[7px] top-3 w-3.5 h-3.5 rounded-full bg-midnight-950 border-2 border-accent/60 grid place-items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </span>
                  <div className="p-4 border border-white/5 bg-white/[0.02] rounded-sm hover:border-accent-cyan/30 transition">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Building2 size={13} className="text-accent-cyan mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-base text-steel-100 leading-tight">{e.company}</div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-steel-500 mt-0.5">{e.role}</div>
                      </div>
                      {e.current && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded-sm">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-steel-500">
                      {e.duration && <span className="flex items-center gap-1"><Clock3 size={10} /> {e.duration}</span>}
                      {e.location && <span className="flex items-center gap-1"><MapPin size={10} className="text-accent-red" /> {e.location}</span>}
                    </div>
                    {e.description && <p className="mt-2.5 text-xs text-steel-400 leading-relaxed">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education card — toolchip-style grid */}
          <div className="card rounded-sm p-8 relative">
            <span className="bracket bracket-tr" />
            <span className="bracket bracket-bl" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 grid place-items-center bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 rounded-sm">
                <GraduationCap size={18} />
              </div>
              <div>
                <div className="font-serif text-2xl text-steel-100">Academic Foundation</div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-steel-500">Education · {educations.length}</div>
              </div>
            </div>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {educations.map((ed, i) => {
                const isTop = ed.grade && /merit|a\+|distinction|pro/i.test(ed.grade);
                return (
                  <li
                    key={ed.id || i}
                    className="flex items-start gap-3 p-3 border border-white/5 bg-white/[0.02] rounded-sm hover:border-fuchsia-400/30 transition"
                  >
                    <span className={cn(
                      "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                      isTop ? "bg-accent" : "bg-fuchsia-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="text-sm text-steel-100 font-medium leading-snug">
                          {ed.degree}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {ed.marks && ed.marks !== "—" && (
                            <span className="text-[10px] font-mono text-accent border border-accent/30 bg-accent/10 px-1.5 py-0.5 rounded-sm font-semibold">
                              {ed.marks}
                            </span>
                          )}
                          {ed.grade && (
                            <span className="text-[10px] font-mono text-steel-400 border border-white/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                              {ed.grade}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-steel-500 font-mono mt-0.5 leading-snug">
                        {ed.institution && ed.institution !== "—" ? ed.institution : "Self-directed"}
                        {ed.year ? ` · ${ed.year}` : ""}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Small aggregate stats strip like toolchain principles */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: Star, label: `${educations.length}`, sub: "Credentials" },
                { icon: Award, label: `${certGrade}%`, sub: "Top Grade" },
                { icon: BookOpen, label: "Merit", sub: "Tier" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="border border-white/5 bg-white/[0.02] rounded-sm p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 shrink-0 grid place-items-center border border-fuchsia-400/20 text-fuchsia-400 rounded-sm">
                      <Icon size={12} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-steel-100 font-serif leading-none">{s.label}</div>
                      <div className="text-[9px] font-mono uppercase tracking-widest text-steel-500 mt-0.5">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
