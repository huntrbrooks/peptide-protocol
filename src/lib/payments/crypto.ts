import type { CryptoChain, CryptoCurrency } from "@/lib/orders/types";

const CRYPTO_BUFFER = 1.02;
const ETH_CONFIRMATIONS = 12;
const DEFAULT_USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";

export type CryptoOption = {
  currency: CryptoCurrency;
  chain: CryptoChain;
  label: string;
};

type ConfiguredCryptoOption = CryptoOption & {
  walletAddress: string;
};

export function getConfiguredCryptoOptions(): ConfiguredCryptoOption[] {
  const options: ConfiguredCryptoOption[] = [];
  const ethAddress = process.env.CRYPTO_ETH_ADDRESS?.trim();
  const usdtAddress = process.env.CRYPTO_USDT_ADDRESS?.trim();
  const btcAddress = process.env.CRYPTO_BTC_ADDRESS?.trim();

  if (ethAddress) {
    options.push({
      currency: "eth",
      chain: "ethereum",
      label: "ETH (Ethereum)",
      walletAddress: ethAddress,
    });
  }
  if (usdtAddress) {
    options.push({
      currency: "usdt",
      chain: "ethereum",
      label: "USDT (Ethereum ERC-20)",
      walletAddress: usdtAddress,
    });
  }
  if (btcAddress) {
    options.push({
      currency: "btc",
      chain: "bitcoin",
      label: "BTC (Bitcoin)",
      walletAddress: btcAddress,
    });
  }
  return options;
}

export function getCryptoOption(currency: CryptoCurrency): ConfiguredCryptoOption {
  const option = getConfiguredCryptoOptions().find(
    (candidate) => candidate.currency === currency,
  );
  if (!option) {
    throw new Error(`${currency.toUpperCase()} payments are not configured.`);
  }
  return option;
}

export async function createCryptoQuote(
  subtotalAud: number,
  currency: CryptoCurrency,
): Promise<{
  expectedAmount: number;
  priceAud: number;
  bufferPercent: number;
}> {
  const coinId =
    currency === "eth" ? "ethereum" : currency === "btc" ? "bitcoin" : "tether";
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
  const decimals = currency === "usdt" ? 2 : 8;
  const expectedAmount = Number(
    ((subtotalAud * CRYPTO_BUFFER) / priceAud).toFixed(decimals),
  );
  return { expectedAmount, priceAud, bufferPercent: 2 };
}

type VerificationResult = {
  verified: boolean;
  note: string;
};

type VerifyInput = {
  currency: CryptoCurrency;
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
    const transaction = await ethereumRpc<{
      to?: string;
      value?: string;
      input?: string;
    }>("eth_getTransactionByHash", [input.txid]);
    const receipt = await ethereumRpc<{
      status?: string;
      blockNumber?: string;
    }>("eth_getTransactionReceipt", [input.txid]);
    if (!transaction || !receipt || receipt.status !== "0x1" || !receipt.blockNumber) {
      return {
        verified: false,
        note: "Transaction is not yet confirmed successfully; queued for review.",
      };
    }

    let valueMatches = false;
    if (input.currency === "eth") {
      const expectedWei = toBaseUnits(input.expectedAmount, 18);
      valueMatches =
        transaction.to?.toLowerCase() === input.walletAddress.toLowerCase() &&
        BigInt(transaction.value ?? "0x0") >= expectedWei;
    } else {
      const contract = (
        process.env.CRYPTO_USDT_CONTRACT ?? DEFAULT_USDT_CONTRACT
      ).toLowerCase();
      const callData = transaction.input?.toLowerCase() ?? "";
      const recipient = callData.length >= 74 ? `0x${callData.slice(34, 74)}` : "";
      const amountHex = callData.length >= 138 ? callData.slice(74, 138) : "0";
      const expectedUnits = toBaseUnits(input.expectedAmount, 6);
      valueMatches =
        transaction.to?.toLowerCase() === contract &&
        callData.startsWith("0xa9059cbb") &&
        recipient === input.walletAddress.toLowerCase() &&
        BigInt(`0x${amountHex}`) >= expectedUnits;
    }
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

async function verifyBitcoin(input: VerifyInput): Promise<VerificationResult> {
  try {
    const response = await fetch(
      `https://blockstream.info/api/tx/${encodeURIComponent(input.txid)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      return {
        verified: false,
        note: "Bitcoin transaction was not found yet; queued for review.",
      };
    }
    const transaction = (await response.json()) as {
      status?: { confirmed?: boolean };
      vout?: Array<{
        scriptpubkey_address?: string;
        value?: number;
      }>;
    };
    const expectedSats = Math.ceil(input.expectedAmount * 1e8);
    const paidSats = (transaction.vout ?? [])
      .filter((output) => output.scriptpubkey_address === input.walletAddress)
      .reduce((total, output) => total + (output.value ?? 0), 0);
    if (!transaction.status?.confirmed || paidSats < expectedSats) {
      return {
        verified: false,
        note: "Bitcoin payment is unconfirmed or below the quoted amount; queued for review.",
      };
    }
    return { verified: true, note: "Verified in a confirmed Bitcoin block." };
  } catch {
    return {
      verified: false,
      note: "Automatic Bitcoin verification was unavailable; queued for review.",
    };
  }
}

export async function verifyCryptoTransaction(
  input: VerifyInput,
): Promise<VerificationResult> {
  if (!/^(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})$/.test(input.txid)) {
    throw new Error("Enter a valid transaction ID.");
  }
  return input.currency === "btc"
    ? await verifyBitcoin(input)
    : await verifyEthereum(input);
}
