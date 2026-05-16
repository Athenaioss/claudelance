// Celo (EVM) adapter — wraps existing viem/wagmi logic into ChainAdapter interface.

import {
  type ChainAdapter,
  type ChainBounty,
  type ChainStats,
  type PostBountyParams,
  type PostBountyResult,
  type ClaimSlotParams,
  type SubmitPrParams,
  type PickWinnerParams,
  type WalletState,
  ChainNetwork,
} from "./types";
// cUSD on Celo Mainnet — used for stats aggregation
const CUSD_MAINNET = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
import { createPublicClient, http } from "viem";
import { celo as viemCelo } from "viem/chains";
import { getDeployment, coreAbi } from "../contracts";

const DEFAULT_RPC = "https://forno.celo.org";

export function createCeloAdapter(): ChainAdapter {
  const publicClient = createPublicClient({
    chain: viemCelo,
    transport: http(
      process.env.NEXT_PUBLIC_CELO_MAINNET_RPC || DEFAULT_RPC
    ),
  });

  async function getDeploy() {
    return getDeployment(42220);
  }

  return {
    network: ChainNetwork.CELO,
    name: "Celo",
    chainId: 42220,

    get wallet(): WalletState {
      // Wallet state is managed externally by ConnectWallet (wagmi) / SolanaWalletProvider
      return {
        address: null,
        isConnected: false,
        chainName: "Celo",
        balance: 0,
        balanceSymbol: "",
        balanceFormatted: "0",
        connect: async () => {},
        disconnect: async () => {},
      };
    },

    async fetchStats(): Promise<ChainStats> {
      const { core } = await getDeploy();
      const reads = await publicClient.multicall({
        contracts: [
          { address: core, abi: coreAbi, functionName: "bountyCount" },
          { address: core, abi: coreAbi, functionName: "totalBountyVolume", args: [CUSD_MAINNET] },
          { address: core, abi: coreAbi, functionName: "totalProtocolRevenue", args: [CUSD_MAINNET] },
          { address: core, abi: coreAbi, functionName: "totalBountiesResolved" },
          { address: core, abi: coreAbi, functionName: "uniquePosterCount" },
          { address: core, abi: coreAbi, functionName: "uniqueWorkerCount" },
          { address: core, abi: coreAbi, functionName: "PROTOCOL_FEE_BPS" },
          { address: core, abi: coreAbi, functionName: "RESOLUTION_GRACE_PERIOD" },
        ] as const,
        allowFailure: true,
      });

      const vals = reads.map((r) =>
        r.status === "success" ? (r.result as bigint) : 0n
      );

      return {
        bountyCount: Number(vals[0]),
        totalVolume: Number(vals[1]) / 1e18, // cUSD has 18 decimals
        totalRevenue: Number(vals[2]) / 1e18,
        totalResolved: Number(vals[3]),
        uniquePosters: Number(vals[4]),
        uniqueWorkers: Number(vals[5]),
        feeBps: Number(vals[6]),
        graceSeconds: Number(vals[7]),
      };
    },

    async fetchBounties(limit = 50): Promise<ChainBounty[]> {
      const { core } = await getDeploy();
      const count = (await publicClient.readContract({
        address: core,
        abi: coreAbi,
        functionName: "bountyCount",
      })) as bigint;

      const total = Number(count);
      const start = Math.max(1, total - limit + 1);
      const results: ChainBounty[] = [];

      for (let i = total; i >= start; i--) {
        try {
          const bounty = (await publicClient.readContract({
            address: core,
            abi: [
              ...coreAbi,
              {
                type: "function",
                name: "getBounty",
                stateMutability: "view",
                inputs: [{ type: "uint256", name: "bountyId" }],
                outputs: [
                  { type: "tuple", components: [
                    { type: "address", name: "poster" },
                    { type: "uint96", name: "amount" },
                    { type: "address", name: "winner" },
                    { type: "uint96", name: "stakeRequired" },
                    { type: "address", name: "token" },
                    { type: "uint64", name: "deadline" },
                    { type: "uint8", name: "maxSlots" },
                    { type: "uint8", name: "claimedSlots" },
                    { type: "uint8", name: "bountyType" },
                    { type: "bool", name: "ciRequired" },
                    { type: "address", name: "targetWorker" },
                    { type: "uint8", name: "status" },
                    { type: "string", name: "targetRepoUrl" },
                    { type: "string", name: "instructionUrl" },
                    { type: "bytes32", name: "requirementsHash" },
                  ]},
                ],
              },
            ],
            functionName: "getBounty",
            args: [BigInt(i)],
          })) as any;

          const statusMap = ["Open", "Resolved", "Cancelled"] as const;
          const decimals = bounty[4].toLowerCase() === CUSD_MAINNET.toLowerCase() ? 18 : 6;

          results.push({
            id: `celo:${i}`,
            chain: ChainNetwork.CELO,
            chainId: 42220,
            poster: bounty[0],
            tokenMint: bounty[4],
            tokenSymbol: bounty[4].toLowerCase() === CUSD_MAINNET.toLowerCase() ? "cUSD" : "???",
            amount: Number(bounty[1]),
            amountFormatted: (Number(bounty[1]) / 10 ** decimals).toFixed(2),
            stakeRequired: Number(bounty[3]),
            maxSlots: bounty[6],
            claimedSlots: bounty[7],
            bountyType: bounty[8],
            ciRequired: bounty[9],
            targetWorker: bounty[10] === "0x0000000000000000000000000000000000000000" ? null : bounty[10],
            status: (statusMap[bounty[11]] ?? "Open") as ChainBounty["status"],
            deadline: Number(bounty[5]),
            winner: bounty[2] === "0x0000000000000000000000000000000000000000" ? null : bounty[2],
            targetRepoUrl: bounty[12],
            instructionUrl: bounty[13],
            requirementsHash: bounty[14],
          });
        } catch {
          // bounty may not exist (gap in counter)
          continue;
        }
      }
      return results;
    },

    async fetchBounty(bountyId: string): Promise<ChainBounty> {
      const numericId = bountyId.replace("celo:", "");
      const { core } = await getDeploy();
      const bounty = (await publicClient.readContract({
        address: core,
        abi: coreAbi,
        functionName: "getBounty",
        args: [BigInt(numericId)],
      })) as any;

      return {
        id: `celo:${numericId}`,
        chain: ChainNetwork.CELO,
        chainId: 42220,
        poster: bounty[0],
        tokenMint: bounty[4],
        tokenSymbol: "cUSD",
        amount: Number(bounty[1]),
        amountFormatted: (Number(bounty[1]) / 1e18).toFixed(2),
        stakeRequired: Number(bounty[3]),
        maxSlots: bounty[6],
        claimedSlots: bounty[7],
        bountyType: bounty[8],
        ciRequired: bounty[9],
        targetWorker: bounty[10] === "0x0000000000000000000000000000000000000000" ? null : bounty[10],
        status: ["Open", "Resolved", "Cancelled"][bounty[11]] as ChainBounty["status"],
        deadline: Number(bounty[5]),
        winner: bounty[2] === "0x0000000000000000000000000000000000000000" ? null : bounty[2],
        targetRepoUrl: bounty[12],
        instructionUrl: bounty[13],
        requirementsHash: bounty[14],
      };
    },

    async postBounty(params: PostBountyParams): Promise<PostBountyResult> {
      throw new Error("Celo postBounty requires wagmi write — use useWriteContract in component");
    },

    async claimSlot(params: ClaimSlotParams): Promise<{ txHash: string }> {
      throw new Error("Celo claimSlot requires wagmi write — use useWriteContract in component");
    },

    async submitPr(params: SubmitPrParams): Promise<{ txHash: string }> {
      throw new Error("Celo submitPr requires wagmi write — use useWriteContract in component");
    },

    async pickWinner(params: PickWinnerParams): Promise<{ txHash: string }> {
      throw new Error("Celo pickWinner requires wagmi write — use useWriteContract in component");
    },

    async cancelExpired(bountyId: string): Promise<{ txHash: string }> {
      throw new Error("Celo cancelExpired requires wagmi write — use useWriteContract in component");
    },

    async settleStake(bountyId: string, worker: string): Promise<{ txHash: string }> {
      throw new Error("Celo settleStake requires wagmi write — use useWriteContract in component");
    },

    async withdrawEarnings(tokenMint: string): Promise<{ txHash: string }> {
      throw new Error("Celo withdrawEarnings requires wagmi write — use useWriteContract in component");
    },
  };
}
