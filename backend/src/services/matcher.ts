import { pool } from '../db/pool';

export interface CatMatch {
    id: number;
    name: string;
    description: string;
    keywords: string[];
    adoptionUrl: string;
    imageUrl: string | null;
    matchScore: number;
}

export async function findMatches(userTags: string[]): Promise<CatMatch[]> {
    // Query: count how many of the user's tags overlap with each cat's keywords
    // Return top 3 by overlap count, breaking ties by most recently scraped
    const result = await pool.query<CatMatch>(
        `SELECT
            id,
            name,
            description,
            keywords,
            adoption_url AS "adoptionUrl",
            image_url AS "imageUrl",
            (
                SELECT COUNT(*)::int FROM unnest(keywords) AS k WHERE k = ANY($1::text[])
            ) AS "matchScore"
         FROM cats
         WHERE active = TRUE
         ORDER BY "matchScore" DESC, scraped_at DESC
         LIMIT 3`,
        [userTags]
    );

    return result.rows;
}
