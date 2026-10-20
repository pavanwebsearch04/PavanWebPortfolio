// Live websites shown on the Home page's Selected Work section AND on the
// /projects archive. This file is the single source of truth for both:
//   - `featured` + `sortOrder` decide which projects the Home page shows and in
//     what order (at most MAX_FEATURED, the first five-to-seven by sortOrder);
//   - /projects lists every entry, ordered by `sortOrder`.
//
// Every entry points at a real, publicly visitable site. Copy was written
// after inspecting each homepage (its title, navigation, hero and sections) —
// no invented clients, awards, statistics or results.
//
// Thumbnails are genuine 1440x900 homepage captures stored in
// /public/projects/. Re-capture a file there whenever a site's hero changes.
// An entry without `image` renders a typographic placeholder, never a stock photo.
//
// `technologies` lists only what the live site's public markup confirms (e.g. a
// WordPress generator tag). `contribution` is left out until it is confirmed.

export interface WebsiteImage {
  src: string;
  alt: string;
  /** CSS object-position, used when a card's frame crops the screenshot. */
  position: string;
}

/** Filter groupings on /projects. Only groups that have projects are shown. */
export type ProjectGroup =
  | "Hospitality & Travel"
  | "Business & Industry"
  | "Property & Professional"
  | "Retail & Local Services";

export interface WebsiteProject {
  /** stable, unique identifier — also the React key and the web-node id */
  slug: string;
  title: string;
  /** specific sector label shown on the card */
  category: string;
  /** broader grouping used by the /projects filters */
  group: ProjectGroup;
  description: string;
  /** exact destination of the card */
  url: string;
  /** visible hostname shown in the card's address bar */
  host: string;
  /** genuine homepage capture; omit until one exists */
  image?: WebsiteImage;
  /** only what the live site's markup confirms */
  technologies?: string[];
  /** my role on the project — set only once confirmed */
  contribution?: string;
  /** shown in the Home page's selection */
  featured: boolean;
  /** position within the Home selection (1 = first); falls back to sortOrder */
  featuredOrder?: number;
  /** position in every listing (1 = first); also the visible project number */
  sortOrder: number;
  status: "live";
}

/** The Home page shows at most this many featured projects. */
export const MAX_FEATURED = 7;

