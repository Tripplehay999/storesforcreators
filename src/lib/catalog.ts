import { money } from "./format";
import type { Product, Store } from "./types";

export const IMAGES = {
  jasmine: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&h=1100&fit=crop&crop=faces",
  sofia: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1000&h=1100&fit=crop",
  nia: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1000&h=1100&fit=crop&crop=faces",
  food: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&h=850&fit=crop",
  study: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&h=850&fit=crop",
  coaching: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000&h=850&fit=crop",
  budget: "/templates/student-money-planner.png",
  complete: "/templates/complete-budget-planner.png"
};

export function safeColor(value: unknown, fallback = "#eee3f0") {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
}

export function safeImage(value: unknown) {
  const image = String(value || "").trim();

  if (/^https:\/\//i.test(image)) {
    return image;
  }

  if (/^\/templates\/[a-z0-9_().-]+\.(png|jpg|jpeg|webp)$/i.test(image) && !image.includes("..")) {
    return image;
  }

  return "";
}

export function slugify(value: unknown, max = 80) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

export function newProductId() {
  return "product-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

export function normalizeProduct(product: Partial<Product> & Record<string, unknown>): Product {
  return {
    id: slugify(product.id) || "new-product",
    store: slugify(product.store, 40),
    name: String(product.name || "New product").slice(0, 120),
    category: String(product.category || "DIGITAL PRODUCT").slice(0, 100),
    tagline: String(product.tagline || "").slice(0, 250),
    description: String(product.description || "").slice(0, 3000),
    price: Math.max(0, Math.min(9999, Number(product.price) || 0)),
    priceLabel: String(product.priceLabel || "").slice(0, 100),
    badge: String(product.badge || "").slice(0, 100),
    image: safeImage(product.image),
    gallery: Array.isArray(product.gallery)
      ? product.gallery.map(safeImage).filter(Boolean).slice(0, 8)
      : [],
    theme: safeColor(product.theme),
    layout: product.layout === "center" ? "center" : "split",
    cta: String(product.cta || "Explore product").slice(0, 100),
    features: Array.isArray(product.features)
      ? product.features.map(String).slice(0, 25)
      : [],
    faqs: Array.isArray(product.faqs)
      ? product.faqs
          .filter(Array.isArray)
          .map(pair => [String(pair[0] || ""), String(pair[1] || "")] as [string, string])
          .slice(0, 15)
      : []
  };
}

export function productPrice(product: Product) {
  return product.priceLabel || money(product.price) + " USD";
}

export function productImage(product: Product) {
  return safeImage(product.image) || IMAGES.budget;
}

export function productLink(product: Product, creator?: string | null) {
  return `/product/${encodeURIComponent(product.id)}` +
    (creator ? `?creator=${encodeURIComponent(creator)}` : "");
}

// ── Database row mapping ─────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

export function rowToProduct(row: any): Product {
  return normalizeProduct({
    id: row.id,
    store: row.store_slug,
    name: row.name,
    category: row.category,
    tagline: row.tagline,
    description: row.description,
    price: Number(row.price),
    priceLabel: row.price_label,
    badge: row.badge,
    image: row.image,
    gallery: row.gallery,
    theme: row.theme,
    layout: row.layout,
    cta: row.cta,
    features: row.features,
    faqs: row.faqs
  });
}

export function productToRow(product: Product) {
  return {
    id: product.id,
    store_slug: product.store,
    name: product.name,
    category: product.category,
    tagline: product.tagline,
    description: product.description,
    price: product.price,
    price_label: product.priceLabel,
    badge: product.badge,
    image: product.image,
    gallery: product.gallery,
    theme: product.theme,
    layout: product.layout,
    cta: product.cta,
    features: product.features,
    faqs: product.faqs
  };
}

export function rowToStore(row: any): Store {
  return {
    slug: row.slug,
    ownerId: row.owner_id ?? null,
    name: row.name,
    short: row.short,
    category: row.category,
    description: row.description,
    headline: row.headline,
    headlineEm: row.headline_em,
    bio: row.bio,
    image: safeImage(row.image),
    label: row.label,
    background: safeColor(row.background, "#f6eaf1"),
    featuredProductId: row.featured_product_id ?? null,
    revenueShare: Number(row.revenue_share ?? 50),
    isDemo: Boolean(row.is_demo),
    published: row.published !== false
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Seed data ────────────────────────────────────────────────
// Mirrors supabase/migrations/001_initial.sql. Used to render the public
// site before Supabase is configured.

export const seedStores: Store[] = [
  {
    slug: "jasmine",
    ownerId: null,
    name: "Jasmine's Financials",
    short: "jasmine's financials.",
    category: "FINANCE / MONEY TIPS",
    description: "Budgeting, money management, and everyday financial confidence.",
    headline: "Your money.",
    headlineEm: "Your way.",
    bio: "Budget planners and money tools designed to help you feel more confident with your finances.",
    image: IMAGES.jasmine,
    label: "MONEY TIPS",
    background: "#f6eaf1",
    featuredProductId: "budget",
    revenueShare: 50,
    isDemo: true,
    published: true
  },
  {
    slug: "sofia",
    ownerId: null,
    name: "Sofia's Fit Life",
    short: "sofia. fit",
    category: "FITNESS / WELLNESS",
    description: "Fitness routines, meal preparation, and healthy habits.",
    headline: "Feel good.",
    headlineEm: "Feel stronger.",
    bio: "Meal preparation and fitness tools for building routines that fit your life.",
    image: IMAGES.sofia,
    label: "FITNESS & MEALS",
    background: "#eef4eb",
    featuredProductId: "fitness",
    revenueShare: 50,
    isDemo: true,
    published: true
  },
  {
    slug: "nia",
    ownerId: null,
    name: "Notes by Nia",
    short: "notes by nia.",
    category: "STUDY GUIDES / PLANNING",
    description: "Study guides, academic planning, and better organization.",
    headline: "Study smarter.",
    headlineEm: "Dream bigger.",
    bio: "Study planning and academic organization tools made for busy students.",
    image: IMAGES.nia,
    label: "📖 STUDY EDIT",
    background: "#f0eaf7",
    featuredProductId: "study",
    revenueShare: 50,
    isDemo: true,
    published: true
  }
];

export const seedProducts: Product[] = [
  {
    id: "budget",
    store: "jasmine",
    name: "Budget Planner Collection",
    category: "PERSONAL FINANCE",
    tagline: "Choose a budget planner that works for you.",
    description:
      "Beautiful digital budgeting templates designed to organize income, spending, savings goals, and financial planning. Choose from different planner options to fit your lifestyle.",
    price: 19,
    priceLabel: "$19–$59 USD",
    badge: "DIGITAL BUDGET TEMPLATES",
    image: IMAGES.budget,
    gallery: [IMAGES.complete],
    theme: "#f0e0ed",
    layout: "split",
    cta: "Explore budget planners",
    features: [
      "Monthly income and expense tracking",
      "Budget categories and spending summaries",
      "Savings goals and financial planning",
      "Visual charts and dashboards",
      "Student and complete planner options"
    ],
    faqs: [
      ["Is this a physical product?", "No. This example collection contains digital budget planners."],
      ["Are there different planner options?", "Yes. The collection can offer different planner versions at different prices."]
    ]
  },
  {
    id: "coaching",
    store: "jasmine",
    name: "1:1 Financial Coaching",
    category: "FINANCIAL COACHING",
    tagline: "Personalized support for your money goals.",
    description:
      "An illustrative one-on-one financial coaching offering focused on budgeting habits, savings organization, and practical money planning. Actual availability, qualifications, and service scope must be confirmed before booking.",
    price: 105,
    priceLabel: "$105 USD / hour",
    badge: "PERSONALIZED SUPPORT",
    image: IMAGES.coaching,
    gallery: [],
    theme: "#eadcea",
    layout: "split",
    cta: "Explore coaching",
    features: [
      "One-on-one budgeting conversation",
      "Personal money goal planning",
      "Spending and savings organization",
      "Illustrative 60-minute session"
    ],
    faqs: [
      ["Can I book right now?", "Not through this demonstration. Live booking and payment are not connected."],
      ["Is this regulated financial advice?", "No regulated advice is represented by this sample. A real provider must operate within their qualifications and applicable rules."]
    ]
  },
  {
    id: "fitness",
    store: "sofia",
    name: "Fitness & Meal Prep Planner",
    category: "FITNESS / WELLNESS",
    tagline: "Plan your meals. Love your routine.",
    description:
      "A digital meal preparation and fitness planning concept featuring weekly meal schedules, grocery lists, workouts, and healthy habit tracking.",
    price: 29,
    priceLabel: "From $29 USD",
    badge: "MEAL PREP & FITNESS",
    image: IMAGES.food,
    gallery: [],
    theme: "#e4efdf",
    layout: "split",
    cta: "Explore meal planner",
    features: [
      "Weekly meal preparation planner",
      "Grocery list organization",
      "Workout schedule",
      "Habit tracking",
      "Weekly progress pages"
    ],
    faqs: [
      ["Is this a personalized nutrition program?", "No. This is a general digital planning concept, not individualized medical or nutrition advice."]
    ]
  },
  {
    id: "study",
    store: "nia",
    name: "Study Guides & Planning",
    category: "STUDY / PRODUCTIVITY",
    tagline: "Less chaos. More clarity.",
    description:
      "Digital study guides and academic planning resources to help organize assignments, deadlines, study sessions, and exam preparation.",
    price: 19,
    priceLabel: "From $19 USD",
    badge: "STUDY SMARTER",
    image: IMAGES.study,
    gallery: [],
    theme: "#ece3f3",
    layout: "split",
    cta: "Explore study guides",
    features: [
      "Assignment and deadline tracking",
      "Weekly study planning",
      "Exam preparation schedules",
      "Study guide templates",
      "Academic organization"
    ],
    faqs: []
  }
];
