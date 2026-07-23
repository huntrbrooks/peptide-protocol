export type CartLine = {
  slug: string;
  quantity: number;
};

export type CartState = {
  items: CartLine[];
};

export const CART_STORAGE_KEY = "pp-cart-v1";
