import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message is too long"),
});

export const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type === "application/pdf", "Only PDF files are allowed")
    .refine((file) => file.size <= 50000000, "File size must be less than 50MB"),
});

export const apiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  apiKey: z.string().min(1, "API key is required").refine((key) => {
    if (key.startsWith("sk-") || key.startsWith("ant-") || key.startsWith("ai-")) {
      return true;
    }
    return false;
  }, "Invalid API key format"),
});