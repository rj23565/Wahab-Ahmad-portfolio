"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Lock, LogIn, ShieldAlert, Terminal, Sparkles, CheckCircle2 } from "lucide-react";
import { useAdminUI, useAuth } from "@/lib/store";

// AI-style recognizer hints — these appear as the user types so the agentic
// analyzer can "read" intent before submit.
const HINTS: { match: RegExp; hint: string }[] = [
  { match: /^\/?addmine$/i, hint: "✓ Root key recognized" },
  { match: /^\/?addmine\/330$/i, hint: "✓ Master seed key recognized" },
  { match: /^\/?addmine\/3310$/i, hint: "✓ Wahab key (base) recognized" },
  { match: /^\/?addmine\/3310\/wahab$/i, hint: "✓ Wahab identity key recognized" },
  { match: /^\/?addmine\/1122$/i, hint: "✓ Operational key recognized" },
  { match: /^\/?addmine\/moiz\/1122$/i, hint: "✓ Moiz key recognized" },
  { match: /^\/?addmine\/wahab$/i, hint: "✓ Named root recognized" },
];

export default function SecretGate() {
  const { tryKey } = useAuth();
  const { openDashboard, closeAll } = useAdminUI();
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const match = HINTS.find((h) => h.match.test(key.trim()));
    setHint(match ? match.hint : null);

    // Auto-submit on recognized key for agentic "auto-open" behavior.
    if (match && key.trim().length > 1) {
      setScanning(true);
      const t = setTimeout(() => {
        if (tryKey(key)) {
          openDashboard();
        } else {
          setScanning(false);
        }
      }, 420);
      return () => clearTimeout(t);
    } else {
      setScanning(false);
    }
  }, [key, tryKey, openDashboard]);

  // "Agentic" listener — the user said it should auto-analyze. When the field is
  // empty & user has typed nothing yet, simulate AI listening for 2s.
  useEffect(() => {
    setListening(true);
    const t = setTimeout(() => setListening(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = tryKey(key);
    if (ok) {
      setErr(null);
      openDashboard();
    } else {
      setErr("Key mismatch. Access denied. Biometric mismatch recorded.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto card rounded-sm relative p-8 shadow-edge mt-16">
      <span className="bracket bracket-tl" />
      <span className="bracket bracket-tr" />
      <span className="bracket bracket-bl" />
      <span className="bracket bracket-br" />

      <div className="flex items-center gap-3">
        <div className="relative w-11 h-11 grid place-items-center bg-accent/10 border border-accent/40 text-accent rounded-sm">
          <Lock size={18} />
          {listening && (
            <span className="absolute inset-0 rounded-sm border border-accent/60 animate-ping" />
          )}
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500 flex items-center gap-2">
            <Sparkles size={10} className="text-accent" /> Agentic Gate
          </div>
          <div className="font-serif text-xl text-steel-100">
            AddMine Console
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 border border-white/10 bg-black/40 rounded-sm font-mono text-[11px] text-steel-400 flex gap-2">
        <Terminal size={14} className="text-accent mt-0.5 shrink-0" />
        <div>
          {listening ? (
            <span className="text-accent-cyan">
              AI listening… speak or type the authorization string.
            </span>
          ) : (
            <>
              Supply a valid cryptographic key. This gate is{" "}
              <span className="text-accent">hidden</span> from ordinary visitors.
            </>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-steel-500 flex items-center justify-between">
            <span>Authorization Key</span>
            {scanning ? (
              <span className="text-accent animate-pulse">analyzing…</span>
            ) : hint ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={10} /> {hint}
              </span>
            ) : null}
          </span>
          <input
            ref={inputRef}
            autoFocus
            type="password"
            spellCheck={false}
            autoComplete="off"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setErr(null);
            }}
            placeholder="/addmine/..."
            className="mt-2 w-full bg-black/50 border border-white/10 focus:border-accent/60 focus:outline-none rounded-sm px-4 py-3 font-mono text-sm text-steel-100 placeholder:text-steel-600 transition"
          />
        </label>

        {err && (
          <div className="flex items-start gap-2 p-3 border border-accent-red/40 bg-accent-red/5 text-accent-red rounded-sm text-xs font-mono">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            <div>{err}</div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={closeAll}
            className="px-4 py-3 border border-white/10 text-steel-300 hover:text-steel-100 text-sm rounded-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-edge flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent text-midnight-950 font-semibold tracking-wide text-sm rounded-sm hover:bg-accent-hot transition"
          >
            Authenticate
            <LogIn size={16} />
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-steel-600">
        <span>Wahab Ahmad · Restricted</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          AI ARMED
        </span>
      </div>
    </div>
  );
}