const projectList: WebsiteProject[] = [
  {
    slug: "independent-estate-agents",
    title: "Independent Estate Agents",
    category: "Real Estate & Valuation",
    group: "Property & Professional",
    description:
      "An Irish estate agency and valuation website, with property listings and a map view, a home valuation request and an overview of the firm's sales, lettings and valuation services.",
    url: "https://independentestateagents.ie/wp/",
    host: "independentestateagents.ie/wp",
    image: {
      src: "/projects/independent-estate-agents.webp",
      alt: "Homepage of Independent Estate Agents & Valuers: an ivy-covered stone manor behind the headline “Where Accurate Valuation Meets Smart Selling”, with the Danny Byrne logo, navigation and a Search button",
      position: "50% 50%",
    },
    technologies: ["WordPress", "Elementor"],
    featured: true,
    featuredOrder: 7,
    sortOrder: 1,
    status: "live",
  },
  {
    slug: "aravali-nature-camp-jawai",
    title: "Aravali Nature Camp Jawai",
    category: "Hospitality & Nature Retreats",
    group: "Hospitality & Travel",
    description: "A nature-led digital experience inspired by the rugged beauty of Jawai.",
    url: "http://aravalinaturecampjawai.com",
    host: "aravalinaturecampjawai.com",
    image: {
      src: "/projects/aravali-nature-camp-jawai.webp",
      alt: "Homepage of Aravali Nature Camp Jawai: a leopard resting on a mossy log behind the headline “Aravali Nature Camp, Jawai” and a Plan Your Stay button",
      position: "30% 50%",
    },
    featured: true,
    featuredOrder: 2,
    sortOrder: 2,
    status: "live",
  },
  {
    slug: "sspl-textile",
    title: "SSPL Textile",
    category: "Textile Manufacturing",
    group: "Business & Industry",
    description:
      "A professional showcase for a cotton fabric manufacturer, covering weaves, raw materials, sustainability and certifications.",
    url: "https://sspltextile.com/",
    host: "sspltextile.com",
    image: {
      src: "/projects/sspl-textile.webp",
      alt: "Homepage of SSPL Textile: blurred weaving machinery behind the headline “Premium Cotton Fabric Manufacturer in India”, with the company logo and navigation",
      position: "20% 50%",
    },
    featured: true,
    featuredOrder: 3,
    sortOrder: 3,
    status: "live",
  },
  {
    slug: "cleshar",
    title: "Cleshar",
    category: "Rail Engineering & Infrastructure",
    group: "Business & Industry",
    description:
      "A corporate website for a UK rail engineering contractor, organising a wide range of services — from track and civils to power, signalling and telecoms — alongside projects, training, careers and news.",
    url: "https://cleshar.co.uk/",
    host: "cleshar.co.uk",
    image: {
      src: "/projects/cleshar.webp",
      alt: "Homepage of Cleshar: a blurred railway platform and curving track at sunset behind the headline “On track to deliver change”, with the Cleshar logo and navigation",
      position: "50% 50%",
    },
    featured: false,
    sortOrder: 5,
    status: "live",
  },
  {
    slug: "probate-valuations-dublin",
    title: "Probate Valuations Dublin",
    category: "Property Valuation Services",
    group: "Property & Professional",
    description:
      "A single-purpose service site for probate and inheritance-tax property valuations, built around a clear fixed-price offer, a four-step process and online ordering.",
    url: "https://probate.technoprofiles.com/",
    host: "probate.technoprofiles.com",
    image: {
      src: "/projects/probate-valuation-dublin.webp",
      alt: "Homepage of the Probate Valuations Dublin site: an aerial view of Dublin city behind the headline “Probate Valuation Dublin — Solicitor & Revenue Ready Property Reports”, with an Order Probate Valuation button",
      position: "50% 50%",
    },
    technologies: ["WordPress", "Elementor"],
    featured: false,
    sortOrder: 6,
    status: "live",
  },
  {
    slug: "sun-industry",
    title: "Sun Industry",
    category: "Furniture Retail",
    group: "Retail & Local Services",
    description:
      "A storefront-style catalogue for Sun Furniture Industry, organised by room and furniture type, with search and wishlist.",
    url: "https://sunindustry.co.in/",
    host: "sunindustry.co.in",
    image: {
      src: "/projects/sun-industry.webp",
      alt: "Homepage of Sun Furniture Industry: a store header with product search and furniture category menu above a dining furniture set banner and sofa-cum-bed and study-table promotions",
      position: "50% 30%",
    },
    technologies: ["WordPress", "WooCommerce", "Elementor"],
    featured: false,
    sortOrder: 7,
    status: "live",
  },
  {
    slug: "matrix-design",
    title: "Matrix Design",
    category: "Design & Creative Services",
    group: "Business & Industry",
    description:
      "A bold, type-led presentation for a Udaipur creative studio spanning graphic design, printing, publicity and web.",
    url: "https://matrixdesign.in/",
    host: "matrixdesign.in",
    image: {
      src: "/projects/matrix-design.webp",
      alt: "Homepage of Matrix Design: the headline “we design brands that stand out & sell.” on a white background beside a column of service labels",
      position: "20% 50%",
    },
    featured: true,
    featuredOrder: 4,
    sortOrder: 8,
    status: "live",
  },
  {
    slug: "holidays-to-rajasthan",
    title: "Holidays to Rajasthan",
    category: "Rajasthan Tourism",
    group: "Hospitality & Travel",
    description:
      "A tour-package website covering heritage circuits, desert safaris, palace stays and wildlife tours, with an enquiry form in the hero.",
    url: "https://holidaystorajasthan.com/",
    host: "holidaystorajasthan.com",
    image: {
      src: "/projects/holidays-to-rajasthan.webp",
      alt: "Homepage of Holidays to Rajasthan: a lakeside Udaipur palace at dusk under the title “Rajasthan Heritage Tour”, with a tour enquiry form",
      position: "50% 50%",
    },
    featured: false,
    sortOrder: 9,
    status: "live",
  },
  {
    slug: "ashu-bagh-resort",
    title: "Ashu Bagh Resort",
    category: "Resort Hospitality",
    group: "Hospitality & Travel",
    description:
      "A contemporary retreat in Jawai, presented through warm architectural imagery and a clear path to booking a stay.",
    url: "https://seoudaipur.com/websites/ashu-bagh-resort/",
    host: "seoudaipur.com/websites/ashu-bagh-resort",
    image: {
      src: "/projects/ashu-bagh-resort.webp",
      alt: "Homepage of Ashu Bagh Resort: a sunlit timber-pergola courtyard in Jawai beneath the title “Ashu Bagh”, with a Book Your Stay button",
      position: "30% 50%",
    },
    featured: true,
    sortOrder: 10,
    featuredOrder: 6,
    status: "live",
  },
  {
    slug: "book-my-events-decoration",
    title: "Book My Events Decoration",
    category: "Events & Decoration",
    group: "Retail & Local Services",
    description:
      "A vibrant, booking-led site for balloon and event decoration in Bengaluru, with WhatsApp enquiry built in.",
    url: "https://bookmyeventsdecoration.com/",
    host: "bookmyeventsdecoration.com",
    image: {
      src: "/projects/book-my-events-decoration.webp",
      alt: "Homepage of Book My Event Decoration: a purple balloon-arch ballroom behind the headline “Transform Every Celebration Into an Unforgettable Memory”",
      position: "50% 50%",
    },
    featured: false,
    sortOrder: 11,
    status: "live",
  },
  {
    slug: "india-dream",
    title: "India Dream",
    category: "Travel & Experiences",
    group: "Hospitality & Travel",
    description:
      "A French-language travel site for tailor-made journeys across India, from Rajasthan to Kerala, led by a local guide.",
    url: "https://seoudaipur.com/websites/india-dream/",
    host: "seoudaipur.com/websites/india-dream",
    image: {
      src: "/projects/india-dream.webp",
      alt: "Homepage of India Dream, in French: the Hawa Mahal facade in Jaipur behind the headline “Votre Inde. Votre histoire.”",
      position: "20% 50%",
    },
    featured: true,
    featuredOrder: 1,
    sortOrder: 4,
    status: "live",
  },
  {
    slug: "ayurveda",
    title: "Sun Ayurveda & Naturopathy",
    category: "Ayurveda & Wellness Centre",
    group: "Hospitality & Travel",
    description:
      "A holistic wellness centre site in the foothills of Mount Abu, presenting Ayurveda, Panchakarma, naturopathy, yoga and meditation programmes with a consultation booking call to action.",
    url: "https://seoudaipur.com/websites/ayurveda/",
    host: "seoudaipur.com/websites/ayurveda",
    image: {
      src: "/projects/ayurveda.webp",
      alt: "Homepage of Sun Ayurveda & Naturopathy: an aerial view of the wellness centre in the foothills of Mount Abu behind the headline “Ayurveda and Naturopathy Centre in India”",
      position: "50% 30%",
    },
    featured: true,
    featuredOrder: 5,
    sortOrder: 13,
    status: "live",
  },
  {
    // No screenshot yet: webeyez.com sits behind a bot-verification challenge
    // that automated capture can't pass. Add public/projects/webeyez.webp
    // (1440x900) and an `image` entry to replace the placeholder.
    slug: "webeyez",
    title: "Webeyez",
    category: "eCommerce Analytics Platform",
    group: "Business & Industry",
    description:
      "A marketing website for an eCommerce analytics platform that detects friction in online funnels, presenting its features, integrations, success stories and a free-trial call to action.",
    url: "https://webeyez.com/",
    host: "webeyez.com",
    technologies: ["WordPress", "Elementor"],
    featured: false,
    sortOrder: 12,
    status: "live",
  },
];

