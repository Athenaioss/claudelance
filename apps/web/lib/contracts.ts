import deploymentSepolia from "../../../contracts/deployments/celo-sepolia.json";
import deploymentMainnet from "../../../contracts/deployments/celo-mainnet.json";
import { celoSepolia, celoMainnet } from "./chain";

/// Static deployment metadata pulled from the committed deployment records.
export const deployments = {
  [celoSepolia.id]: {
    core: deploymentSepolia.core as `0x${string}`,
    cUSD: deploymentSepolia.tokens.cUSD as `0x${string}`,
    treasury: deploymentSepolia.treasury as `0x${string}`,
    ciRelayer: deploymentSepolia.ciRelayer as `0x${string}`,
    owner: deploymentSepolia.owner as `0x${string}`,
  },
  [celoMainnet.id]: {
    core: deploymentMainnet.core as `0x${string}`,
    cUSD: deploymentMainnet.tokens.cUSD as `0x${string}`,
    treasury: deploymentMainnet.treasury as `0x${string}`,
    ciRelayer: deploymentMainnet.ciRelayer as `0x${string}`,
    owner: deploymentMainnet.owner as `0x${string}`,
  },
} as const;

export function getDeployment(chainId: number) {
  const entry = deployments[chainId as keyof typeof deployments];
  if (!entry) throw new Error(`No Claudelance deployment for chain ${chainId}`);
  return entry;
}

/// ClaudelanceCore v2 ABI surface — read-only views the frontend needs.
/// totalBountyVolume / totalProtocolRevenue are per-token (v2).
export const coreAbi = [
  {
    type: "function",
    name: "bountyCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalBountyVolume",
    stateMutability: "view",
    inputs: [{ type: "address", name: "token" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalProtocolRevenue",
    stateMutability: "view",
    inputs: [{ type: "address", name: "token" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalBountiesResolved",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "uniquePosterCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "uniqueWorkerCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "PROTOCOL_FEE_BPS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "RESOLUTION_GRACE_PERIOD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint64" }],
  },
] as const;
