import { Router, Request, Response } from 'express';
import { matchRequestSchema } from '../types';
import { findMatches } from '../services/matcher';

const router = Router();

router.post('/match', async (req: Request, res: Response) => {
    const parsed = matchRequestSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const matches = await findMatches(parsed.data.tags);
    res.json({ matches });
});

export default router;
