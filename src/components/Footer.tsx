import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Peptide Protocol home" className="inline-block">
              <Image
                src="/images/logo-mark.png"
                alt="Peptide Protocol"
                width={48}
                height={48}
                className="h-12 w-12 rounded-sm bg-paper p-1.5"
              />
            </Link>
            <p className="mt-4 font-display text-2xl tracking-tight">Peptide Protocol</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/70">
              Research-grade peptides for Australian laboratories. Documented
              purity. Clear research-only terms.
            </p>
            <p className="mt-4 text-sm text-paper/60">{site.handle}</p>
          </div>
          {site.footerNav.map((group) => (
            <div key={group.title}>
              <p className="text-xs uppercase tracking-[0.16em] text-paper/50">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-paper/80 transition hover:text-teal-soft"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-paper/10 pt-6">
          <p className="max-w-4xl text-xs leading-relaxed text-paper/55">
            {site.researchDisclaimer} Purchase confirms acceptance of the{" "}
            <Link href="/disclaimer" className="underline underline-offset-2">
              Research Use Disclaimer
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Sale
            </Link>
            .
          </p>
          <p className="mt-4 text-xs text-paper/40">
            © {new Date().getFullYear()} Peptide Protocol · {site.domain}
          </p>
        </div>
      </div>
    </footer>
  );
}
