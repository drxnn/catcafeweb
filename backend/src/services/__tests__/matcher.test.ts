import { CatMatch } from '../matcher';

// Mock the pg pool — must use jest.fn() INSIDE the factory to avoid hoisting issues
const mockQuery = jest.fn();
jest.mock('../../db/pool', () => {
    return {
        __esModule: true,
        pool: {
            get query() {
                return mockQuery;
            },
        },
    };
});

// Must import after mock setup
import { findMatches } from '../matcher';

describe('findMatches', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });

    it('should return matched cats sorted by matchScore descending', async () => {
        const mockCats: CatMatch[] = [
            {
                id: 1,
                name: 'Whiskers',
                description: 'An energetic and playful kitten',
                keywords: ['active', 'playful', 'young'],
                adoptionUrl: 'https://bkcatcafe.com/cats/whiskers',
                imageUrl: 'https://bkcatcafe.com/images/whiskers.jpg',
                matchScore: 3,
            },
            {
                id: 2,
                name: 'Shadow',
                description: 'A calm and independent adult cat',
                keywords: ['mellow', 'independent', 'adult'],
                adoptionUrl: 'https://bkcatcafe.com/cats/shadow',
                imageUrl: null,
                matchScore: 2,
            },
            {
                id: 3,
                name: 'Mittens',
                description: 'A shy but affectionate cat',
                keywords: ['shy', 'affectionate'],
                adoptionUrl: 'https://bkcatcafe.com/cats/mittens',
                imageUrl: 'https://bkcatcafe.com/images/mittens.jpg',
                matchScore: 1,
            },
        ];

        mockQuery.mockResolvedValueOnce({ rows: mockCats, command: '', rowCount: 3, oid: 0, fields: [] });

        const result = await findMatches(['active', 'playful', 'young', 'social']);

        expect(result).toHaveLength(3);
        expect(result[0].name).toBe('Whiskers');
        expect(result[0].matchScore).toBe(3);
        expect(result[1].name).toBe('Shadow');
        expect(result[2].name).toBe('Mittens');
    });

    it('should pass userTags to the query', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] });

        const tags = ['active', 'social', 'playful'];
        await findMatches(tags);

        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            [tags]
        );
    });

    it('should return an empty array when no cats match', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] });

        const result = await findMatches(['vocal', 'shy']);

        expect(result).toEqual([]);
    });

    it('should return at most 3 cats (LIMIT 3 in query)', async () => {
        const mockCats: CatMatch[] = [
            {
                id: 1, name: 'Cat1', description: 'desc', keywords: ['active'],
                adoptionUrl: 'url1', imageUrl: null, matchScore: 3,
            },
            {
                id: 2, name: 'Cat2', description: 'desc', keywords: ['social'],
                adoptionUrl: 'url2', imageUrl: null, matchScore: 2,
            },
            {
                id: 3, name: 'Cat3', description: 'desc', keywords: ['playful'],
                adoptionUrl: 'url3', imageUrl: null, matchScore: 1,
            },
        ];

        mockQuery.mockResolvedValueOnce({ rows: mockCats, command: '', rowCount: 3, oid: 0, fields: [] });

        const result = await findMatches(['active', 'social', 'playful']);

        expect(result).toHaveLength(3);
        // Verify the SQL contains LIMIT 3
        const queryCall = mockQuery.mock.calls[0][0] as string;
        expect(queryCall).toContain('LIMIT 3');
    });

    it('should only query active cats', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] });

        await findMatches(['active']);

        const queryCall = mockQuery.mock.calls[0][0] as string;
        expect(queryCall).toContain('active = TRUE');
    });

    it('should handle database errors gracefully', async () => {
        mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

        await expect(findMatches(['active'])).rejects.toThrow('Connection refused');
    });
});
