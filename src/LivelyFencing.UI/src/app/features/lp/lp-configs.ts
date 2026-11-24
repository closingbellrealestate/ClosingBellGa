export interface LpFormField {
  key: 'name' | 'email' | 'phone' | 'message';
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

export interface LpProofItem {
  value: string;
  label: string;
}

export interface LpConfig {
  /** URL slug — `/lp/:slug`. */
  slug: string;
  /** Browser tab title. */
  pageTitle: string;
  /** Small label above the hero headline. */
  eyebrow: string;
  /** Big hero headline. */
  headline: string;
  /** Sub-headline paragraph. */
  subhead: string;
  /** Background hero image (full URL). */
  heroImage: string;
  /** Color overlay tint over the hero image. */
  heroOverlay?: string;
  /** Bullet list of benefits. */
  bullets: string[];
  /** Optional small proof strip. */
  proof?: LpProofItem[];
  /** Form heading. */
  formHeadline: string;
  /** Form sub-text. */
  formSubhead?: string;
  /** Which fields to show, in order. */
  formFields: LpFormField[];
  /** Primary CTA label. */
  ctaLabel: string;
  /** Small reassurance line under the CTA. */
  ctaReassurance?: string;
  /** Confirmation headline after submit. */
  thankYouHeadline: string;
  /** Confirmation body. */
  thankYouBody: string;
  /** Written to the lead's `Source` so campaigns are distinguishable in the CRM. */
  leadSource: string;
}

const STANDARD_FIELDS: LpFormField[] = [
  { key: 'name', label: 'Full name', type: 'text', placeholder: 'Jane Smith', required: true },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '(770) 555-0123' },
];

export const LP_CONFIGS: Record<string, LpConfig> = {
  listing: {
    slug: 'listing',
    pageTitle: 'Tour this home · Closing Bell Real Estate',
    eyebrow: 'Featured Listing',
    headline: 'Come see this home in person.',
    subhead:
      'Request a private, no-pressure showing with a local Closing Bell agent. We\u2019ll work around your schedule and answer every question about the home.',
    heroImage:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1800&q=70',
    heroOverlay: 'rgba(26, 58, 42, 0.55)',
    bullets: [
      'Private showing at a time that works for you',
      'Straight answers from a licensed Georgia agent',
      'Neighborhood, schools, and comps — all in one place',
    ],
    proof: [
      { value: 'Local', label: 'Georgia agents' },
      { value: '5\u2605', label: 'Client rated' },
      { value: 'Fast', label: 'Same-day replies' },
    ],
    formHeadline: 'Request a private showing',
    formSubhead: 'We respond within one business day.',
    formFields: [
      ...STANDARD_FIELDS,
      { key: 'message', label: 'Anything we should know?', type: 'textarea', placeholder: 'Preferred days/times, questions about the home\u2026' },
    ],
    ctaLabel: 'Schedule my showing',
    ctaReassurance: 'No spam \u00b7 No obligation \u00b7 Local agent',
    thankYouHeadline: 'You\u2019re all set \u2014 we\u2019ll be in touch.',
    thankYouBody:
      'A Closing Bell agent will reach out within one business day to schedule your showing. Talk soon!',
    leadSource: 'Ad Landing \u2014 Home Tour',
  },

  luxury: {
    slug: 'luxury',
    pageTitle: 'Luxury living in Georgia · Closing Bell Real Estate',
    eyebrow: 'Luxury Collection',
    headline: 'Experience luxury living in Georgia.',
    subhead:
      'Get a private tour of this exceptional property and a concierge-level buying experience from a Closing Bell luxury specialist.',
    heroImage:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1800&q=70',
    heroOverlay: 'rgba(26, 58, 42, 0.5)',
    bullets: [
      'Private, discreet showings on your schedule',
      'Concierge guidance from list to close',
      'Deep local insight on Georgia\u2019s premier neighborhoods',
    ],
    formHeadline: 'Request a private tour',
    formSubhead: 'Discreet and no-obligation.',
    formFields: [
      ...STANDARD_FIELDS,
      { key: 'message', label: 'What are you looking for?', type: 'textarea', placeholder: 'Timeline, must-haves, questions\u2026' },
    ],
    ctaLabel: 'Request my private tour',
    ctaReassurance: 'Discreet \u00b7 No obligation \u00b7 Luxury specialist',
    thankYouHeadline: 'Thank you \u2014 your request is in.',
    thankYouBody:
      'A Closing Bell luxury specialist will personally reach out within one business day to arrange your private tour.',
    leadSource: 'Ad Landing \u2014 Luxury',
  },

  land: {
    slug: 'land',
    pageTitle: 'Georgia land & acreage · Closing Bell Real Estate',
    eyebrow: 'Land & Acreage',
    headline: 'Find your piece of Georgia.',
    subhead:
      'From build-ready homesites to recreational acreage, get the details on this property and early access to new land listings from a Closing Bell agent.',
    heroImage:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=70',
    heroOverlay: 'rgba(26, 58, 42, 0.5)',
    bullets: [
      'Walk the land with an agent who knows the area',
      'Straight answers on zoning, utilities, and access',
      'Early alerts on new land listings before they hit the big sites',
    ],
    formHeadline: 'Get the details + land alerts',
    formSubhead: 'Tell us what you\u2019re looking for.',
    formFields: [
      ...STANDARD_FIELDS,
      { key: 'message', label: 'What kind of land?', type: 'textarea', placeholder: 'Acres, county, intended use (build, recreation, investment)\u2026' },
    ],
    ctaLabel: 'Send me the details',
    ctaReassurance: 'No spam \u00b7 No obligation \u00b7 Local agent',
    thankYouHeadline: 'Thanks \u2014 we\u2019ll be in touch.',
    thankYouBody:
      'A Closing Bell agent will email you within one business day with the details and any matching land listings.',
    leadSource: 'Ad Landing \u2014 Land',
  },
};

/** Used when a slug is unknown — falls back to the general home-tour page. */
export const LP_FALLBACK: LpConfig = LP_CONFIGS['listing'];
