import type { MetadataRoute } from "next";

// Lets creators add the hub to their phone's home screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stores for Creators",
    short_name: "Creator Hub",
    description: "Run your creator store: products, sales and payouts in one place.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8f2",
    theme_color: "#1c1722",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
