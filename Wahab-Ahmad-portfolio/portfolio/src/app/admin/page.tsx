"use client";

import { useEffect } from "react";
import { useAdminUI } from "@/lib/store";

export default function AdminEntryRoute() {
  const { openGate } = useAdminUI();
  useEffect(() => {
    // Auto-open the secret gate when /admin is hit directly.
    openGate();
  }, [openGate]);

  return (
    <div className="min-h-screen grid place-items-center px-4 pt-24">
      <div className="max-w-md text-center card rounded-sm p-8 relative">
        <span className="bracket bracket-tl" />
        <span className="bracket bracket-tr" />
        <span className="bracket bracket-bl" />
        <span className="bracket bracket-br" />
        <div className="section-label">// Secure Entry</div>
        <div className="mt-3 font-serif text-2xl text-steel-100">
          Awaiting Key…
        </div>
        <p className="mt-3 text-steel-400 text-sm font-mono">
          Authorization dialog should appear. If it doesn&apos;t, click the
          gold <span className="text-accent">W</span> in the logo.
        </p>
      </div>
    </div>
  );
}
