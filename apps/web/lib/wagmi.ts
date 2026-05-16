import { createConfig, http } from "wagmi";
import { celoMainnet, celoSepolia } from "./chain";

export const wagmiConfig = createConfig({
  chains: [celoMainnet, celoSepolia],
  transports: {
    [celoMainnet.id]: http(
      process.env.NEXT_PUBLIC_CELO_MAINNET_RPC || "https://forno.celo.org"
    ),
    [celoSepolia.id]: http(
      process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC ||
        "https://forno.celo-sepolia.celo-testnet.org/"
    ),
  },
  ssr: true,
});
