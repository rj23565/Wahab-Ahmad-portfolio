"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAdminUI, useAuth } from "@/lib/store";
import { useEffect } from "react";
import SecretGate from "./admin/SecretGate";
import CommandConsole from "./admin/CommandConsole";

export default function AdminOverlay() {
  const { open, stage, closeAll, openDashboard } = useAdminUI();
  const { authed } = useAuth();

  // Auto-transition to dashboard if already authed.
  useEffect(() => {
    if (open && authed && stage === "gate") {
      openDashboard();
    }
  }, [open, authed, stage, openDashboard]);

  // ESC closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAll]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] bg-midnight-950/85 backdrop-blur-xl overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAll();
          }}
        >
          {/* subtle grid */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(224,184,108,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(224,184,108,0.05) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative min-h-full py-10 px-4 sm:px-8">
            {stage === "gate" && !authed ? <SecretGate /> : <CommandConsole />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
