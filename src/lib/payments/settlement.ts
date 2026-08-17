import "server-only";

const DEFAULT_ETHEREUM_USDC_ADDRESS =
  "0x22ca069363df8cf72c1d900e001c218e1fb62025";
const DEFAULT_SOLANA_USDC_ADDRESS =
  "EbqrjfM5dYTiuQcJmgf5sw2968HkGb3dQUaokm6AGoi8";
const DEFAULT_BANK_BSB = "645646";
const DEFAULT_BANK_ACCOUNT_NUMBER = "108361845";

function configuredValue(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export type SettlementNetwork = "ethereum" | "solana";

export function getSettlementOptions() {
  return {
    crypto: [
      {
        currency: "usdc" as const,
        chain: "ethereum" as const,
        label: "USDC (Ethereum)",
        walletAddress: configuredValue(
          "PAYMENT_ETHEREUM_USDC_ADDRESS",
          DEFAULT_ETHEREUM_USDC_ADDRESS,
        ),
      },
      {
        currency: "usdc" as const,
        chain: "solana" as const,
        label: "USDC (Solana)",
        walletAddress: configuredValue(
          "PAYMENT_SOLANA_USDC_ADDRESS",
          DEFAULT_SOLANA_USDC_ADDRESS,
        ),
      },
    ],
    bank: {
      accountName: configuredValue("BANK_ACCOUNT_NAME", "The Protocol"),
      bsb: configuredValue("BANK_BSB", DEFAULT_BANK_BSB),
      accountNumber: configuredValue(
        "BANK_ACCOUNT_NUMBER",
        DEFAULT_BANK_ACCOUNT_NUMBER,
      ),
    },
  };
}
