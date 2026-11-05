// Writes supabase/templates/*.html from src/lib/auth-email-templates.ts, so the files you paste into
// Supabase always match the site's own emails. Run with: npm run email:templates
import { writeFileSync } from "node:fs";
import { registerHooks } from "node:module";

// The app's imports leave off ".ts" (Next.js adds it); Node needs it spelled out.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && !specifier.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  }
});

const { AUTH_EMAILS } = await import("../src/lib/auth-email-templates.ts");

for (const email of AUTH_EMAILS) {
  const file = new URL(`../supabase/templates/${email.file}`, import.meta.url);
  writeFileSync(file, `${email.html}\n`);
  console.log(`supabase/templates/${email.file}  (Supabase: ${email.template}, subject "${email.subject}")`);
}
