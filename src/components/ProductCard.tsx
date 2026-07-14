import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/content/types";
import { formatPrice } from "@/content/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden border border-line bg-paper transition hover:border-accent/40 hover:shadow-[0_12px_40px_rgba(11,31,42,0.08)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-mist">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          {product.strength}
        </p>
        <h3 className="font-display text-lg leading-snug text-ink">
          {product.shortName}
        </h3>
        <p className="text-sm text-muted line-clamp-2">{product.shortLabel}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <p className="text-base font-medium text-ink">
            {formatPrice(product.priceAud)}
          </p>
          <span className="text-sm text-accent opacity-0 transition group-hover:opacity-100">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
