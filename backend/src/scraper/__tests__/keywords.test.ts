import { extractKeywords, type Tag } from '../keywords';

describe('extractKeywords', () => {
    // ── Helper ──────────────────────────────────────────────

    /** Assert the description produces exactly the expected set of tags. */
    function expectTags(description: string, expected: Tag[]) {
        const tags = extractKeywords(description);
        expect(tags.sort()).toEqual(expected.sort());
    }

    /** Assert the description contains at least the listed tags (may have more). */
    function expectContainsTags(description: string, expected: Tag[]) {
        const tags = extractKeywords(description);
        for (const t of expected) {
            expect(tags).toContain(t);
        }
    }

    // ── 1. Active tag ───────────────────────────────────────

    it('detects "active" from energy-related words', () => {
        const desc =
            'Luna is an energetic girl who loves to run around the cafe. ' +
            'She does zoomies every morning and is always on the move.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('active');
    });

    it('detects "active" from adventure/exploration words', () => {
        const desc = 'Mango is a curious explorer who loves to explore every corner of the room.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('active');
    });

    // ── 2. Mellow tag ───────────────────────────────────────

    it('detects "mellow" from calm/relaxed language', () => {
        const desc =
            'Patches is a calm and laid-back gentleman. He is the most ' +
            'easy-going cat you will ever meet.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('mellow');
    });

    it('detects "mellow" from gentle/lounging language', () => {
        const desc =
            'Shadow is a gentle soul who enjoys lounging in a sunny spot all day.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('mellow');
    });

    // ── 3. Social tag ───────────────────────────────────────

    it('detects "social" from people-loving descriptions', () => {
        const desc =
            'Biscuit is a super friendly boy who loves people and greets ' +
            'everyone who walks through the door.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('social');
    });

    it('detects "social" when cat follows you around', () => {
        const desc =
            'Pepper is outgoing and follows you around the room. She loves meeting visitors.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('social');
    });

    // ── 4. Shy tag ──────────────────────────────────────────

    it('detects "shy" from timid/reserved descriptions', () => {
        const desc =
            'Cleo is a shy and timid girl who takes some time to warm up ' +
            'to new people. She needs patience but rewards you with trust.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('shy');
    });

    it('detects "shy" from nervous/skittish language', () => {
        const desc = 'Oliver is a bit skittish and cautious around strangers. He hides under the bed at first.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('shy');
    });

    // ── 5. Affectionate tag ─────────────────────────────────

    it('detects "affectionate" from cuddly/lap cat descriptions', () => {
        const desc =
            'Mochi is the most affectionate lap cat you will ever meet. ' +
            'She loves to snuggle and purrs non-stop when held.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('affectionate');
    });

    it('detects "affectionate" from lovebug/head-butt language', () => {
        const desc =
            'Toby is a total lovebug who will headbutt your hand for more pets ' +
            'and makes biscuits on your lap.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('affectionate');
    });

    // ── 6. Independent tag ──────────────────────────────────

    it('detects "independent" from self-sufficient descriptions', () => {
        const desc =
            'Jasper is very independent and does his own thing. He is ' +
            'self-sufficient and entertains himself with window watching.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('independent');
    });

    // ── 7. Playful tag ──────────────────────────────────────

    it('detects "playful" from toy/play descriptions', () => {
        const desc =
            'Whiskers is incredibly playful! She loves toys, especially ' +
            'the feather wand, and will chase anything that moves.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('playful');
    });

    it('detects "playful" from pounce/wrestle language', () => {
        const desc =
            'Gizmo loves to pounce on moving objects and wrestle with his brother.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('playful');
    });

    // ── 8. Low-play tag ─────────────────────────────────────

    it('detects "low_play" from observer/couch potato language', () => {
        const desc =
            'Muffin is a total couch potato. She is content to just sit and ' +
            'watch the birds — a true window watcher at heart.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('low_play');
    });

    // ── 9. Young tag ────────────────────────────────────────

    it('detects "young" from kitten/age descriptions', () => {
        const desc =
            'Sprout is a playful kitten, about 5 months old. ' +
            'This little guy has endless energy.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('young');
    });

    it('detects "young" from year-old descriptions', () => {
        const desc = 'Daisy is a 1 year old tabby who still acts like a baby.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('young');
    });

    // ── 10. Adult tag ───────────────────────────────────────

    it('detects "adult" from age/senior descriptions', () => {
        const desc =
            'Grandpa Felix is a distinguished senior cat at 12 years old. ' +
            'He has a mature and mellow personality.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('adult');
    });

    it('detects "adult" from middle-aged descriptions', () => {
        const desc = 'Simba is a 5 year old adult domestic shorthair.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('adult');
    });

    // ── 11. High-groom tag ──────────────────────────────────

    it('detects "high_groom" from long-hair/fluffy descriptions', () => {
        const desc =
            'Princess is a gorgeous long-haired Persian with a fluffy coat ' +
            'that requires regular grooming.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('high_groom');
    });

    it('detects "high_groom" for breed-specific names', () => {
        const desc = 'Mr. Floof is a beautiful Maine Coon mix with a luxurious coat.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('high_groom');
    });

    // ── 12. Low-groom tag ───────────────────────────────────

    it('detects "low_groom" from short-hair/easy-coat descriptions', () => {
        const desc =
            'Tiger is a domestic shorthair with a sleek coat. ' +
            'Very low-maintenance when it comes to grooming.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('low_groom');
    });

    // ── 13. Vocal tag ───────────────────────────────────────

    it('detects "vocal" from talkative/meow descriptions', () => {
        const desc =
            'Chatty is a very vocal Siamese mix who loves to talk. ' +
            'She has a lot to say and chirps whenever you walk by.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('vocal');
    });

    // ── 14. Quiet tag ───────────────────────────────────────

    it('detects "quiet" from silent descriptions', () => {
        const desc =
            'Ninja is the strong silent type. He is quiet and ' +
            'rarely meows, preferring to communicate with soft head bumps.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('quiet');
    });

    // ── 15. Good with kids/pets tag ─────────────────────────

    it('detects "good_with_kids_pets" from family-friendly descriptions', () => {
        const desc =
            'Buddy is great with kids and gets along with other cats ' +
            'and even dogs. A truly family-friendly cat.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('good_with_kids_pets');
    });

    it('detects "good_with_kids_pets" from multi-pet descriptions', () => {
        const desc =
            'Peaches does well with other animals and would do well in a home with other pets.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('good_with_kids_pets');
    });

    // ── 16. Calm-home tag ───────────────────────────────────

    it('detects "calm_home" from only-pet/quiet-home descriptions', () => {
        const desc =
            'Duchess prefers quiet and would best as the only pet in an ' +
            'adult-only household. No kids or dogs please.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('calm_home');
    });

    // ── Multiple tags ───────────────────────────────────────

    it('matches multiple tags from a rich description', () => {
        const desc =
            'Bella is a playful and affectionate kitten who loves toys and ' +
            'snuggles equally. This social little girl greets everyone and ' +
            'gets along great with other cats. She is a short-haired tabby ' +
            'and is about 6 months old.';
        expectContainsTags(desc, [
            'playful',
            'affectionate',
            'young',
            'social',
            'good_with_kids_pets',
            'low_groom',
        ]);
    });

    it('matches senior + mellow + quiet + calm_home for an older cat', () => {
        const desc =
            'Professor Whiskers is a calm senior at 10 years old. He is quiet ' +
            'and prefers a quiet home as the only pet. This gentle, ' +
            'laid-back gentleman has a short-haired coat that is easy to maintain.';
        expectContainsTags(desc, [
            'mellow',
            'adult',
            'quiet',
            'calm_home',
            'low_groom',
        ]);
    });

    it('matches active + playful + vocal + young for an energetic kitten', () => {
        const desc =
            'Rocket is a high-energy kitten who loves to play with every toy ' +
            'in sight. He is chatty and meows loudly for attention. Only ' +
            '4 months old and already the life of the party.';
        expectContainsTags(desc, ['active', 'playful', 'vocal', 'young']);
    });

    // ── Zero tags ───────────────────────────────────────────

    it('returns empty array for completely unrelated text', () => {
        const desc = 'The weather today is sunny with a high of 75 degrees.';
        expectTags(desc, []);
    });

    it('returns empty array for an empty string', () => {
        expectTags('', []);
    });

    // ── Case insensitivity ──────────────────────────────────

    it('matches tags regardless of case', () => {
        const desc = 'ENERGETIC AND PLAYFUL KITTEN WHO LOVES TOYS AND IS VERY SOCIAL';
        const tags = extractKeywords(desc);
        expect(tags).toContain('active');
        expect(tags).toContain('playful');
        expect(tags).toContain('young');
        expect(tags).toContain('social');
    });

    it('handles mixed case in descriptions', () => {
        const desc = 'A Shy but Affectionate lap Cat who Purrs constantly.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('shy');
        expect(tags).toContain('affectionate');
    });

    // ── Edge cases ──────────────────────────────────────────

    it('does not produce duplicate tags', () => {
        const desc =
            'Very active, energetic, always on the go, loves to run, zoomies all day.';
        const tags = extractKeywords(desc);
        const uniqueTags = [...new Set(tags)];
        expect(tags.length).toBe(uniqueTags.length);
    });

    it('handles descriptions with special characters and line breaks', () => {
        const desc =
            'Mr. Whiskers (3 years old!) is an affectionate,\n' +
            'cuddly cat who loves belly rubs.\n' +
            'He\'s great with kids & other pets!';
        const tags = extractKeywords(desc);
        expect(tags).toContain('affectionate');
        expect(tags).toContain('adult');
        expect(tags).toContain('good_with_kids_pets');
    });

    // ── Realistic full profiles ─────────────────────────────

    it('handles a realistic Brooklyn Cat Cafe style profile (social + affectionate + young)', () => {
        const desc =
            'Meet Pumpkin! This adorable 8 month old orange tabby is looking ' +
            'for his forever home. Pumpkin is friendly and loves meeting new ' +
            'people at the cafe. He is a cuddly boy who will curl up in your ' +
            'lap and purr for hours. He plays well with the other cats and ' +
            'would do great in a multi-cat household.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('social');
        expect(tags).toContain('affectionate');
        expect(tags).toContain('young');
        expect(tags).toContain('playful');
        expect(tags).toContain('good_with_kids_pets');
        expect(tags).toContain('low_groom');
    });

    it('handles a realistic shy cat profile', () => {
        const desc =
            'Cinnamon is a beautiful 4 year old tortoiseshell who takes time ' +
            'to warm up but once she trusts you she is the sweetest girl. ' +
            'She is an independent cat who does her own thing but will come ' +
            'to you for head scratches on her own terms. Would prefer a quiet ' +
            'home as the only pet with no small children.';
        const tags = extractKeywords(desc);
        expect(tags).toContain('shy');
        expect(tags).toContain('independent');
        expect(tags).toContain('adult');
        expect(tags).toContain('calm_home');
    });
});
