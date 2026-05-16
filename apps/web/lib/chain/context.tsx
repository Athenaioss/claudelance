"use client";

// React context for managing the active chain adapter (Celo or Solana).

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type ChainAdapter,
  ChainNetwork,
} from "./types";
import { createCeloAdapter } from "./celo-adapter";
import { createSolanaAdapter } from "./solana-adapter";

interface ChainContextValue {
  chain: ChainNetwork;
  adapter: ChainAdapter;
  switchChain: (network: ChainNetwork) => Promise<void>;
  isSwitching: boolean;
}

const ChainContext = createContext<ChainContextValue | null>(null);

// Lazy-init adapters
let celoAdapter: ChainAdapter | null = null;
let solanaAdapter: ChainAdapter | null = null;

function getAdapter(network: ChainNetwork): ChainAdapter {
  if (network === ChainNetwork.CELO) {
    if (!celoAdapter) celoAdapter = createCeloAdapter();
    return celoAdapter;
  }
  if (!solanaAdapter) solanaAdapter = createSolanaAdapter();
  return solanaAdapter;
}

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chain, setChain] = useState<ChainNetwork>(ChainNetwork.CELO);
  const [isSwitching, setIsSwitching] = useState(false);
  const [adapter, setAdapter] = useState<ChainAdapter>(() =>
    getAdapter(ChainNetwork.CELO)
  );

  const switchChain = useCallback(async (network: ChainNetwork) => {
    if (network === chain) return;
    setIsSwitching(true);
    try {
      // Disconnect current wallet before switching
      const currentAdapter = getAdapter(chain);
      if (currentAdapter.wallet.isConnected) {
        await currentAdapter.wallet.disconnect();
      }

      setChain(network);
      setAdapter(getAdapter(network));
    } finally {
      setIsSwitching(false);
    }
  }, [chain]);

  return (
    <ChainContext.Provider value={{ chain, adapter, switchChain, isSwitching }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) {
    throw new Error("useChain must be used within a ChainProvider");
  }
  return ctx;
}
