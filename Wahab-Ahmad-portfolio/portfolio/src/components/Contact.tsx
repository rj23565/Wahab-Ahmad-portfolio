"use client";

import { Mail, MapPin, MessageCircle, Phone, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { usePortfolio } from "@/lib/store";

export default function Contact() {
  const { profile } = usePortfolio();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(val);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  };

  const waDigits = profile.whatsapp.replace(/[^\d]/g, "");

  const CHANNELS = [
    {
      label: "WhatsApp Direct",
      value: profile.whatsapp,
      href: `https://wa.me/${waDigits}`,
      icon: MessageCircle,
      accent: "text-emerald-400",
      border: "hover:border-emerald-400/50",
    },
    {
      label: "Mobile Line",
      value: profile.phone,
      href: `tel:+${profile.phone.replace(/[^\d]/g, "")}`,
      icon: Phone,
      accent: "text-accent-cyan",
      border: "hover:border-accent-cyan/50",
    },
    {
      label: "Business Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
      icon: Mail,
      accent: "text-accent",
      border: "hover:border-accent/50",
    },
    {
      label: "Location",
      value: profile.location,
      href: "https://www.google.com/maps/place/Chak+Jhumra",
      icon: MapPin,
      accent: "text-accent-red",
      border: "hover:border-accent-red/50",
    },
  ];

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="section-label">// 05 — Contact</div>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl text-steel-100 leading-tight">
              Open a <span className="gold-gradient-text italic">Direct Channel</span>
            </h2>
            <p className="mt-5 text-steel-400 max-w-lg leading-relaxed">
              For commissions, production partnerships, web builds, or design
              retainers — reach {profile.firstName} directly. Fastest response is
              on WhatsApp. Every project is answered personally.
            </p>

            <div className="mt-10 relative">
              <div className="card rounded-sm p-6 relative">
                <span className="bracket bracket-tl" />
                <span className="bracket bracket-br" />
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-steel-500">
                    Transmission Status
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online · Awaiting Brief
                  </div>
                </div>
                <div className="font-mono text-xs text-steel-400 leading-7">
                  <div>
                    <span className="text-steel-500">[root@{profile.firstName.toLowerCase()} ~]$</span>{" "}
                    <span className="text-steel-200">status --listen</span>
                  </div>
                  <div>
                    <span className="text-accent">→</span> queue:{" "}
                    <span className="text-emerald-400">empty</span>
                  </div>
                  <div>
                    <span className="text-accent">→</span> channels:{" "}
                    <span className="text-steel-200">4 open</span>
                  </div>
                  <div>
                    <span className="text-accent">→</span> avg. response:{" "}
                    <span className="text-steel-200">&lt; 2 hours</span>
                    <span className="caret text-accent">▌</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              const isCopied = copied === c.value;
              return (
                <div
                  key={c.label}
                  className={cn(
                    "card rounded-sm p-5 relative group transition-all",
                    c.border
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "w-10 h-10 grid place-items-center border rounded-sm bg-white/[0.02]",
                        c.accent,
                        "border-white/10"
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <button
                      onClick={() => copy(c.value)}
                      className="w-8 h-8 grid place-items-center text-steel-500 hover:text-accent border border-white/5 rounded-sm"
                      aria-label="copy"
                    >
                      {isCopied ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                  <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-steel-500">
                    {c.label}
                  </div>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className={cn(
                      "mt-1 block font-serif text-lg text-steel-100 hover:underline underline-offset-4 decoration-accent/50 break-all",
                      c.accent
                    )}
                  >
                    {c.value}
                  </a>
                  <div className="mt-4 h-px bg-gradient-to-r from-white/10 to-transparent" />
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-steel-400 hover:text-steel-100"
                  >
                    Open channel →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
