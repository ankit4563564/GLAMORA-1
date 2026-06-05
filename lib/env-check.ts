import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  SEED_SECRET: z.string().optional(),
});

export const env = envSchema.safeParse(process.env);

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    // In production, we might want to throw an error, but for hackathon demo, 
    // we'll just log and continue to allow fallback modes.
    if (process.env.NODE_ENV === "production") {
       // throw new Error("Critical environment variables missing");
    }
  } else {
    console.log("✅ Environment variables validated");
  }
}
