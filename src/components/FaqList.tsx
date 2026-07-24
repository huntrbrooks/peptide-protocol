import Link from "next/link";
import type { FaqItem } from "@/content/types";

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.question} className="group py-4">
          <summary className="cursor-pointer list-none font-medium text-ink marker:content-none">
            <span className="flex items-start justify-between gap-4">
              {item.question}
              <span className="text-muted transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            {item.answer}
            {item.link ? (
              <>
                {" "}
                <Link
                  href={item.link.href}
                  className="text-accent underline underline-offset-2"
                >
                  {item.link.label}
                </Link>
                .
              </>
            ) : null}
          </p>
        </details>
      ))}
    </div>
  );
}
