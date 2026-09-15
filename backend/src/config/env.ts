import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3001),
    OPENAI_API_KEY: z.string().optional(), // Post-MVP
});

export const env = envSchema.parse(process.env);
