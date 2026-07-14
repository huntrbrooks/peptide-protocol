import { site } from "@/content/site";

export function AnnouncementBanner() {
  const messages = site.announcementBanner;
  if (!messages.length) return null;

  const joined = messages.join("  ·  ");
  // Duplicate for a seamless loop; a third copy keeps wide viewports covered.
  const track = `${joined}  ·  ${joined}  ·  ${joined}`;

  return (
    <div
      className="announcement-banner relative overflow-hidden bg-ink text-sand"
      role="region"
      aria-label="Site announcements"
    >
      <p className="sr-only">{messages.join(". ")}</p>

      <div className="announcement-banner__fade announcement-banner__fade--left" aria-hidden />
      <div className="announcement-banner__fade announcement-banner__fade--right" aria-hidden />

      <p className="announcement-banner__static px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-sand/95 sm:text-xs sm:tracking-[0.2em]">
        {joined}
      </p>

      <div className="announcement-banner__marquee py-2.5" aria-hidden="true">
        <div className="announcement-banner__track">
          <span className="announcement-banner__copy">{track}</span>
          <span className="announcement-banner__copy">{track}</span>
        </div>
      </div>
    </div>
  );
}
