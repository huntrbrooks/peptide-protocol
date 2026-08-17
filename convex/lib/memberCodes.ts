const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateMemberCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (byte) => {
    const index = byte % CODE_ALPHABET.length;
    return CODE_ALPHABET[index] ?? "A";
  }).join("");
  return `PROTOCOL-${body}`;
}
