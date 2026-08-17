export const FIRST_ORDER_PERCENT = 15;
export const MEMBER_RATE_PERCENT = 10;

export function applyMemberDiscount(
  subtotalAud: number,
  percent: number,
): { discountAud: number; subtotalAud: number } {
  if (percent <= 0) {
    return { discountAud: 0, subtotalAud };
  }
  const discountAud =
    Math.round(((subtotalAud * percent) / 100) * 100) / 100;
  const charged = Math.round((subtotalAud - discountAud) * 100) / 100;
  return { discountAud, subtotalAud: charged };
}

export function normalizeMemberEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidMemberEmail(email: string): boolean {
  const value = normalizeMemberEmail(email);
  return value.length >= 5 && value.length <= 254 && value.includes("@");
}

export function normalizeMemberCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
