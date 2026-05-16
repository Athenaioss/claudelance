"use client";

import { useChain } from "@/lib/chain/context";
import { ChainNetwork } from "@/lib/chain/types";
import { Network, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const CHAIN_OPTIONS = [
  {
    network: ChainNetwork.CELO,
    label: "Celo",
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    hoverColor: "hover:bg-emerald-500/10",
  },
  {
    network: ChainNetwork.SOLANA,
    label: "Solana",
    color: "bg-purple-500",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    hoverColor: "hover:bg-purple-500/10",
  },
] as const;

export function NetworkSwitcher() {
  const { chain, switchChain, isSwitching } = useChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = CHAIN_OPTIONS.find((c) => c.network === chain) ?? CHAIN_OPTIONS[0];
  const other = CHAIN_OPTIONS.find((c) => c.network !== chain)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isSwitching}
        className={`inline-flex items-center gap-1.5 rounded-full border ${current.borderColor} px-3 py-1.5 text-xs font-medium ${current.textColor} transition ${current.hoverColor} disabled:opacity-50`}
      >
        <span className={`h-2 w-2 rounded-full ${current.color} ${isSwitching ? "animate-pulse" : ""}`} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg">
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Switch Network
          </div>
          {CHAIN_OPTIONS.map((opt) => (
            <button
              key={opt.network}
              onClick={() => {
                switchChain(opt.network);
                setOpen(false);
              }}
              disabled={isSwitching || opt.network === chain}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition disabled:opacity-40 ${opt.hoverColor}`}
            >
              <span className={`h-2 w-2 rounded-full ${opt.color}`} />
              <span className="flex-1 text-left">{opt.label}</span>
              {opt.network === chain && (
                <span className={`h-1.5 w-1.5 rounded-full ${opt.color}`} />
              )}
              {opt.network !== chain && (
                <span className="text-[10px] text-muted-foreground">
                  {opt.network === ChainNetwork.SOLANA ? "Soon" : "Live"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
