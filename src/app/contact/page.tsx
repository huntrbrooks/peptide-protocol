import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { pages } from "@/content/pages";
import { site } from "@/content/site";

const page = pages.contact!;

export const metadata: Metadata = {
  title: { absolute: page.metaTitle },
  description: page.metaDescription,
};

export default function ContactPage() {
  return (
    <div>
      <ContentPage page={page} />
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <form
          action={`mailto:${site.email}`}
          method="get"
          encType="text/plain"
          className="grid gap-4 border border-line bg-paper p-6"
        >
          <label className="grid gap-2 text-sm">
            <span className="text-ink">Name</span>
            <input
              name="name"
              required
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-ink">Email</span>
            <input
              type="email"
              name="email"
              required
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-ink">Message</span>
            <textarea
              name="body"
              required
              rows={5}
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              placeholder="Include order number or product name if relevant."
            />
          </label>
          <button
            type="submit"
            className="btn-primary justify-self-start rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
          >
            Open email to support
          </button>
          <p className="text-xs text-muted">
            This form opens your email client to {site.email}. For COA requests,
            include the product name and order number.
          </p>
        </form>
      </div>
    </div>
  );
}
