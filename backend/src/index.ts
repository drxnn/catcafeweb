import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import matchRouter from './routes/match';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', matchRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
});

export { app };
