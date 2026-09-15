import { z } from 'zod';

export const validTags = [
    'active', 'mellow',
    'social', 'shy',
    'affectionate', 'independent',
    'playful', 'low_play',
    'young', 'adult',
    'high_groom', 'low_groom',
    'vocal', 'quiet',
    'good_with_kids_pets', 'calm_home',
] as const;

export type Tag = typeof validTags[number];

export const matchRequestSchema = z.object({
    tags: z.array(z.enum(validTags)).min(1).max(8),
});

export type MatchRequest = z.infer<typeof matchRequestSchema>;
