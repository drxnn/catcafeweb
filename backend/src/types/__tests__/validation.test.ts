import { matchRequestSchema, validTags } from '../index';

describe('matchRequestSchema', () => {
    it('should accept a valid request with all 8 tags', () => {
        const input = {
            tags: ['active', 'social', 'affectionate', 'playful', 'young', 'low_groom', 'vocal', 'good_with_kids_pets'],
        };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.tags).toHaveLength(8);
        }
    });

    it('should accept a valid request with 1 tag (minimum)', () => {
        const input = { tags: ['active'] };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.tags).toEqual(['active']);
        }
    });

    it('should reject an empty tags array', () => {
        const input = { tags: [] };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('should reject more than 8 tags', () => {
        const input = {
            tags: [
                'active', 'mellow', 'social', 'shy',
                'affectionate', 'independent', 'playful', 'low_play',
                'young', // 9th tag - over limit
            ],
        };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('should reject invalid tag values', () => {
        const input = { tags: ['invalid_tag'] };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('should reject when tags is not an array', () => {
        const input = { tags: 'active' };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('should reject when tags is missing', () => {
        const input = {};
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('should reject when body is null', () => {
        const result = matchRequestSchema.safeParse(null);
        expect(result.success).toBe(false);
    });

    it('should reject mixed valid and invalid tags', () => {
        const input = { tags: ['active', 'not_a_real_tag'] };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('should accept each valid tag individually', () => {
        for (const tag of validTags) {
            const result = matchRequestSchema.safeParse({ tags: [tag] });
            expect(result.success).toBe(true);
        }
    });

    it('should accept exactly 8 tags (maximum)', () => {
        const input = {
            tags: ['active', 'social', 'affectionate', 'playful', 'young', 'low_groom', 'vocal', 'good_with_kids_pets'],
        };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it('should provide flatten-able error on invalid input', () => {
        const input = { tags: ['invalid'] };
        const result = matchRequestSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            const flattened = result.error.flatten();
            expect(flattened).toBeDefined();
            expect(flattened.fieldErrors).toBeDefined();
        }
    });
});
