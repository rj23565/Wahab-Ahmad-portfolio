"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User as UserIcon,
  Loader2,
  Zap,
  Wand2,
  Languages,
  Check,
  X as XIcon,
  Palette,
} from "lucide-react";
import Image from "next/image";
import {
  PERSONAS,
  type ChatMsg,
  type LLMPersona,
  runAgent,
  type ScheduledTask,
  type Lang,
  type ConfirmationPrompt,
} from "@/lib/agent";
import { useAdminUI, useAuth, usePortfolio, TEMPLATES } from "@/lib/store";
import type { ThemeTemplateId } from "@/types";
import { cn } from "@/lib/cn";

export default function AgentChat() {
  const {
    profile,
    projects,
    theme,
    setProfile,
    setTheme,
    addProject,
    deleteProject,
    addEducation,
    addExperience,
    applyTemplate,
    saveSnapshot,
    loadSnapshot,
    snapshots,
  } = usePortfolio();
  const { closeAll } = useAdminUI();
  const { usedKey } = useAuth();
  const [persona, setPersona] = useState<LLMPersona>("creative");
  const [lang, setLang] = useState<Lang>("en");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pending, setPending] = useState<ConfirmationPrompt | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      id: "seed",
      role: "assistant",
      text: "Salaam. I'm Wahab's on-device executive v2 — now multilingual (English / اردو / Roman Urdu), typo-aware, and I always confirm before changing anything important. Ask me anything, request design changes, switch templates, add projects/education/workplaces, or schedule redesigns. Try: 'show templates', 'make accent crimson', 'add education: BS CS, FAST, 2023–2027', or 'urdu mein baat karo'.",
      at: Date.now(),
      persona: "creative",
      lang: "en",
    },
  ]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  useEffect(() => {
    const t = setInterval(() => {
      setTasks((prev) => {
        const now = Date.now();
        const due = prev.filter((x) => x.status === "queued" && x.dueAt <= now);
        if (due.length === 0) return prev;
        due.forEach((d) => {
          setMsgs((m) => [
            ...m,
            {
              id: `due_${d.id}`,
              role: "system",
              text: `⏰ Scheduled task due: "${d.title}".\n${d.notes}\n\nSay "apply template midnight-steel" or "begin refresh" when you're ready.`,
              at: Date.now(),
            },
          ]);
        });
        return prev.map((x) => (due.some((d) => d.id === x.id) ? { ...x, status: "done" as const } : x));
      });
    }, 1000 * 15);
    return () => clearInterval(t);
  }, []);

  const commitResult = (result: ReturnType<typeof runAgent>) => {
    if (result.statePatches?.profile) setProfile(result.statePatches.profile);
    if (result.statePatches?.theme) {
      const patch = result.statePatches.theme;
      setTheme({ accent: patch.accent ?? theme.accent, bg: patch.bg ?? theme.bg });
    }
    if (result.statePatches?.addProject) addProject(result.statePatches.addProject);
    if (result.statePatches?.addEducation) addEducation(result.statePatches.addEducation);
    if (result.statePatches?.addExperience) addExperience(result.statePatches.addExperience);
    if (result.statePatches?.setLang) setLang(result.statePatches.setLang);
    if (result.statePatches?.saveSnapshot) saveSnapshot(result.statePatches.saveSnapshot);
    if (result.statePatches?.applyTemplate) {
      saveSnapshot(`Auto-save before ${result.statePatches.applyTemplate}`);
      applyTemplate(result.statePatches.applyTemplate);
    }
    if (result.schedule) {
      setTasks((prev) => [
        ...prev,
        {
          id: `t_${Date.now()}`,
          title: result.schedule!.title,
          notes: result.schedule!.notes,
          dueAt: result.schedule!.at.getTime(),
          createdAt: Date.now(),
          status: "queued",
        },
      ]);
    }
  };

  const send = (text?: string, opts?: { isConfirm?: boolean }) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: "user", text: content, at: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setThinking(true);

    setTimeout(() => {
      const result = runAgent(
        content,
        {
          profile,
          projects,
          theme: { accent: theme.accent, bg: theme.bg },
          setTheme,
          setProfile,
          addProject,
          deleteProject: (id) => deleteProject(id),
          addEducation,
          addExperience,
          applyTemplate: (id) => { saveSnapshot(`Before applying ${id}`); applyTemplate(id); },
          saveSnapshot,
          loadSnapshot,
          snapshots,
          closeAdmin: closeAll,
        },
        persona,
        opts?.isConfirm ? { expectingConfirmation: true, lastPrompt: pending ?? undefined } : undefined
      );

      commitResult(result);

      const assistantMsg: ChatMsg = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: result.reply,
        at: Date.now(),
        persona,
        actions: result.actions,
        templates: result.templates,
        lang: result.lang,
        pendingConfirm: result.pendingConfirm,
      };
      setMsgs((m) => [...m, assistantMsg]);
      if (result.pendingConfirm) setPending(result.pendingConfirm); else setPending(null);
      setThinking(false);
      if (/Closing console|Console band|کنسول بند/.test(result.reply)) {
        setTimeout(() => closeAll(), 900);
      }
    }, 380);
  };

  const runAction = (a: NonNullable<ChatMsg["actions"]>[number]) => {
    if (a.kind === "theme" && a.payload) {
      const p = a.payload as { accent: string; bg?: string };
      setTheme({ accent: p.accent, bg: p.bg ?? theme.bg });
      setMsgs((m) => [...m, { id: `act_${Date.now()}`, role: "system", text: `✓ Applied: ${a.label}`, at: Date.now() }]);
    } else if (a.kind === "apply-template" && a.payload) {
      const { templateId } = a.payload as { templateId: ThemeTemplateId };
      saveSnapshot(`Before switching to ${TEMPLATES[templateId]?.name || templateId}`);
      applyTemplate(templateId);
      setMsgs((m) => [
        ...m,
        { id: `tpl_${Date.now()}`, role: "system", text: `✓ Template "${TEMPLATES[templateId]?.name}" applied. Snapshot saved — say "undo" to revert.`, at: Date.now() },
      ]);
    } else if (a.kind === "snapshot" && a.payload) {
      const { snapshotId } = a.payload as { snapshotId: string };
      loadSnapshot(snapshotId);
      setMsgs((m) => [...m, { id: `snap_${Date.now()}`, role: "system", text: `✓ Snapshot restored.`, at: Date.now() }]);
    } else if (a.kind === "delete-project" && a.payload) {
      // same flow as confirmation — trigger send with "yes" and prompt
      send("yes delete it", { isConfirm: true });
    } else if (a.kind === "patch" && a.payload) {
      const p = a.payload as Record<string, unknown>;
      if (p.useCorrected === false) {
        setPending(null);
        setMsgs((m) => [...m, { id: `act_${Date.now()}`, role: "system", text: "As-is rakha (kept original).", at: Date.now() }]);
      } else if (p.useCorrected === true && pending?.kind === "typo-correction" && pending.suggested) {
        setPending(null);
        send(pending.suggested);
      } else {
        setPending(null);
        setMsgs((m) => [...m, { id: `act_${Date.now()}`, role: "system", text: `Cancelled.`, at: Date.now() }]);
      }
    } else if (a.kind === "navigate") {
      const payload = a.payload as { section?: string; close?: boolean };
      if (payload.section) {
        closeAll();
        setTimeout(() => document.getElementById(payload.section!)?.scrollIntoView({ behavior: "smooth" }), 200);
      }
      if (payload.close) closeAll();
    } else if (a.kind === "set-lang" && a.payload) {
      setLang(a.payload as Lang);
    } else {
      setMsgs((m) => [...m, { id: `act_${Date.now()}`, role: "system", text: `ⓘ ${a.label}`, at: Date.now() }]);
    }
  };

  const applyTemplateInline = (id: ThemeTemplateId) => {
    saveSnapshot(`Before ${TEMPLATES[id].name}`);
    applyTemplate(id);
    setMsgs((m) => [...m, { id: `tpl_${Date.now()}`, role: "system", text: `✓ ${TEMPLATES[id].name} applied. Say "undo" to revert.`, at: Date.now() }]);
  };

  const quickPromptsEN = [
    "Where have I worked?",
    "Show templates",
    "Make accent crimson",
    "Add education: BS CS, FAST NUCES, 2023-2027",
    "Add experience: Senior Designer, Nike, 2024-present, Lahore",
    "Redesign the hero in 2 hours",
  ];

  return (
    <div className="space-y-4">
      <div className="card rounded-sm relative overflow-hidden">
        <span className="bracket bracket-tl" />
        <span className="bracket bracket-br" />
        <div className="p-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 grid place-items-center bg-accent/10 border border-accent/40 text-accent rounded-sm">
              <Bot size={18} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-midnight-950 animate-pulse" />
            </div>
            <div>
              <div className="font-serif text-lg text-steel-100 flex items-center gap-2">
                AddMine Agent <Sparkles size={14} className="text-accent" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 border border-emerald-400/30 px-1 py-0.5 rounded-sm">v2 · Human</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500 flex items-center gap-2">
                Local multimodal · multilingual · confirm-first
                <span className="inline-flex items-center gap-1 text-accent-cyan border border-accent-cyan/30 rounded-sm px-1.5"><Languages size={10} /> {lang.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={cn(
                  "px-2 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm border transition",
                  persona === p.id ? `${p.color} border-current bg-white/5` : "text-steel-500 border-white/10 hover:text-steel-200"
                )}
                title={p.tagline}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {([
              { id: "en", label: "EN" },
              { id: "roman-ur", label: "رومن" },
              { id: "ur", label: "اردو" },
            ] as { id: Lang; label: string }[]).map((l) => (
              <button
                key={l.id}
                onClick={() => { setLang(l.id); setMsgs((m) => [...m, { id: `lg_${Date.now()}`, role: "system", text: `Language → ${l.label}`, at: Date.now() }]); }}
                className={cn(
                  "px-2 py-1 text-[10px] font-mono rounded-sm border",
                  lang === l.id ? "text-accent border-accent/60 bg-accent/10" : "text-steel-500 border-white/10 hover:text-steel-200"
                )}
              >{l.label}</button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="chat-scroll p-4 h-[440px] overflow-y-auto space-y-3 bg-gradient-to-b from-black/20 to-transparent">
          {msgs.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role !== "user" && (
                <div className="w-7 h-7 shrink-0 grid place-items-center bg-accent/10 border border-accent/30 text-accent rounded-sm">
                  {m.role === "system" ? <Zap size={12} /> : <Bot size={14} />}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
                  m.role === "user" && "bg-accent text-midnight-950 font-medium",
                  m.role === "system" && "bg-white/5 border border-accent/20 text-steel-200 font-mono text-[11px]",
                  m.role === "assistant" && "bg-white/5 border border-white/10 text-steel-200"
                )}
                dir={m.lang === "ur" ? "rtl" : "ltr"}
              >
                <div>{m.text}</div>

                {/* Template preview cards inline */}
                {m.templates && m.templates.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {m.templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => applyTemplateInline(tpl.id)}
                        className="text-left rounded-sm border border-white/10 overflow-hidden hover:border-accent transition group"
                        style={{ background: tpl.swatches[0] }}
                      >
                        <div className="aspect-[16/10] relative p-2" style={{ background: `linear-gradient(135deg, ${tpl.swatches[0]}, ${tpl.swatches[1]})` }}>
                          <div className="relative flex flex-col h-full">
                            <div className="flex gap-1">
                              {tpl.swatches.slice(0, 3).map((c, i) => (
                                <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                              ))}
                            </div>
                            <div className="mt-2 font-serif text-xs" style={{ color: tpl.id === "cream-editorial" ? "#1a1410" : "#f3f4f6" }}>Ahmad Studio</div>
                            <div className="mt-auto h-4 rounded-sm w-16 grid place-items-center text-[7px] font-mono uppercase tracking-widest" style={{ background: tpl.swatches[3], color: tpl.swatches[0] }}>Button</div>
                          </div>
                        </div>
                        <div className="p-2" style={{ background: tpl.swatches[0], color: tpl.id === "cream-editorial" ? "#1a1410" : "#e6e7ea" }}>
                          <div className="text-[11px] font-serif flex items-center gap-1">
                            <Palette size={10} style={{ color: tpl.swatches[3] }} /> {tpl.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.actions.map((a) => {
                      const isDanger = /delete|hatao|remove/i.test(a.label);
                      const isConfirm = /yes|haan|karo|apply|theek/i.test(a.label);
                      return (
                        <button
                          key={a.id}
                          onClick={() => runAction(a)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition",
                            isDanger
                              ? "border-accent-red/40 text-accent-red bg-accent-red/5 hover:bg-accent-red/10"
                              : isConfirm
                                ? "border-emerald-400/40 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10"
                                : "border-accent/40 text-accent bg-accent/5 hover:bg-accent/10"
                          )}
                        >
                          {isConfirm ? <Check size={10} /> : isDanger ? <XIcon size={10} /> : <Wand2 size={10} />} {a.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 shrink-0 grid place-items-center bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded-sm">
                  <UserIcon size={14} />
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="flex gap-2">
              <div className="w-7 h-7 shrink-0 grid place-items-center bg-accent/10 border border-accent/30 text-accent rounded-sm">
                <Bot size={14} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-steel-300 text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-accent" />
                thinking…
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pt-2 flex flex-wrap gap-1.5 border-t border-white/5">
          {quickPromptsEN.map((q) => (
            <button key={q} onClick={() => send(q)} className="text-[10px] font-mono text-steel-400 border border-white/10 rounded-sm px-2 py-1 hover:border-accent/40 hover:text-accent">
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-3 border-t border-white/5 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              lang === "ur" ? "کچھ لکھیں…"
              : lang === "roman-ur" ? "Kuch bhi likho — English, Roman Urdu, ya اردو…"
              : "Ask anything, or tell me to change the site…"
            }
            dir={lang === "ur" ? "rtl" : "ltr"}
            className="flex-1 bg-black/40 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-3 py-2 text-sm text-steel-100 placeholder:text-steel-600 font-mono"
          />
          <button type="submit" className="w-10 h-10 grid place-items-center bg-accent text-midnight-950 rounded-sm hover:bg-accent-hot transition btn-edge">
            <Send size={14} />
          </button>
        </form>

        {tasks.length > 0 && (
          <div className="p-3 border-t border-white/5 bg-black/20">
            <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500 mb-2 flex items-center gap-2">
              <Zap size={10} className="text-accent" /> Scheduled Ops ({tasks.filter((t) => t.status === "queued").length} queued)
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto chat-scroll">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-[11px] font-mono">
                  <span className={t.status === "done" ? "text-steel-600 line-through" : "text-steel-300"}>• {t.title}</span>
                  <span className={t.status === "done" ? "text-emerald-400" : "text-accent"}>
                    {t.status === "done" ? "✓ fired" : new Date(t.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 py-2 bg-black/40 border-t border-white/5 font-mono text-[9px] uppercase tracking-[0.3em] text-steel-600 flex justify-between">
          <span>Session: {usedKey ?? "—"}</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 bg-emerald-400 rounded-full" /> Local LLM · no cloud · {lang}</span>
        </div>
      </div>
    </div>
  );
}
