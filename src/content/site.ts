export const site = {
  name: "The Protocol",
  domain: "theprotocolau.com",
  url: "https://theprotocolau.com",
  email: "contact@theprotocolau.com",
  handle: "@theprotocol.au",
  locale: "en-AU",
  currency: "AUD",
  tagline: "Documented research peptides, dispatched locally",
  researchDisclaimer:
    "For research purposes only. Not for human consumption. Not a medicine, supplement, or cosmetic. Laboratory and in vitro use only.",
  trustBar: [
    "Batch COA on request",
    "Third-party purity checks",
    "Dispatch before 2pm AEST",
    "Express tracking",
    "Plain packaging",
  ],
  /** Site-wide announcement bar — static one-liner, edit here to update live chrome */
  announcementBanner: [
    "Dispatch before 2pm AEST · Tracked Express Post Australia-wide",
  ],
  /** First-visit age + research-use checkpoint — edit here to update live chrome */
  ageGate: {
    eyebrow: "Research use only",
    heading: "Confirm your age",
    enterLabel: "I'm 18 or older — enter",
    under18Prefix: "Under 18?",
    leaveLabel: "Leave this site",
    leaveHref: "https://www.google.com.au",
    termsLabel: "Terms of Sale",
    termsHref: "/terms",
    disclaimerLabel: "Research Use Disclaimer",
    disclaimerHref: "/disclaimer",
    legalPaths: ["/terms", "/disclaimer", "/privacy"],
    researchEmphasis: "laboratory and research use only",
    ageEmphasis: "18 or older",
  },
  nav: [
    { label: "Shop", href: "/shop" },
    { label: "Quality", href: "/quality" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  footerNav: [
    {
      title: "Catalogue",
      links: [
        { label: "All products", href: "/shop" },
        { label: "Metabolic research", href: "/shop/metabolic" },
        { label: "Growth hormone pathway", href: "/shop/growth-hormone" },
        { label: "Tissue & recovery", href: "/shop/tissue-recovery" },
        { label: "Cellular & mitochondrial", href: "/shop/cellular-mitochondrial" },
        { label: "Other compounds", href: "/shop/other-compounds" },
        { label: "Research solvents", href: "/shop/research-solvents" },
      ],
    },
    {
      title: "Information",
      links: [
        { label: "Quality & testing", href: "/quality" },
        { label: "Lab handling", href: "/lab-handling" },
        { label: "Research calculator", href: "/dosing-calculator" },
        { label: "Stack finder", href: "/stack-finder" },
        { label: "Shipping", href: "/shipping" },
        { label: "Returns", href: "/returns" },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
        { label: "About", href: "/about" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of sale", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Research use disclaimer", href: "/disclaimer" },
      ],
    },
  ],
};

export const home = {
  metaTitle: "Research Peptides Australia | The Protocol",
  metaDescription:
    "Australian supplier of research-grade peptides with batch documentation, discreet express dispatch, and clear research-only terms. Shop verified materials at The Protocol.",
  eyebrow: "Research materials · Australia",
  headline: "Documented research peptides, dispatched locally",
  subheadline:
    "Lyophilised compounds with batch COAs and clear specs. Laboratory and in vitro use only — not for human consumption.",
  primaryCta: { label: "Shop research peptides", href: "/shop" },
  secondaryCta: { label: "Quality & testing", href: "/quality" },
  howItWorks: [
    "Choose materials, accept the research-use terms, then pay securely by card or supported crypto.",
    "We confirm stock, pack vials, and dispatch before 2pm AEST on business days when possible.",
    "You get tracking; request batch docs anytime.",
  ],
  complianceTitle: "Research use only",
  complianceBody:
    "All products are for laboratory and controlled research only — not medicines, supplements, cosmetics, or for human or veterinary use. Purchase confirms you accept these terms.",
  finalSupport: "Questions on docs or shipping? Contact support first.",
};

export const social = {
  bio: "Research peptides for Australian laboratories. Documented purity. Express dispatch. Research use only. Not for human consumption.\ntheprotocolau.com",
  linkInBio: [
    { label: "Shop all research materials", href: "https://theprotocolau.com/shop" },
    { label: "Quality & testing / COA requests", href: "https://theprotocolau.com/quality" },
    { label: "Shipping information", href: "https://theprotocolau.com/shipping" },
    { label: "Contact support", href: "https://theprotocolau.com/contact" },
    { label: "Research use disclaimer", href: "https://theprotocolau.com/disclaimer" },
  ],
};
