"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdminUI, useAuth } from "@/lib/store";

const NAV = [
  { id: "home", label: "Home" },
  { id: "work", label: "Workspace" },
  { id: "tools", label: "Toolchain" },
  { id: "chrono", label: "Chronicle" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [wPulse, setWPulse] = useState(false);
  const { openGate } = useAdminUI();
  const { authed } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleWClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWPulse(true);
    setTimeout(() => setWPulse(false), 500);
    openGate(); // secret, hidden trigger — opens inline modal
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "backdrop-blur-xl bg-midnight-950/70 border-b border-white/5"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center select-none">
            <button
              onClick={handleWClick}
              onContextMenu={(e) => {
                e.preventDefault();
                openGate();
              }}
              className={cn(
                "group relative font-serif text-2xl sm:text-3xl tracking-tight",
                "text-steel-100 transition-transform duration-300 cursor-default",
                wPulse && "scale-110"
              )}
              aria-label="home"
            >
              <span className="relative inline-block">
                <span className="relative z-10 gold-gradient-text font-black">
                  W
                </span>
                <span className="absolute -inset-2 rounded-full bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </span>
              <span className="ml-1 text-steel-200 font-serif tracking-wide">
                ahab Ahmad
              </span>
              <span className="ml-2 text-accent font-mono text-xs align-middle opacity-70">
                _
              </span>
              <span className="text-accent font-mono text-xs align-middle caret">
                |
              </span>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n, i) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="px-3 py-2 text-sm text-steel-300 hover:text-accent transition-colors relative group"
              >
                <span className="font-mono text-[10px] text-steel-500 mr-1">
                  0{i + 1}
                </span>
                {n.label}
                <span className="absolute left-3 right-3 -bottom-0.5 h-px bg-accent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-steel-400 px-3 py-1.5 border border-white/5 rounded-full bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available for work
          </div>
          {authed ? (
            <button
              onClick={openGate}
              className="btn-edge px-4 py-2 text-xs font-mono uppercase tracking-widest border border-accent/40 text-accent hover:bg-accent/10 rounded-sm transition"
            >
              Console
            </button>
          ) : null}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden w-10 h-10 grid place-items-center border border-white/10 rounded-sm text-steel-200"
          aria-label="menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-midnight-950/95 backdrop-blur-xl">
          <nav className="px-5 py-4 flex flex-col gap-1">
            {NAV.map((n, i) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="text-left px-3 py-3 text-steel-200 hover:text-accent border-b border-white/5 flex items-center justify-between"
              >
                <span>
                  <span className="font-mono text-[10px] text-steel-500 mr-2">
                    0{i + 1}
                  </span>
                  {n.label}
                </span>
                <span className="text-steel-500">→</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
