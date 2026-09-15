# Cat Cafe Matching App — Implementation Guide

> A step-by-step guide for a Claude agent (or sub-agents) to build the full-stack cat-to-owner matching application.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Phase 0 — Project Scaffolding](#3-phase-0--project-scaffolding)
4. [Phase 1 — Database Setup](#4-phase-1--database-setup)
5. [Phase 2 — Scraper Service](#5-phase-2--scraper-service)
6. [Phase 3 — Matching Engine (MVP)](#6-phase-3--matching-engine-mvp)
7. [Phase 4 — Backend API](#7-phase-4--backend-api)
8. [Phase 5 — Frontend](#8-phase-5--frontend)
9. [Phase 6 — Integration & Testing](#9-phase-6--integration--testing)
10. [Phase 7 — AI Vector Matching (Post-MVP)](#10-phase-7--ai-vector-matching-post-mvp)
11. [File Tree Reference](#11-file-tree-reference)
12. [Sub-Agent Delegation Strategy](#12-sub-agent-delegation-strategy)

---

## 1. Project Overview

**Problem:** Too many cats in NYC shelters; friction in the adoption process.
**Solution:** A web app that asks users 8 personality-matching questions, runs a keyword-based match against scraped cat profiles from Brooklyn Cat Cafe (`bkcatcafe.com`), and returns the top 3 matches with links to each cat's adoption page.

### MVP Scope (No AI)

- Scrape cat profiles → extract keyword tags
- User answers 8 questions → produces 8 tags
- Match by counting overlapping tags
- Return top 3 cats with description + adoption link

### Post-MVP

- Replace keyword matching with OpenAI vector embeddings + pgvector cosine similarity

---

## 2. Architecture Summary

```
┌─────────────┐       POST /api/match        ┌─────────────────┐
│   Frontend   │ ──────────────────────────── │    Backend API   │
│  Vite+React  │ <─── JSON: top 3 cats ───── │  Express + TS    │
│  TypeScript  │                              │                  │
└─────────────┘                               │  ┌─────────────┐│
                                              │  │  Scraper     ││
                                              │  │  (Playwright)││
                                              │  └──────┬──────┘│
                                              │         │        │
                                              │  ┌──────▼──────┐│
                                              │  │  PostgreSQL  ││
                                              │  │  (pg + pgvec)││
                                              │  └─────────────┘│
                                              └─────────────────┘
```

**Tech Stack:**

| Layer    | Tech                                                      |
| -------- | --------------------------------------------------------- |
| Frontend | Vite, React 18+, TypeScript, bulletproof-react structure  |
| Backend  | Express 5, TypeScript, Zod, node-postgres (pg)            |
| Scraper  | Playwright                                                |
| Database | PostgreSQL 15+ with pgvector extension                    |
| AI (later)| OpenAI API (`text-embedding-3-small`)                    |

---

## 3. Phase 0 — Project Scaffolding

### Agent Task: Set up both projects with proper config files.

### 0A — Backend Setup

```
Working directory: /backend
```

1. **Initialize TypeScript project:**
   - Install dev dependencies: `typescript`, `ts-node`, `@types/node`, `@types/express`, `nodemon`
   - Install runtime dependencies: `express`, `pg`, `zod`, `cors`, `dotenv`
   - Install `@types/cors` as devDependency
   - Create `tsconfig.json`:
     ```json
     {
       "compilerOptions": {
         "target": "ES2022",
         "module": "commonjs",
         "lib": ["ES2022"],
         "outDir": "./dist",
         "rootDir": "./src",
         "strict": true,
         "esModuleInterop": true,
         "skipLibCheck": true,
         "forceConsistentCasingInFileNames": true,
         "resolveJsonModule": true,
         "declaration": true,
         "declarationMap": true,
         "sourceMap": true
       },
       "include": ["src/**/*"],
       "exclude": ["node_modules", "dist"]
     }
     ```
   - Update `package.json` scripts:
     ```json
     {
       "scripts": {
         "dev": "nodemon --exec ts-node src/index.ts",
         "build": "tsc",
         "start": "node dist/index.js",
         "scrape": "ts-node src/scraper/scrape.ts"
       }
     }
     ```

2. **Create directory structure:**
   ```
   backend/src/
   ├── index.ts                 # Express app entry point
   ├── config/
   │   └── env.ts               # Environment variable loading + Zod validation
   ├── db/
   │   ├── pool.ts              # pg Pool singleton
   │   ├── schema.sql            # Table definitions
   │   └── migrate.ts           # Run schema.sql against the database
   ├── scraper/
   │   ├── scrape.ts            # Playwright scraping logic
   │   └── keywords.ts          # Keyword extraction from cat descriptions
   ├── routes/
   │   └── match.ts             # POST /api/match route
   ├── services/
   │   └── matcher.ts           # Matching algorithm (keyword count → top 3)
   └── types/
       └── index.ts             # Shared TypeScript types/interfaces
   ```

3. **Create `.env.example`:**
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/catcafe
   PORT=3001
   OPENAI_API_KEY=sk-...  # Post-MVP
   ```

4. **Create `.gitignore`** in backend root (if not exists):
   ```
   node_modules/
   dist/
   .env
   ```

### 0B — Frontend Setup

```
Working directory: /frontend
```

1. **Scaffold with Vite:**
   ```bash
   npm create vite@latest . -- --template react-ts
   ```
   (Use `.` to scaffold in the existing `frontend/` directory.)

2. **Install additional dependencies:**
   - `axios` (HTTP client)

3. **Restructure to bulletproof-react pattern:**
   ```
   frontend/src/
   ├── app/
   │   ├── App.tsx               # Root component with router
   │   └── main.tsx              # Vite entry point (ReactDOM.render)
   ├── components/
   │   └── ui/                   # Reusable UI primitives (Button, Card, ProgressBar)
   ├── features/
   │   ├── questionnaire/
   │   │   ├── components/       # QuestionCard, QuestionnaireForm, ProgressIndicator
   │   │   ├── types.ts          # Question, Answer, Tag types
   │   │   └── api.ts            # POST /api/match call
   │   └── results/
   │       ├── components/       # CatCard, ResultsList
   │       └── types.ts          # CatMatch type
   ├── assets/                   # Static images, icons
   └── styles/                   # Global CSS / theme
   ```

---

## 4. Phase 1 — Database Setup

### Agent Task: Create the PostgreSQL schema and connection pool.

### 1A — Schema (`backend/src/db/schema.sql`)

```sql
-- Enable pgvector extension (needed for post-MVP)
CREATE EXTENSION IF NOT EXISTS vector;

-- Cats table
CREATE TABLE IF NOT EXISTS cats (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    keywords        TEXT[] NOT NULL DEFAULT '{}',
    adoption_url    TEXT NOT NULL,
    image_url       TEXT,
    -- Post-MVP: embedding column
    -- embedding    vector(1536),
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for keyword matching (GIN index on array)
CREATE INDEX IF NOT EXISTS idx_cats_keywords ON cats USING GIN (keywords);

-- Unique constraint to avoid duplicate cats
CREATE UNIQUE INDEX IF NOT EXISTS idx_cats_name ON cats (name);
```

**Key decisions:**
- `keywords` is a `TEXT[]` (Postgres array) — enables `&&` (overlap) and array containment operators for fast matching.
- `active` flag lets us soft-delete cats that are no longer on the site.
- `name` is unique to avoid inserting the same cat twice on re-scrape.
- `embedding` column is commented out for MVP; uncomment for post-MVP.

### 1B — Connection Pool (`backend/src/db/pool.ts`)

```typescript
import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
});
```

### 1C — Migration Script (`backend/src/db/migrate.ts`)

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './pool';

async function migrate() {
    const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(sql);
    console.log('Migration complete');
    await pool.end();
}

migrate().catch(console.error);
```

Add script to `package.json`: `"migrate": "ts-node src/db/migrate.ts"`

### 1D — Environment Config (`backend/src/config/env.ts`)

```typescript
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3001),
    OPENAI_API_KEY: z.string().optional(), // Post-MVP
});

export const env = envSchema.parse(process.env);
```

---

## 5. Phase 2 — Scraper Service

### Agent Task: Build the Playwright scraper that extracts cat profiles from bkcatcafe.com.

### 2A — Install Playwright

```bash
cd backend && npm install playwright
```

### 2B — Scraper Logic (`backend/src/scraper/scrape.ts`)

**Important:** Before writing the scraper, the agent MUST first manually inspect `https://www.bkcatcafe.com` to understand the actual DOM structure. The steps below are a guide — the actual selectors will depend on what the site looks like.

**Scraper flow:**

1. Launch headless Chromium via Playwright.
2. Navigate to the adoptable cats page (likely `https://www.bkcatcafe.com/adoptable-cats` or similar — **agent must discover the correct URL**).
3. Wait for cat profile elements to load.
4. For each cat card/profile on the page:
   - Extract: `name`, `description` (bio text), `image_url`, `adoption_url` (link to individual cat page).
   - If individual cat pages have more detail, navigate to each one.
5. Pass each cat's description through the keyword extractor.
6. Upsert into the `cats` table (INSERT ON CONFLICT on `name` → UPDATE description, keywords, scraped_at, set active = true).
7. Mark any cats NOT found in this scrape as `active = false`.
8. Close browser.

**Pseudo-code structure:**

```typescript
import { chromium } from 'playwright';
import { pool } from '../db/pool';
import { extractKeywords } from './keywords';

interface ScrapedCat {
    name: string;
    description: string;
    imageUrl: string | null;
    adoptionUrl: string;
}

export async function scrapeCats(): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 1. Navigate to adoptable cats page
    await page.goto('https://www.bkcatcafe.com/adoptable-cats');
    // TODO: agent must inspect actual page and set correct URL + selectors

    // 2. Extract cat data
    const cats: ScrapedCat[] = []; // ... fill by querying DOM

    // 3. For each cat, extract keywords and upsert
    const scrapedNames: string[] = [];
    for (const cat of cats) {
        const keywords = extractKeywords(cat.description);
        scrapedNames.push(cat.name);
        await pool.query(
            `INSERT INTO cats (name, description, keywords, adoption_url, image_url, scraped_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description,
                keywords = EXCLUDED.keywords,
                adoption_url = EXCLUDED.adoption_url,
                image_url = EXCLUDED.image_url,
                scraped_at = NOW(),
                active = TRUE`,
            [cat.name, cat.description, keywords, cat.adoptionUrl, cat.imageUrl]
        );
    }

    // 4. Deactivate cats no longer on site
    if (scrapedNames.length > 0) {
        await pool.query(
            `UPDATE cats SET active = FALSE WHERE name != ALL($1::text[])`,
            [scrapedNames]
        );
    }

    await browser.close();
}
```

### 2C — Keyword Extraction (`backend/src/scraper/keywords.ts`)

Map each cat's description text to the 8 tags used in the questionnaire. This is a rule-based keyword extractor.

```typescript
type Tag =
    | 'active' | 'mellow'
    | 'social' | 'shy'
    | 'affectionate' | 'independent'
    | 'playful' | 'low_play'
    | 'young' | 'adult'
    | 'high_groom' | 'low_groom'
    | 'vocal' | 'quiet'
    | 'good_with_kids_pets' | 'calm_home';

interface KeywordRule {
    tag: Tag;
    patterns: RegExp[];
}

const rules: KeywordRule[] = [
    { tag: 'active',    patterns: [/energetic/i, /active/i, /loves to run/i, /zoomies/i, /high.?energy/i] },
    { tag: 'mellow',    patterns: [/calm/i, /relaxed/i, /mellow/i, /laid.?back/i, /chill/i, /easy.?going/i] },
    { tag: 'social',    patterns: [/social/i, /friendly/i, /loves people/i, /outgoing/i, /greet/i] },
    { tag: 'shy',       patterns: [/shy/i, /timid/i, /reserved/i, /takes time to warm/i, /nervous/i] },
    { tag: 'affectionate', patterns: [/affectionate/i, /cuddly/i, /lap cat/i, /loves to snuggle/i, /purr/i, /cuddle/i] },
    { tag: 'independent', patterns: [/independent/i, /does (his|her|their) own thing/i, /aloof/i, /self.?sufficient/i] },
    { tag: 'playful',  patterns: [/playful/i, /loves toys/i, /play/i, /feather/i, /chase/i] },
    { tag: 'low_play',  patterns: [/couch potato/i, /prefers watching/i, /not much into play/i, /observer/i] },
    { tag: 'young',     patterns: [/kitten/i, /young/i, /\b\d\s*months?\b/i, /baby/i, /under (1|2|one|two) year/i] },
    { tag: 'adult',     patterns: [/adult/i, /senior/i, /mature/i, /\b[3-9]\s*years?\b/i, /\b1\d\s*years?\b/i] },
    { tag: 'high_groom', patterns: [/long.?hair/i, /fluffy/i, /requires grooming/i, /persian/i, /maine coon/i] },
    { tag: 'low_groom', patterns: [/short.?hair/i, /low.?maintenance/i, /easy coat/i] },
    { tag: 'vocal',     patterns: [/vocal/i, /talkative/i, /meow/i, /chatty/i, /loves to talk/i] },
    { tag: 'quiet',     patterns: [/quiet/i, /silent/i, /not very vocal/i] },
    { tag: 'good_with_kids_pets', patterns: [/good with (kids|children|dogs|other cats|pets)/i, /family.?friendly/i, /gets along/i, /tolerant/i] },
    { tag: 'calm_home', patterns: [/prefers quiet/i, /single.?cat/i, /no (kids|children|dogs)/i, /calm environment/i, /only pet/i] },
];

export function extractKeywords(description: string): Tag[] {
    const tags: Tag[] = [];
    for (const rule of rules) {
        if (rule.patterns.some(p => p.test(description))) {
            tags.push(rule.tag);
        }
    }
    return tags;
}
```

**Important notes for the agent:**
- The regex patterns above are a starting point. After the first scrape, the agent should **read the actual cat descriptions** from the database and refine patterns that missed obvious matches.
- Some cats may get zero tags — that's OK for MVP. Log a warning for manual review.

---

## 6. Phase 3 — Matching Engine (MVP)

### Agent Task: Build the keyword-overlap matching algorithm.

### File: `backend/src/services/matcher.ts`

```typescript
import { pool } from '../db/pool';

interface CatMatch {
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
            array_length(
                ARRAY(SELECT unnest(keywords) INTERSECT SELECT unnest($1::text[])),
                1
            ) AS "matchScore"
         FROM cats
         WHERE active = TRUE
         ORDER BY "matchScore" DESC NULLS LAST, scraped_at DESC
         LIMIT 3`,
        [userTags]
    );

    return result.rows;
}
```

**Alternative simpler query if the above is too complex for pg:**

```sql
SELECT *, (
    SELECT COUNT(*) FROM unnest(keywords) AS k WHERE k = ANY($1::text[])
) AS match_score
FROM cats
WHERE active = TRUE
ORDER BY match_score DESC, scraped_at DESC
LIMIT 3;
```

---

## 7. Phase 4 — Backend API

### Agent Task: Wire up Express routes and request validation.

### 4A — Types (`backend/src/types/index.ts`)

```typescript
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
```

### 4B — Match Route (`backend/src/routes/match.ts`)

```typescript
import { Router, Request, Response } from 'express';
import { matchRequestSchema } from '../types';
import { findMatches } from '../services/matcher';

const router = Router();

router.post('/match', async (req: Request, res: Response) => {
    const parsed = matchRequestSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const matches = await findMatches(parsed.data.tags);
    return res.json({ matches });
});

export default router;
```

### 4C — Express Entry Point (`backend/src/index.ts`)

```typescript
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
```

---

## 8. Phase 5 — Frontend

### Agent Task: Build the questionnaire UI and results display.

### 5A — Questionnaire Data (`frontend/src/features/questionnaire/types.ts`)

```typescript
export interface QuestionOption {
    label: string;
    tag: string;
}

export interface Question {
    id: number;
    title: string;
    optionA: QuestionOption;
    optionB: QuestionOption;
}

export const questions: Question[] = [
    {
        id: 1,
        title: 'Energy Level',
        optionA: { label: 'I want a playful, energetic cat.', tag: 'active' },
        optionB: { label: 'I want a calm, relaxed cat.', tag: 'mellow' },
    },
    {
        id: 2,
        title: 'Social Style',
        optionA: { label: 'I want a cat that loves meeting people and being social.', tag: 'social' },
        optionB: { label: 'I prefer a cat that\'s a bit shy or low-key.', tag: 'shy' },
    },
    {
        id: 3,
        title: 'Affection',
        optionA: { label: 'I want a cuddly lap cat who likes to be held.', tag: 'affectionate' },
        optionB: { label: 'I prefer an independent cat that does their own thing.', tag: 'independent' },
    },
    {
        id: 4,
        title: 'Play Preference',
        optionA: { label: 'Toys and games all day — I want a cat who plays.', tag: 'playful' },
        optionB: { label: 'I want a cat who mostly chills and watches.', tag: 'low_play' },
    },
    {
        id: 5,
        title: 'Age',
        optionA: { label: 'I\'d like a young cat / kitten (under ~2 years).', tag: 'young' },
        optionB: { label: 'I\'d prefer an adult cat (2+ years).', tag: 'adult' },
    },
    {
        id: 6,
        title: 'Grooming & Maintenance',
        optionA: { label: 'I don\'t mind regular brushing and grooming.', tag: 'high_groom' },
        optionB: { label: 'I want a low-maintenance coat.', tag: 'low_groom' },
    },
    {
        id: 7,
        title: 'Noise Tolerance',
        optionA: { label: 'I don\'t mind a vocal cat (talkative/meows).', tag: 'vocal' },
        optionB: { label: 'I prefer a quiet cat.', tag: 'quiet' },
    },
    {
        id: 8,
        title: 'Household Fit',
        optionA: { label: 'My home has kids or other pets — I want a social, tolerant cat.', tag: 'good_with_kids_pets' },
        optionB: { label: 'My home is quiet — I want a cat for a calm environment.', tag: 'calm_home' },
    },
];
```

### 5B — API Call (`frontend/src/features/questionnaire/api.ts`)

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CatMatch {
    id: number;
    name: string;
    description: string;
    keywords: string[];
    adoptionUrl: string;
    imageUrl: string | null;
    matchScore: number;
}

export async function submitAnswers(tags: string[]): Promise<CatMatch[]> {
    const res = await axios.post<{ matches: CatMatch[] }>(`${API_BASE}/api/match`, { tags });
    return res.data.matches;
}
```

### 5C — Component Flow

The UI has two states: **questionnaire** and **results**.

**QuestionnaireForm component:**
- Shows one question at a time (or all at once — agent's choice, but one-at-a-time is better UX).
- Progress bar showing question X of 8.
- User clicks option A or B → tag is stored in a `string[]` state.
- On last question, "Find My Match" button appears.
- On submit → call `submitAnswers(tags)` → transition to results view.
- Show loading spinner during API call.

**ResultsList component:**
- Receives array of 3 `CatMatch` objects.
- For each cat, render a `CatCard` with:
  - Cat photo (from `imageUrl`, or a placeholder).
  - Cat name.
  - Short description (first 2-3 sentences of `description`).
  - Match score badge (e.g., "6/8 match").
  - "Meet [Name]" button → `window.open(adoptionUrl, '_blank')`.
- "Start Over" button to reset and retake the quiz.

### 5D — Styling Guidance

- Keep it warm, friendly, and clean. Think: soft pastels, rounded cards, cat paw icons.
- Mobile-first responsive design.
- Use plain CSS modules or a lightweight solution — no heavy UI library needed for MVP.
- The agent can use whatever styling approach it prefers as long as it looks polished.

---

## 9. Phase 6 — Integration & Testing

### Agent Task: Wire everything together and verify the full flow works.

### 6A — End-to-End Checklist

1. **Database:** Ensure PostgreSQL is running with a `catcafe` database created.
   ```bash
   createdb catcafe
   cd backend && npm run migrate
   ```

2. **Scraper:** Run the scraper and verify cats are in the database.
   ```bash
   npm run scrape
   # Then check: psql catcafe -c "SELECT name, keywords FROM cats LIMIT 5;"
   ```

3. **Backend:** Start the server and test the match endpoint.
   ```bash
   npm run dev
   # Test:
   curl -X POST http://localhost:3001/api/match \
     -H "Content-Type: application/json" \
     -d '{"tags":["active","social","affectionate","playful","young","low_groom","vocal","good_with_kids_pets"]}'
   ```

4. **Frontend:** Start the dev server and go through the quiz.
   ```bash
   cd frontend && npm run dev
   ```

5. **Full flow:** Answer all 8 questions → see 3 cat results → click adoption link → verify it opens the correct bkcatcafe.com page.

### 6B — Error Handling to Implement

- Backend: If scraper finds 0 cats, log an error (site structure may have changed).
- Backend: If no cats match any tags, return the 3 most recently scraped active cats as fallback.
- Frontend: Show user-friendly error message if API call fails.
- Frontend: Handle case where fewer than 3 matches are returned.

### 6C — CORS Configuration

The frontend (Vite dev server, typically port 5173) needs to reach the backend (port 3001). The `cors()` middleware with default config allows all origins — fine for dev. For production, restrict to the actual frontend domain.

---

## 10. Phase 7 — AI Vector Matching (Post-MVP)

> Only implement this after the MVP keyword matching is working end-to-end.

### 7A — Install Dependencies

```bash
cd backend && npm install openai pgvector
```

### 7B — Add Embedding Column

```sql
ALTER TABLE cats ADD COLUMN embedding vector(1536);
CREATE INDEX ON cats USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
```

### 7C — Generate Cat Embeddings

After scraping, for each cat description:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function getEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}
```

Store the resulting vector in the `embedding` column.

### 7D — Match by Cosine Similarity

Transform user tags into a descriptive sentence:
```
"Prefers a cat that is friendly, playful, cuddly, and is younger than 2 years old"
```

Get embedding for that sentence, then query:

```sql
SELECT *, 1 - (embedding <=> $1::vector) AS similarity
FROM cats
WHERE active = TRUE AND embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT 3;
```

### 7E — Daily Re-Scrape

Set up a cron job or use `node-cron` to run the scraper once daily:

```typescript
import cron from 'node-cron';
import { scrapeCats } from './scraper/scrape';

// Run at 6 AM every day
cron.schedule('0 6 * * *', () => {
    scrapeCats().catch(console.error);
});
```

---

## 11. File Tree Reference

```
catcafewebs/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── db/
│   │   │   ├── pool.ts
│   │   │   ├── schema.sql
│   │   │   └── migrate.ts
│   │   ├── scraper/
│   │   │   ├── scrape.ts
│   │   │   └── keywords.ts
│   │   ├── routes/
│   │   │   └── match.ts
│   │   ├── services/
│   │   │   └── matcher.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── features/
│   │   │   ├── questionnaire/
│   │   │   │   ├── components/
│   │   │   │   ├── types.ts
│   │   │   │   └── api.ts
│   │   │   └── results/
│   │   │       ├── components/
│   │   │       └── types.ts
│   │   ├── assets/
│   │   └── styles/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── IMPLEMENTATION_GUIDE.md
```

---

## 12. Sub-Agent Delegation Strategy

If using multiple Claude sub-agents, here is how to split the work:

### Agent 1: Backend Foundation

- Phase 0A (backend scaffolding)
- Phase 1 (database setup)
- Phase 4 (Express API routes)
- **Deliverable:** Running Express server with `/api/match` endpoint that queries the database.

### Agent 2: Scraper

- Phase 2 (Playwright scraper + keyword extractor)
- **Critical:** This agent needs to **browse bkcatcafe.com first** to understand the page structure before writing selectors.
- **Deliverable:** Working scraper that populates the `cats` table with real data.

### Agent 3: Frontend

- Phase 0B (Vite scaffolding)
- Phase 5 (questionnaire + results UI)
- Can start immediately — mock the API response with hardcoded data until the backend is ready.
- **Deliverable:** Complete React app that takes a quiz and displays results.

### Agent 4: Integration (runs last)

- Phase 6 (wire together, test, fix bugs)
- Run the scraper, start the backend, start the frontend, go through the full flow.
- Fix any issues found.

### Execution Order

```
Agent 1 (Backend) ──┐
Agent 2 (Scraper) ──┼──→ Agent 4 (Integration)
Agent 3 (Frontend) ─┘
```

Agents 1, 2, and 3 can run in parallel. Agent 4 runs after all three are complete.

---

## Quick Reference: API Contract

### `POST /api/match`

**Request:**
```json
{
    "tags": ["active", "social", "affectionate", "playful", "young", "low_groom", "vocal", "good_with_kids_pets"]
}
```

**Response:**
```json
{
    "matches": [
        {
            "id": 1,
            "name": "Whiskers",
            "description": "Whiskers is an energetic and playful kitten who loves toys and meeting new people...",
            "keywords": ["active", "social", "playful", "young", "vocal"],
            "adoptionUrl": "https://www.bkcatcafe.com/cats/whiskers",
            "imageUrl": "https://www.bkcatcafe.com/images/whiskers.jpg",
            "matchScore": 5
        },
        { "...cat2..." : "..." },
        { "...cat3..." : "..." }
    ]
}
```

**Error Response (400):**
```json
{
    "error": {
        "formErrors": [],
        "fieldErrors": {
            "tags": ["Expected array, received string"]
        }
    }
}
```
