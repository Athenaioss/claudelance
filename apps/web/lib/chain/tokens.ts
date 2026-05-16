// Token definitions per chain.

import { ChainNetwork } from "./types";

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export const CELO_TOKENS: TokenInfo[] = [
  {
    mint: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
  },
  {
    mint: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    symbol: "CELO",
    name: "Celo (ERC20)",
    decimals: 18,
  },
  {
    mint: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
];

export const SOLANA_TOKENS: TokenInfo[] = [
  {
    mint: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Wrapped SOL",
    decimals: 9,
  },
  {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin (Solana)",
    decimals: 6,
  },
  {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD (Solana)",
    decimals: 6,
  },
];

export function getTokensForChain(network: ChainNetwork): TokenInfo[] {
  return network === ChainNetwork.CELO ? CELO_TOKENS : SOLANA_TOKENS;
}

export function getTokenByMint(network: ChainNetwork, mint: string): TokenInfo | undefined {
  const tokens = getTokensForChain(network);
  return tokens.find((t) => t.mint.toLowerCase() === mint.toLowerCase());
}
