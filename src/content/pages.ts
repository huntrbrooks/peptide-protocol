import type { PageContent } from "./types";

export const pages: Record<string, PageContent> = {
  about: {
    slug: "about",
    metaTitle: "About Peptide Protocol | Research Peptides Australia",
    metaDescription:
      "Learn how Peptide Protocol supplies research-grade peptides to Australian laboratories with batch documentation and clear research-only terms.",
    headline: "About Peptide Protocol",
    body: [
      "Australian supplier of lyophilised research peptides for laboratory use. Built around documentation, transit integrity, and plain research-only terms.",
    ],
    sections: [
      {
        title: "What we prioritise",
        body: [
          "Identity and purity docs for verified lots.",
          "Clear labelling for inventory.",
          "Plain outer packing; tracked Australia Post express where available.",
          "Support grounded in batch and shipping facts.",
        ],
      },
      {
        title: "What we do not do",
        body: [
          "Present materials as medicines, supplements, or cosmetics.",
          "Publish dosing, administration, or personal-use guidance.",
          "Use wellness marketing or urgency tactics.",
        ],
      },
      {
        title: "Australian focus",
        body: [
          "Local packing and clear business-day dispatch cut-offs. Contact support for a COA or shipping clarification before ordering.",
        ],
      },
    ],
  },
  quality: {
    slug: "quality",
    metaTitle: "Quality & Testing | Peptide Protocol Australia",
    metaDescription:
      "How Peptide Protocol verifies research peptide purity, provides Certificates of Analysis, and documents third-party testing for Australian laboratories.",
    headline: "Quality and testing",
    body: [
      "Identity and purity must be documentable. COAs are part of the product, not an afterthought.",
    ],
    sections: [
      {
        title: "Analytical approach",
        body: [
          "Lots are assessed by RP-HPLC. Third-party verification can be requested where listed for a batch.",
        ],
        bullets: [
          "Purity target ≥99.0% on COA-validated lots unless a batch note says otherwise",
          "Identity vs expected chromatographic profiles",
          "Batch-linked docs on request for verified lots",
        ],
      },
      {
        title: "How to request a COA",
        body: [
          "Email support with order number or product/batch details. We’ll send the COA or confirm if docs are pending.",
        ],
      },
      {
        title: "Packing and labelling",
        body: [
          "Protective inner pack; research inventory labels; plain outer cartons (no product names).",
        ],
      },
      {
        title: "Limits of documentation",
        body: [
          "A COA describes the tested lot under stated methods. It does not authorise human, veterinary, or non-research use. Check the COA for your batch.",
        ],
      },
    ],
  },
  "lab-handling": {
    slug: "lab-handling",
    metaTitle: "Lab Handling | Research Peptide Reconstitution Overview Australia",
    metaDescription:
      "Laboratory overview of reconstituting lyophilised research peptides with bacteriostatic or sterile water under trained procedures. Research use only — not medical or personal-use guidance.",
    headline: "Lab handling",
    body: [
      "This page is a laboratory-context overview of how lyophilised research peptides are reconstituted with bacteriostatic or sterile water under trained procedures. It is provided for research handling reference only.",
      "It is not medical advice, dosing information, or personal-use guidance. All materials supplied by Peptide Protocol are for laboratory and in vitro research only — not for human or veterinary use.",
    ],
    video: {
      src: "/videos/mixing-bac-water-peptides.mp4",
      title: "Mixing bacteriostatic water and research peptides",
      caption:
        "Laboratory handling reference only. Reconstitution of research materials should follow your organisation’s SOPs and be performed by trained personnel. Not medical or personal-use guidance.",
    },
    sections: [
      {
        title: "What the video covers",
        body: [
          "A general laboratory walkthrough of combining a sterile solvent (bacteriostatic or sterile water) with a lyophilised research peptide to prepare a reconstituted stock solution for in vitro work.",
        ],
        bullets: [
          "Sterile-solvent handling in a controlled laboratory setting",
          "Adding solvent gently to the lyophilised material rather than agitating",
          "Allowing the solid to dissolve without vigorous shaking",
          "Labelling and cold storage of the reconstituted research stock",
        ],
      },
      {
        title: "Laboratory context and SOP reminder",
        body: [
          "Reconstitution should only be carried out by trained personnel under your organisation’s standard operating procedures, with appropriate PPE, aseptic technique, and waste handling. Solvent choice, concentration, and storage are determined by the research protocol, not by this overview.",
          "This content does not authorise, describe, or imply any human, veterinary, clinical, or personal use of these materials.",
        ],
      },
      {
        title: "Research use disclaimer",
        body: [
          "All handling is subject to our Research Use Disclaimer: laboratory and in vitro use only, not for human consumption, and not a medicine, supplement, or cosmetic.",
        ],
      },
    ],
    ctaLink: {
      href: "/disclaimer",
      label: "Read the Research Use Disclaimer",
    },
  },
  faq: {
    slug: "faq",
    metaTitle: "FAQ | Peptide Protocol Research Peptides Australia",
    metaDescription:
      "Answers on research-only terms, shipping, COAs, packaging, and ordering research peptides from Peptide Protocol in Australia.",
    headline: "Frequently asked questions",
    body: [
      "Common questions from research buyers. For batch docs, contact support with product or order details.",
    ],
    faqs: [
      {
        question: "Are these products for human use?",
        answer:
          "No — laboratory and in vitro research only. Not for human, veterinary, diagnostic, or consumer use.",
      },
      {
        question: "Do you provide Certificates of Analysis?",
        answer:
          "Yes, for verified lots. Email support with product and order/batch reference.",
      },
      {
        question: "Where do you ship?",
        answer:
          "Australian delivery via tracked Australia Post express where available. Ask support if unsure.",
      },
      {
        question: "When do you dispatch?",
        answer:
          "Before 2pm AEST on business days, same-day when stock is confirmed.",
      },
      {
        question: "Is packaging discreet?",
        answer: "Yes — plain outer labelling, no product names.",
      },
      {
        question: "Do you sell single vials and kits?",
        answer:
          "Yes. In-stock peptides are offered as single vials and as 10-vial kits where listed on the product page.",
      },
      {
        question: "Do you have a laboratory mixing overview?",
        answer:
          "Yes — a laboratory-context overview of reconstituting lyophilised research peptides with bacteriostatic or sterile water. Research handling reference only — not medical, dosing, or personal-use guidance.",
        link: { href: "/lab-handling", label: "Watch the lab handling video" },
      },
      {
        question: "Is there a research calculator for lab-math?",
        answer:
          "Yes — an educational tool for concentration, solvent volume, and U-100 syringe-unit arithmetic from vial mass. Research lab-math reference only — not medical advice, dosing protocols, or personal-use guidance.",
        link: { href: "/dosing-calculator", label: "Open the research calculator" },
      },
      {
        question: "How do returns work?",
        answer:
          "See Returns. Unopened items may qualify; contact support before sending anything back.",
      },
      {
        question: "Is checkout live?",
        answer:
          "Prices in AUD. MoonPay Apple Pay / Google Pay (crypto) is staged pending merchant credentials. Email Contact for a purchase enquiry until live.",
      },
    ],
  },
  shipping: {
    slug: "shipping",
    metaTitle: "Shipping Information Australia | Peptide Protocol",
    metaDescription:
      "Australia Post express shipping, dispatch cut-offs, tracking, and discreet packaging for Peptide Protocol research materials.",
    headline: "Shipping",
    body: [
      "Local packing; tracked Australia Post express where available.",
    ],
    sections: [
      {
        title: "Dispatch timing",
        body: [
          "Before 2pm AEST on business days → same-day priority when stock is verified. After cut-off / weekends / public holidays → next business day.",
        ],
      },
      {
        title: "Delivery estimates",
        body: [
          "Typically 1–3 business days after dispatch; remote areas may take longer. Tracking provided.",
        ],
      },
      {
        title: "Packaging",
        body: [
          "Protected vials; plain outer cartons; short express transit packing. Follow storage guidance on receipt.",
        ],
      },
      {
        title: "Failed delivery and address accuracy",
        body: [
          "Use a complete address and phone. Returned parcels: contact support to re-dispatch (extra postage may apply).",
        ],
      },
    ],
  },
  returns: {
    slug: "returns",
    metaTitle: "Returns Policy | Peptide Protocol Australia",
    metaDescription:
      "Returns and refunds policy for Peptide Protocol research materials in Australia. Contact support before returning any item.",
    headline: "Returns",
    body: [
      "Returns are limited. Arrange via support so batch integrity can be assessed.",
    ],
    sections: [
      {
        title: "Eligibility",
        body: [
          "Unopened, sealed items within 7 days if wrong item or damaged on arrival. Opened vials generally not returnable.",
        ],
      },
      {
        title: "Damaged in transit",
        body: [
          "Photo carton, packing, and vial; contact support within 48 hours for replacement/credit options.",
        ],
      },
      {
        title: "How to start a return",
        body: [
          "Email order number, product, and reason. Wait for authorisation before posting.",
        ],
      },
      {
        title: "Refunds",
        body: [
          "To original payment method after inspection. Postage non-refundable unless our error or accepted transit damage.",
        ],
      },
    ],
  },  terms: {
    slug: "terms",
    metaTitle: "Terms of Sale | Peptide Protocol Australia",
    metaDescription:
      "Terms of sale for Peptide Protocol research materials, including research-use acknowledgement, pricing, and Australian supply conditions.",
    headline: "Terms of sale",
    body: [
      "These terms govern purchases from Peptide Protocol. By placing an order you confirm you have read the Research Use Disclaimer and accept these terms.",
    ],
    sections: [
      {
        title: "Research use acknowledgement",
        body: [
          "All products are sold strictly for laboratory, assay development, and other controlled research applications. They are not medicines, supplements, cosmetics, or food. They are not for human or veterinary consumption or use. You confirm you are purchasing for lawful research purposes and that you will handle materials under appropriate laboratory controls.",
        ],
      },
      {
        title: "Eligibility",
        body: [
          "You confirm you are of legal age in Australia and authorised to purchase research materials on behalf of yourself or your organisation. We may decline or cancel orders that appear inconsistent with research-only supply.",
        ],
      },
      {
        title: "Pricing and payment",
        body: [
          "Prices are listed in Australian dollars (AUD) and may change without notice until an order is confirmed. Taxes and shipping, where applicable, are shown at checkout or on invoice. Orders are accepted when payment is confirmed and stock is verified.",
        ],
      },
      {
        title: "Title and risk",
        body: [
          "Risk in goods passes on delivery to the address you provide, or on collection if you arrange an alternative accepted method. Title passes on full payment.",
        ],
      },
      {
        title: "Limitation of liability",
        body: [
          "To the maximum extent permitted by Australian Consumer Law and other applicable law, Peptide Protocol is not liable for misuse of research materials, protocol outcomes, or consequential loss arising from research use. Nothing on this site constitutes advice for personal or clinical use.",
        ],
      },
      {
        title: "Changes",
        body: [
          "We may update these terms periodically. The version in force at the time of your order applies to that purchase.",
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    metaTitle: "Privacy Policy | Peptide Protocol Australia",
    metaDescription:
      "How Peptide Protocol collects, uses, and protects personal information for Australian customers under the Privacy Act 1988.",
    headline: "Privacy policy",
    body: [
      "Peptide Protocol respects your privacy. This policy explains how we handle personal information when you browse the site, contact support, or place an order.",
    ],
    sections: [
      {
        title: "Information we collect",
        body: [
          "We may collect your name, email address, phone number, shipping address, organisation details, order history, and correspondence. Technical data such as IP address and browser type may be collected through standard website analytics and security logs.",
        ],
      },
      {
        title: "How we use information",
        body: [
          "We use personal information to process orders, arrange shipping, respond to enquiries, provide COA documentation, improve site security, and meet legal obligations. We do not sell personal information.",
        ],
      },
      {
        title: "Storage and security",
        body: [
          "Information is stored using service providers appropriate for Australian e-commerce operations. We take reasonable steps to protect personal information from misuse, interference, loss, and unauthorised access.",
        ],
      },
      {
        title: "Disclosure",
        body: [
          "We may share information with payment processors, shipping carriers, and IT providers solely to fulfil orders and operate the business. We may disclose information where required by law.",
        ],
      },
      {
        title: "Access and correction",
        body: [
          "You may request access to, or correction of, your personal information by contacting support. We will respond in line with the Australian Privacy Principles.",
        ],
      },
      {
        title: "Contact",
        body: [
          "Privacy requests: support@peptideprotocolau.io",
        ],
      },
    ],
  },
  disclaimer: {
    slug: "disclaimer",
    metaTitle: "Research Use Disclaimer | Peptide Protocol Australia",
    metaDescription:
      "Peptide Protocol research use disclaimer: laboratory and in vitro use only. Not for human consumption. Not a medicine, supplement, or cosmetic.",
    headline: "Research use disclaimer",
    body: [
      "Read this disclaimer before browsing the catalogue or placing an order. It applies to every product sold by Peptide Protocol.",
    ],
    sections: [
      {
        title: "Intended use",
        body: [
          "All products are supplied strictly for laboratory research, assay development, analytical method work, and other controlled in vitro or research applications. They are research chemicals and reagents, not finished consumer goods.",
        ],
      },
      {
        title: "What these products are not",
        body: [
          "Products are not medicines, therapeutic goods, dietary supplements, cosmetics, or foods. They are not for human consumption. They are not for veterinary use, clinical administration, diagnostic procedures on humans, or any form of personal use.",
        ],
      },
      {
        title: "No medical or dosing content",
        body: [
          "Product pages provide chemical and research-handling information. They do not provide medical advice, treatment claims, dosing schedules, reconstitution instructions for personal use, or administration guidance. Do not interpret specifications as permission for human use.",
        ],
      },
      {
        title: "Buyer responsibility",
        body: [
          "Buyers are responsible for lawful purchase, storage, labelling, use, and disposal under applicable Australian laws and their organisation’s laboratory SOPs. By ordering, you confirm you understand and accept these conditions.",
        ],
      },
      {
        title: "Website accuracy",
        body: [
          "We aim for accurate catalogue information. Batch Certificates of Analysis prevail where they differ from general product copy. Contact support if you need clarification before ordering.",
        ],
      },
    ],
  },
  contact: {
    slug: "contact",
    metaTitle: "Contact Peptide Protocol | Research Support Australia",
    metaDescription:
      "Contact Peptide Protocol for COA requests, shipping questions, and research catalogue enquiries in Australia.",
    headline: "Contact",
    body: [
      "COA, shipping, or catalogue questions — include order number or product name.",
    ],
    sections: [
      {
        title: "Support email",
        body: ["support@peptideprotocolau.io"],
      },
      {
        title: "What to include",
        body: [
          "Name and organisation (if applicable).",
          "Order number for existing purchases.",
          "Product name and what you need.",
        ],
      },
      {
        title: "Response times",
        body: [
          "Aim: one business day (batch file retrieval may take longer).",
        ],
      },
      {
        title: "Social",
        body: ["@peptideprotocolau"],
      },
    ],
  },
  shop: {
    slug: "shop",
    metaTitle: "Shop Research Peptides Australia | Peptide Protocol",
    metaDescription:
      "Browse the full Peptide Protocol catalogue of research-grade peptides in Australia. Single vials and 10-vial kits. Documented purity. Research use only.",
    headline: "Research catalogue",
    body: [
      "Laboratory and in vitro research only. Check specs, storage notes, and the research use disclaimer before ordering.",
    ],
  },
};

export function getPage(slug: string): PageContent | undefined {
  return pages[slug];
}