// Guard against duplicate records: the slug is the identity.
const seen = new Set<string>();
for (const p of projectList) {
  if (seen.has(p.slug)) throw new Error(`Duplicate project slug: ${p.slug}`);
  seen.add(p.slug);
}

/** Every project, in display order. */
export const websites: WebsiteProject[] = [...projectList].sort((a, b) => a.sortOrder - b.sortOrder);

/** The Home page selection: featured projects in display order, capped. */
export const featuredWebsites: WebsiteProject[] = websites
  .filter((w) => w.featured)
  .sort((a, b) => (a.featuredOrder ?? a.sortOrder) - (b.featuredOrder ?? b.sortOrder))
  .slice(0, MAX_FEATURED);

// ---- /projects filters -------------------------------------------------

export interface ProjectFilter {
  id: string;
  label: string;
  count: number;
  test: (site: WebsiteProject) => boolean;
}

const GROUP_ORDER: ProjectGroup[] = [
  "Hospitality & Travel",
  "Business & Industry",
  "Property & Professional",
  "Retail & Local Services",
];

const candidateFilters: Omit<ProjectFilter, "count">[] = [
  { id: "all", label: "All Projects", test: () => true },
  { id: "wordpress", label: "WordPress", test: (w) => !!w.technologies?.includes("WordPress") },
  ...GROUP_ORDER.map((group) => ({
    id: group.toLowerCase().replace(/[^a-z]+/g, "-"),
    label: group,
    test: (w: WebsiteProject) => w.group === group,
  })),
];

/** Filters with their real counts; categories with no projects are dropped. */
export const projectFilters: ProjectFilter[] = candidateFilters
  .map((f) => ({ ...f, count: websites.filter(f.test).length }))
  .filter((f) => f.count > 0);
