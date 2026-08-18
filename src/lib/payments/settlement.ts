import "server-only";

function requiredValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export type SettlementNetwork = "ethereum" | "solana";

export function getSettlementOptions() {
  return {
    crypto: [
      {
        currency: "usdc" as const,
        chain: "ethereum" as const,
        label: "USDC (Ethereum)",
        walletAddress: requiredValue("PAYMENT_ETHEREUM_USDC_ADDRESS"),
      },
      {
        currency: "usdc" as const,
        chain: "solana" as const,
        label: "USDC (Solana)",
        walletAddress: requiredValue("PAYMENT_SOLANA_USDC_ADDRESS"),
      },
    ],
    bank: {
      accountName: requiredValue("BANK_ACCOUNT_NAME"),
      bsb: requiredValue("BANK_BSB"),
      accountNumber: requiredValue("BANK_ACCOUNT_NUMBER"),
    },
  };
}
