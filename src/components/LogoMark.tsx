// The Stores for Creators mark: a smiling shopping bag with a "new sale" dot, on a rounded tile.
// Colours come from CSS variables so the mark can flip on dark backgrounds:
//   --logo-tile (default ink) and --logo-bag (default lime).
// Keep the geometry in sync with src/app/icon.svg and the generated PNG icons.

export const LOGO_PATHS = {
  handle: "M25 26 C25 16 39 16 39 26",
  body: "M16.5 24 H47.5 a3 3 0 0 1 3 3.2 L49 49.5 a4 4 0 0 1 -4 3.8 H19 a4 4 0 0 1 -4 -3.8 L13.5 27.2 a3 3 0 0 1 3 -3.2 Z",
  smile: "M24 37 Q32 45 40 37",
  tilt: "rotate(-8 32 36)"
};

export default function LogoMark({ size = 40, title }: { size?: number; title?: string }) {
  const tile = "var(--logo-tile, #1c1722)";
  const bag = "var(--logo-bag, #d4f57a)";

  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="64" height="64" rx="15" fill={tile} />
      <g transform={LOGO_PATHS.tilt}>
        <path d={LOGO_PATHS.handle} fill="none" stroke={bag} strokeWidth="5" strokeLinecap="round" />
        <path d={LOGO_PATHS.body} fill={bag} />
        <path d={LOGO_PATHS.smile} fill="none" stroke={tile} strokeWidth="4.5" strokeLinecap="round" />
      </g>
      <circle cx="49" cy="15" r="6.5" fill="#ff8fc8" stroke={tile} strokeWidth="3" />
    </svg>
  );
}
