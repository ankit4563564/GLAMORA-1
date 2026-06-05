import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  ENABLE_SEED: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const missing = err.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`❌ Invalid environment variables: ${missing}`);
    }
    throw err;
  }
}
