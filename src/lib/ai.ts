import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

// AI ideas for creators, powered by Claude. Off until ANTHROPIC_API_KEY is set.
// Only aggregated store numbers are sent: no customer emails or other personal data.

export const AI_MODEL = "claude-opus-5-5";

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const RecommendationsSchema = z.object({
  headline: z.string().describe("One sentence naming this store's biggest opportunity right now."),
  recommendations: z.array(z.object({
    category: z.enum(["pricing", "products", "promotion", "storefront", "conversion"]),
    title: z.string().describe("A short, specific action title, under 70 characters."),
    why: z.string().describe("Why, citing this store's own numbers. One or two sentences."),
    action: z.string().describe("Exactly what to do this week, in one or two sentences."),
    impact: z.enum(["high", "medium", "low"]),
    page: z.enum(["products", "storefront", "promote", "analytics", "earnings", "none"])
      .describe("The hub page where the creator would act on this.")
  }))
});

export type Recommendations = z.infer<typeof RecommendationsSchema>;

export const CaptionsSchema = z.object({
  captions: z.array(z.object({
    platform: z.enum(["tiktok", "instagram", "x", "youtube", "email"]),
    hook: z.string().describe("The opening line that stops the scroll."),
    caption: z.string().describe("The full post text, ready to paste, including the hook. No link placeholder."),
    hashtags: z.array(z.string()).describe("3 to 6 relevant hashtags without the # sign. Empty for email.")
  }))
});

export type Captions = z.infer<typeof CaptionsSchema>;

const ADVISOR_SYSTEM = `You are the growth advisor inside Stores for Creators, a platform that builds and runs online stores \
for social media creators who sell digital products (planners, templates, guides, presets) and services (coaching).

You receive one creator's store data as JSON and return 3 to 5 recommendations, most valuable first.

Rules:
- Ground every recommendation in the data given. Quote the actual numbers (orders, visits, conversion, prices, sources).
- Never invent sales, reviews, testimonials, follower counts or results, and never promise earnings.
- Only suggest things the creator can do with what they have: edit products (name, price, description, images,
  features, FAQs, the downloadable file), edit the storefront (headline, bio, photo, colours, visibility),
  create percent-off discount codes, share tracked links per platform, and post about their products.
- If the store is new or has little data, focus on setup gaps and getting the first sales, and say so plainly.
- Prices: be specific (for example "$24 instead of $19") and explain the reasoning.
- No medical, legal or regulated financial advice. Write in plain, warm, second-person language. No emojis, no jargon.`;

const CAPTIONS_SYSTEM = `You write social posts for a creator promoting one of their own products on Stores for Creators.

Write one post per requested platform, in the creator's voice: first person, natural, specific to the product.
Platform norms: TikTok and Instagram are short and punchy with a strong hook; X is under 260 characters;
YouTube is a community post; email is a short friendly note with a subject-style hook.
Never invent results, reviews, discounts or claims that aren't in the product data. If a discount code is
provided you may mention it exactly as given. Don't include URLs; the creator adds their link. No emojis
unless the platform is TikTok or Instagram, and then at most two.`;

export class AiError extends Error {}

function client() {
  // Fits inside the dashboard's 120-second server limit, with one retry for transient failures.
  return new Anthropic({ timeout: 100_000, maxRetries: 1 });
}

async function run<T>(schema: z.ZodType<T>, system: string, content: string): Promise<T> {
  try {
    const response = await client().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      // If the model declines for policy reasons, the API retries on its recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content }]
    });

    if (response.stop_reason === "refusal") {
      throw new AiError("We couldn't generate ideas for this request. Try rewording your question.");
    }
    if (!response.parsed_output) {
      throw new AiError("The AI reply came back incomplete. Please try again.");
    }
    return response.parsed_output;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof Anthropic.RateLimitError) throw new AiError("Lots of people are asking for ideas right now. Try again in a minute.");
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      console.error("[ai] check ANTHROPIC_API_KEY:", error.message);
      throw new AiError("AI ideas aren't set up correctly yet. The site owner needs to check the API key.");
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("[ai] bad request:", error.message);
      throw new AiError("Something went wrong generating ideas. Please try again.");
    }
    if (error instanceof Anthropic.APIConnectionError) throw new AiError("Couldn't reach the AI service. Check your connection and try again.");
    if (error instanceof Anthropic.APIError) {
      console.error(`[ai] API error ${error.status}:`, error.message);
      throw new AiError("The AI service had a problem. Please try again in a moment.");
    }
    throw error;
  }
}

/** 3-5 data-backed recommendations for a store. `context` is the store's aggregated numbers. */
export function recommend(context: unknown, focus: string) {
  const ask = focus
    ? `The creator asked specifically: "${focus.slice(0, 300)}". Make sure your recommendations answer that.`
    : "Recommend what would grow this store most right now.";
  return run(RecommendationsSchema, ADVISOR_SYSTEM, `${ask}\n\nStore data:\n${JSON.stringify(context, null, 2)}`);
}

/** Ready-to-post captions for one product on the given platforms. */
export function writeCaptions(product: unknown, platforms: string[]) {
  return run(
    CaptionsSchema,
    CAPTIONS_SYSTEM,
    `Write one post for each of these platforms: ${platforms.join(", ")}.\n\nProduct:\n${JSON.stringify(product, null, 2)}`
  );
}
