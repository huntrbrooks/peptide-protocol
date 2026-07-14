import type { PageContent } from "./types";

export const pages: Record<string, PageContent> = {
  about: {
    slug: "about",
    metaTitle: "About Peptide Protocol | Research Peptides Australia",
    metaDescription:
      "Learn how Peptide Protocol supplies research-grade peptides to Australian laboratories with batch documentation and clear research-only terms.",
    headline: "About Peptide Protocol",
    body: [
      "Peptide Protocol is an Australian research materials supplier focused on lyophilised peptides, related compounds, and reconstitution solvents for laboratory use.",
      "We built the catalogue around documentation, transit integrity, and plain language. Research buyers need specifications they can file, packing that protects vials, and terms that do not blur research supply with consumer wellness.",
    ],
    sections: [
      {
        title: "What we prioritise",
        body: [
          "Identity and purity documentation for verified lots.",
          "Clear product labelling for inventory control.",
          "Discreet outer packaging with tracked Australia Post express where available.",
          "Support replies grounded in batch notes and shipping facts.",
        ],
      },
      {
        title: "What we do not do",
        body: [
          "We do not present research materials as medicines, supplements, or cosmetics.",
          "We do not publish dosing, administration, or personal-use guidance.",
          "We do not use urgency tactics or wellness marketing around research inventory.",
        ],
      },
      {
        title: "Australian focus",
        body: [
          "Orders are processed for Australian research customers with local packing and clear dispatch cut-offs on business days. If you need a Certificate of Analysis or shipping clarification before ordering, contact support.",
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
      "Research materials only earn a place in laboratory inventory when identity and purity can be documented. Peptide Protocol treats Certificates of Analysis as part of the product, not an afterthought.",
    ],
    sections: [
      {
        title: "Analytical approach",
        body: [
          "Listed peptide lots are assessed for identity and purity using reverse-phase high-performance liquid chromatography (RP-HPLC) as the primary method. Where third-party laboratory verification is listed for a batch, that documentation can be requested for your records.",
        ],
        bullets: [
          "Purity target of ≥99.0% on COA-validated peptide lots unless a batch note states otherwise",
          "Identity confirmation against expected chromatographic profiles",
          "Batch-linked documentation available on request for verified lots",
        ],
      },
      {
        title: "How to request a COA",
        body: [
          "Email support with your order number or the product and batch details you need. We respond with the Certificate of Analysis for verified lots, or confirm if documentation is still pending for a new receipt.",
        ],
      },
      {
        title: "Packing and labelling",
        body: [
          "Vials are packed with protective materials to reduce transit breakage. Labels are written for research inventory control. Outer cartons remain plain and do not advertise product names.",
        ],
      },
      {
        title: "Limits of documentation",
        body: [
          "A Certificate of Analysis describes the tested lot under stated methods. It does not authorise human use, veterinary use, or any application outside controlled research. Always confirm parameters on the COA for the specific batch you receive.",
        ],
      },
    ],
  },
  faq: {
    slug: "faq",
    metaTitle: "FAQ | Peptide Protocol Research Peptides Australia",
    metaDescription:
      "Answers on research-only terms, shipping, COAs, packaging, and ordering research peptides from Peptide Protocol in Australia.",
    headline: "Frequently asked questions",
    body: [
      "Short answers to the questions research buyers ask most often. For batch-specific documentation, contact support with your product or order details.",
    ],
    faqs: [
      {
        question: "Are these products for human use?",
        answer:
          "No. All Peptide Protocol products are for laboratory and in vitro research only. They are not for human consumption, veterinary use, diagnostic procedures, or consumer applications.",
      },
      {
        question: "Do you provide Certificates of Analysis?",
        answer:
          "Yes. For verified lots, COAs are available on request. Email support with the product name and order or batch reference.",
      },
      {
        question: "Where do you ship?",
        answer:
          "We focus on Australian delivery via tracked Australia Post express where available. Contact support before ordering if you need clarification on destination coverage.",
      },
      {
        question: "When do you dispatch?",
        answer:
          "Orders placed before 2pm AEST on business days are prioritised for same-day dispatch when stock is confirmed.",
      },
      {
        question: "Is packaging discreet?",
        answer:
          "Yes. Outer cartons use plain labelling without product descriptors.",
      },
      {
        question: "Can I get bacteriostatic water with my order?",
        answer:
          "Bacteriostatic Water is listed in the catalogue. Qualifying catalogue orders may include a promotional vial where stated at checkout. Confirm current promotions before purchase.",
      },
      {
        question: "How do returns work?",
        answer:
          "See the Returns page for eligibility. Unopened research materials may be considered under stated conditions. Contact support before returning any item.",
      },
      {
        question: "Is checkout live?",
        answer:
          "Catalogue prices are shown in AUD. Cart and enquiry flows may be staged during launch. Use Contact if you need a formal purchase enquiry.",
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
      "Clear transit expectations matter as much as clear specifications. Peptide Protocol packs locally and uses tracked Australia Post express services where available.",
    ],
    sections: [
      {
        title: "Dispatch timing",
        body: [
          "Orders confirmed before 2pm AEST on business days are prioritised for same-day dispatch when stock is verified. Orders after the cut-off or on weekends and public holidays are processed on the next business day.",
        ],
      },
      {
        title: "Delivery estimates",
        body: [
          "Once dispatched, Australia Post express typically delivers within 1 to 3 business days depending on destination. Remote locations may take longer. Tracking is provided after dispatch.",
        ],
      },
      {
        title: "Packaging",
        body: [
          "Vials are protected with inner packing. Outer cartons are plain and do not list product names. Temperature-sensitive handling follows packing procedures designed for short Australian express transit. Follow storage guidance on receipt.",
        ],
      },
      {
        title: "Failed delivery and address accuracy",
        body: [
          "Provide a complete delivery address and contact number. If a parcel is returned due to an incorrect address or failed collection, contact support to arrange re-dispatch. Additional postage may apply.",
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
      "Research materials are specialised inventory. Returns are limited and must be arranged through support so batch integrity and cold-chain risks can be assessed.",
    ],
    sections: [
      {
        title: "Eligibility",
        body: [
          "Unopened products in original sealed condition may be considered for return within 7 days of delivery if the item was dispatched in error or arrived damaged. Opened vials are generally not eligible for return because research materials cannot be restocked once seals are broken.",
        ],
      },
      {
        title: "Damaged in transit",
        body: [
          "Photograph the outer carton, inner packing, and affected vial, then contact support within 48 hours of delivery. We will advise next steps, including replacement or credit where appropriate.",
        ],
      },
      {
        title: "How to start a return",
        body: [
          "Email support with your order number, product name, and reason for return. Do not post items back until you receive a return authorisation and instructions.",
        ],
      },
      {
        title: "Refunds",
        body: [
          "Approved refunds are processed to the original payment method after the returned item is inspected. Postage is non-refundable unless the return results from our error or transit damage we accept responsibility for.",
        ],
      },
    ],
  },
  terms: {
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
      "Need a Certificate of Analysis, shipping clarification, or a catalogue enquiry? Send a clear message with your order number or product name where relevant.",
    ],
    sections: [
      {
        title: "Support email",
        body: ["support@peptideprotocolau.io"],
      },
      {
        title: "What to include",
        body: [
          "Your name and organisation (if applicable).",
          "Order number for existing purchases.",
          "Product name and the documentation or question you need answered.",
        ],
      },
      {
        title: "Response times",
        body: [
          "We aim to reply within one business day. Complex documentation requests may take longer if batch files need retrieval.",
        ],
      },
      {
        title: "Social",
        body: [
          "Instagram and TikTok: @peptideprotocolau",
        ],
      },
    ],
  },
  shop: {
    slug: "shop",
    metaTitle: "Shop Research Peptides Australia | Peptide Protocol",
    metaDescription:
      "Browse the full Peptide Protocol catalogue of research-grade peptides and solvents in Australia. Documented purity. Research use only.",
    headline: "Research catalogue",
    body: [
      "All listed materials are for laboratory and in vitro research only. Review specifications, storage notes, and the research use disclaimer before ordering.",
    ],
  },
};

export function getPage(slug: string): PageContent | undefined {
  return pages[slug];
}
