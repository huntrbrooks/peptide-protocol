import { site } from "@/content/site";

export function AnnouncementBanner() {
  const messages = site.announcementBanner;
  if (!messages.length) return null;

  return (
    <div
      className="announcement-banner bg-ink text-sand"
      role="region"
      aria-label="Site announcements"
    >
      <p className="px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-sand/95 sm:text-xs sm:tracking-[0.2em]">
        {messages.join("  ·  ")}
      </p>
    </div>
  );
}
