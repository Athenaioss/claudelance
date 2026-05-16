import { createConfig, http } from "wagmi";
import {
  celoMainnet,
  arbitrumMainnet,
  baseMainnet,
  polygonMainnet,
  celoSepolia,
} from "./chain";

export const wagmiConfig = createConfig({
  chains: [celoMainnet, arbitrumMainnet, baseMainnet, polygonMainnet, celoSepolia],
  transports: {
    [celoMainnet.id]: http(
      process.env.NEXT_PUBLIC_CELO_MAINNET_RPC || "https://forno.celo.org"
    ),
    [arbitrumMainnet.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc"
    ),
    [baseMainnet.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org"
    ),
    [polygonMainnet.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_RPC || "https://polygon-rpc.com"
    ),
    [celoSepolia.id]: http(
      process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC ||
        "https://forno.celo-sepolia.celo-testnet.org/"
    ),
  },
  ssr: true,
});
