// Line icons for the creator hub (24×24, 1.75 stroke). Paths only, so they inherit currentColor.
const PATHS = {
  overview: [
    "M4 3h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
    "M15 3h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
    "M15 12h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z",
    "M4 16h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z"
  ],
  wallet: [
    "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2",
    "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"
  ],
  box: [
    "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    "M3.3 7 12 12l8.7-5",
    "M12 22V12"
  ],
  store: [
    "M3 9.5 4.6 4.2A1.7 1.7 0 0 1 6.2 3h11.6a1.7 1.7 0 0 1 1.6 1.2L21 9.5",
    "M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0",
    "M5 12.4V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.6",
    "M10 21v-5h4v5"
  ],
  external: ["M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
  plus: ["M5 12h14", "M12 5v14"],
  up: ["m22 7-8.5 8.5-5-5L2 17", "M16 7h6v6"],
  down: ["m22 17-8.5-8.5-5 5L2 7", "M16 17h6v-6"],
  check: ["M20 6 9 17l-5-5"],
  right: ["m9 18 6-6-6-6"],
  left: ["m15 18-6-6 6-6"],
  chevron: ["m6 9 6 6 6-6"],
  copy: [
    "M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z",
    "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"
  ],
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  eye: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M9 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    "m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"
  ],
  receipt: [
    "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z",
    "M8 8h8",
    "M8 12h8",
    "M8 16h5"
  ],
  key: ["M15.5 7.5 19 4", "m21 2-2 2 3 3-3.5 3.5-3-3", "M10.6 11.4a5 5 0 1 0 2 2l.9-.9"]
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name].map(d => <path key={d} d={d} />)}
    </svg>
  );
}
