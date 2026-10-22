export type Store = {
  slug: string;
  ownerId: string | null;
  name: string;
  short: string;
  category: string;
  description: string;
  headline: string;
  headlineEm: string;
  bio: string;
  image: string;
  label: string;
  background: string;
  featuredProductId: string | null;
  revenueShare: number;
  isDemo: boolean;
  published: boolean;
};

export type Product = {
  id: string;
  store: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  priceLabel: string;
  badge: string;
  image: string;
  gallery: string[];
  theme: string;
  layout: "split" | "center";
  cta: string;
  features: string[];
  faqs: [string, string][];
};

export type Order = {
  id: string;
  storeSlug: string;
  productId: string | null;
  productName: string;
  amount: number;
  creatorAmount: number;
  status: "completed" | "refunded";
  createdAt: string;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  socialHandle: string;
  role: "creator" | "admin";
  suspended: boolean;
};

export type Application = {
  id: string;
  name: string;
  email: string;
  socialProfile: string;
  followers: string;
  niche: string;
  message: string;
  status: "new" | "reviewing" | "accepted" | "declined";
  createdAt: string;
};
