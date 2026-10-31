// Traffic sources for analytics and share links. Keep in sync with track_visit() in migration 004.

export const SOURCES = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
  { id: "facebook", label: "Facebook" },
  { id: "pinterest", label: "Pinterest" },
  { id: "snapchat", label: "Snapchat" },
  { id: "threads", label: "Threads" },
  { id: "linktree", label: "Link in bio" },
  { id: "email", label: "Email" },
  { id: "google", label: "Google" },
  { id: "direct", label: "Direct" },
  { id: "other", label: "Other sites" }
] as const;

export type SourceId = (typeof SOURCES)[number]["id"];

export function sourceLabel(id: string) {
  return SOURCES.find(source => source.id === id)?.label ?? "Other sites";
}

const REFERRERS: [RegExp, SourceId][] = [
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(instagram\.com|ig\.me)$/, "instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "x"],
  [/(^|\.)(facebook\.com|fb\.me|fb\.com|messenger\.com)$/, "facebook"],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, "pinterest"],
  [/(^|\.)snapchat\.com$/, "snapchat"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/(^|\.)(linktr\.ee|beacons\.ai|stan\.store|lnk\.bio|campsite\.bio)$/, "linktree"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/, "email"]
];

/** Where a visit came from: an explicit ?src= / ?utm_source= wins, otherwise the referring site. */
export function detectSource(search: string, referrer: string, ownHost: string): SourceId {
  const params = new URLSearchParams(search);
  const tagged = (params.get("src") ?? params.get("utm_source") ?? "").toLowerCase().trim();
  if (tagged) {
    if (tagged === "ig") return "instagram";
    if (tagged === "twitter") return "x";
    if (tagged === "bio" || tagged === "linkinbio") return "linktree";
    return (SOURCES.find(source => source.id === tagged)?.id ?? "other") as SourceId;
  }

  if (!referrer) return "direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (host === ownHost) return "direct";

  // Email webmail first: "mail.google.com" also matches the Google pattern.
  const email = REFERRERS.find(([pattern, id]) => id === "email" && pattern.test(host));
  if (email) return "email";
  return REFERRERS.find(([pattern]) => pattern.test(host))?.[1] ?? "other";
}
