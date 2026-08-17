import type { CryptoChain, CryptoCurrency } from "@/lib/orders/types";
import { getSettlementOptions } from "@/lib/payments/settlement";

const CRYPTO_BUFFER = 1.02;
const ETH_CONFIRMATIONS = 12;
const DEFAULT_ETHEREUM_USDC_CONTRACT =
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const DEFAULT_SOLANA_USDC_MINT =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ERC20_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export type CryptoOption = {
  currency: CryptoCurrency;
  chain: CryptoChain;
  label: string;
};

type ConfiguredCryptoOption = CryptoOption & {
  walletAddress: string;
};

export function getConfiguredCryptoOptions(): ConfiguredCryptoOption[] {
  return getSettlementOptions().crypto;
}

export function getCryptoOption(chain: CryptoChain): ConfiguredCryptoOption {
  const option = getConfiguredCryptoOptions().find(
    (candidate) => candidate.chain === chain,
  );
  if (!option) {
    throw new Error(`${chain} USDC payments are not configured.`);
  }
  return option;
}

export async function createCryptoQuote(
  subtotalAud: number,
): Promise<{
  expectedAmount: number;
  priceAud: number;
  bufferPercent: number;
}> {
  const coinId = "usd-coin";
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=aud`,
    {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) {
    throw new Error("Unable to retrieve a live crypto quote. Please try again.");
  }
  const payload = (await response.json()) as Record<
    string,
    { aud?: unknown } | undefined
  >;
  const priceAud = payload[coinId]?.aud;
  if (typeof priceAud !== "number" || !Number.isFinite(priceAud) || priceAud <= 0) {
    throw new Error("Crypto quote response was invalid. Please try again.");
  }
  const expectedAmount = Number(
    ((subtotalAud * CRYPTO_BUFFER) / priceAud).toFixed(2),
  );
  return { expectedAmount, priceAud, bufferPercent: 2 };
}

type VerificationResult = {
  verified: boolean;
  note: string;
};

type VerifyInput = {
  currency: CryptoCurrency;
  chain: CryptoChain;
  expectedAmount: number;
  walletAddress: string;
  txid: string;
};

function toBaseUnits(amount: number, decimals: number): bigint {
  const [whole, fraction = ""] = amount.toFixed(decimals).split(".");
  return (
    BigInt(whole) * BigInt(10) ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0"))
  );
}

async function ethereumRpc<T>(
  method: string,
  params: string[],
): Promise<T | null> {
  const rpcUrl = process.env.ETH_RPC_URL?.trim();
  if (!rpcUrl) return null;
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Ethereum RPC request failed");
  const payload = (await response.json()) as {
    result?: T | null;
    error?: { message?: string };
  };
  if (payload.error) throw new Error(payload.error.message ?? "Ethereum RPC error");
  return payload.result ?? null;
}

async function verifyEthereum(input: VerifyInput): Promise<VerificationResult> {
  if (!process.env.ETH_RPC_URL?.trim()) {
    return {
      verified: false,
      note: "Ethereum RPC is not configured; queued for manual verification.",
    };
  }
  try {
    const receipt = await ethereumRpc<{
      status?: string;
      blockNumber?: string;
      logs?: Array<{
        address?: string;
        topics?: string[];
        data?: string;
      }>;
    }>("eth_getTransactionReceipt", [input.txid]);
    if (!receipt || receipt.status !== "0x1" || !receipt.blockNumber) {
      return {
        verified: false,
        note: "Transaction is not yet confirmed successfully; queued for review.",
      };
    }

    const contract = (
      process.env.ETHEREUM_USDC_CONTRACT ?? DEFAULT_ETHEREUM_USDC_CONTRACT
    ).toLowerCase();
    const recipientTopic = input.walletAddress.toLowerCase().replace(/^0x/, "");
    const expectedUnits = toBaseUnits(input.expectedAmount, 6);
    const valueMatches = (receipt.logs ?? []).some((log) => {
      const topics = log.topics ?? [];
      return (
        log.address?.toLowerCase() === contract &&
        topics[0]?.toLowerCase() === ERC20_TRANSFER_TOPIC &&
        topics[2]?.toLowerCase().endsWith(recipientTopic) === true &&
        BigInt(log.data ?? "0x0") >= expectedUnits
      );
    });
    if (!valueMatches) {
      return {
        verified: false,
        note: "Transaction destination or amount did not match; queued for review.",
      };
    }

    const latestBlock = await ethereumRpc<string>("eth_blockNumber", []);
    if (!latestBlock) {
      return {
        verified: false,
        note: "Transaction found; confirmation count is pending manual review.",
      };
    }
    const confirmations =
      Number(
        BigInt(latestBlock) - BigInt(receipt.blockNumber) + BigInt(1),
      );
    if (confirmations < ETH_CONFIRMATIONS) {
      return {
        verified: false,
        note: `Transaction found with ${confirmations}/${ETH_CONFIRMATIONS} confirmations.`,
      };
    }
    return {
      verified: true,
      note: `Verified on Ethereum with ${confirmations} confirmations.`,
    };
  } catch {
    return {
      verified: false,
      note: "Automatic Ethereum verification was unavailable; queued for review.",
    };
  }
}

type SolanaTokenBalance = {
  accountIndex?: number;
  mint?: string;
  owner?: string;
  uiTokenAmount?: { amount?: string; decimals?: number };
};

async function solanaRpc<T>(
  method: string,
  params: unknown[],
): Promise<T | null> {
  const rpcUrl = process.env.SOLANA_RPC_URL?.trim();
  if (!rpcUrl) return null;
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Solana RPC request failed");
  const payload = (await response.json()) as {
    result?: T | null;
    error?: { message?: string };
  };
  if (payload.error) throw new Error(payload.error.message ?? "Solana RPC error");
  return payload.result ?? null;
}

async function verifySolana(input: VerifyInput): Promise<VerificationResult> {
  if (!process.env.SOLANA_RPC_URL?.trim()) {
    return {
      verified: false,
      note: "Solana RPC is not configured; queued for manual verification.",
    };
  }
  try {
    const transaction = await solanaRpc<{
      meta?: {
        err?: unknown;
        preTokenBalances?: SolanaTokenBalance[];
        postTokenBalances?: SolanaTokenBalance[];
      };
    }>("getTransaction", [
      input.txid,
      {
        commitment: "finalized",
        encoding: "jsonParsed",
        maxSupportedTransactionVersion: 0,
      },
    ]);
    if (!transaction || transaction.meta?.err) {
      return {
        verified: false,
        note: "Solana transaction is not finalized successfully; queued for review.",
      };
    }

    const mint = process.env.SOLANA_USDC_MINT?.trim() || DEFAULT_SOLANA_USDC_MINT;
    const balancesForOwner = (balances: SolanaTokenBalance[] | undefined) =>
      (balances ?? []).filter(
        (balance) =>
          balance.owner === input.walletAddress &&
          balance.mint === mint &&
          balance.uiTokenAmount?.decimals === 6,
      );
    const sum = (balances: SolanaTokenBalance[]) =>
      balances.reduce(
        (total, balance) =>
          total + BigInt(balance.uiTokenAmount?.amount ?? "0"),
        BigInt(0),
      );
    const received =
      sum(balancesForOwner(transaction.meta?.postTokenBalances)) -
      sum(balancesForOwner(transaction.meta?.preTokenBalances));
    if (received < toBaseUnits(input.expectedAmount, 6)) {
      return {
        verified: false,
        note: "Solana USDC destination or amount did not match; queued for review.",
      };
    }
    return { verified: true, note: "Verified as finalized on Solana." };
  } catch {
    return {
      verified: false,
      note: "Automatic Solana verification was unavailable; queued for review.",
    };
  }
}

export async function verifyCryptoTransaction(
  input: VerifyInput,
): Promise<VerificationResult> {
  const validTxid =
    input.chain === "ethereum"
      ? /^0x[a-fA-F0-9]{64}$/.test(input.txid)
      : /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(input.txid);
  if (!validTxid) {
    throw new Error("Enter a valid transaction ID.");
  }
  return input.chain === "solana"
    ? await verifySolana(input)
    : await verifyEthereum(input);
}
