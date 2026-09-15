import express from 'express';
import request from 'supertest';
import matchRouter from '../match';

// Mock the matcher service
jest.mock('../../services/matcher', () => ({
    findMatches: jest.fn(),
}));

// Mock the env/pool chain so imports don't fail
jest.mock('../../config/env', () => ({
    env: {
        DATABASE_URL: 'postgresql://localhost/test',
        PORT: 3001,
    },
}));

jest.mock('../../db/pool', () => ({
    pool: {
        query: jest.fn(),
    },
}));

import { findMatches } from '../../services/matcher';

const mockFindMatches = findMatches as jest.MockedFunction<typeof findMatches>;

// Create a minimal Express app for testing
function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api', matchRouter);
    return app;
}

describe('POST /api/match', () => {
    let app: express.Express;

    beforeAll(() => {
        app = createTestApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 with matches for valid tags', async () => {
        const mockMatches = [
            {
                id: 1,
                name: 'Whiskers',
                description: 'A playful kitten',
                keywords: ['active', 'playful', 'young'],
                adoptionUrl: 'https://bkcatcafe.com/cats/whiskers',
                imageUrl: 'https://bkcatcafe.com/images/whiskers.jpg',
                matchScore: 3,
            },
        ];

        mockFindMatches.mockResolvedValueOnce(mockMatches);

        const response = await request(app)
            .post('/api/match')
            .send({ tags: ['active', 'playful', 'young'] })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual({ matches: mockMatches });
        expect(mockFindMatches).toHaveBeenCalledWith(['active', 'playful', 'young']);
    });

    it('should return 400 for empty tags array', async () => {
        const response = await request(app)
            .post('/api/match')
            .send({ tags: [] })
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(mockFindMatches).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid tag values', async () => {
        const response = await request(app)
            .post('/api/match')
            .send({ tags: ['not_a_valid_tag'] })
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(mockFindMatches).not.toHaveBeenCalled();
    });

    it('should return 400 when tags is missing', async () => {
        const response = await request(app)
            .post('/api/match')
            .send({})
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(mockFindMatches).not.toHaveBeenCalled();
    });

    it('should return 400 when tags is not an array', async () => {
        const response = await request(app)
            .post('/api/match')
            .send({ tags: 'active' })
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(mockFindMatches).not.toHaveBeenCalled();
    });

    it('should return 400 when more than 8 tags are provided', async () => {
        const response = await request(app)
            .post('/api/match')
            .send({
                tags: [
                    'active', 'mellow', 'social', 'shy',
                    'affectionate', 'independent', 'playful', 'low_play',
                    'young', // 9th tag
                ],
            })
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(mockFindMatches).not.toHaveBeenCalled();
    });

    it('should accept all 8 valid tags at once', async () => {
        mockFindMatches.mockResolvedValueOnce([]);

        await request(app)
            .post('/api/match')
            .send({
                tags: ['active', 'social', 'affectionate', 'playful', 'young', 'low_groom', 'vocal', 'good_with_kids_pets'],
            })
            .expect(200);

        expect(mockFindMatches).toHaveBeenCalledTimes(1);
    });

    it('should return 400 with flattened error format', async () => {
        const response = await request(app)
            .post('/api/match')
            .send({ tags: ['invalid'] })
            .expect(400);

        expect(response.body.error).toHaveProperty('fieldErrors');
        expect(response.body.error).toHaveProperty('formErrors');
    });

    it('should return empty matches array when no cats match', async () => {
        mockFindMatches.mockResolvedValueOnce([]);

        const response = await request(app)
            .post('/api/match')
            .send({ tags: ['vocal'] })
            .expect(200);

        expect(response.body).toEqual({ matches: [] });
    });
});
