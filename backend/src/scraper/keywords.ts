/**
 * Keyword extraction module for cat descriptions.
 *
 * Maps free-text cat bios to a set of personality/trait tags used by the
 * questionnaire matching engine.  The rules below are tuned to the typical
 * language found on bkcatcafe.com adoption profiles.
 */

export type Tag =
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
    // ── Energy ──────────────────────────────────────────────
    {
        tag: 'active',
        patterns: [
            /energetic/i,
            /\bactive\b/i,
            /loves?\s+to\s+run/i,
            /zoomies/i,
            /high[\s-]?energy/i,
            /adventur(ous|e)/i,
            /bouncing/i,
            /always\s+on\s+the\s+(move|go)/i,
            /curious\s+explorer/i,
            /loves?\s+to\s+explore/i,
            /busy\b/i,
            /never\s+stops/i,
        ],
    },
    {
        tag: 'mellow',
        patterns: [
            /\bcalm\b/i,
            /relaxed/i,
            /mellow/i,
            /laid[\s-]?back/i,
            /\bchill\b/i,
            /easy[\s-]?going/i,
            /gentle\s+soul/i,
            /gentle\b/i,
            /low[\s-]?key/i,
            /serene/i,
            /peaceful/i,
            /takes?\s+(it|things)\s+easy/i,
            /lounging/i,
            /couch/i,
        ],
    },

    // ── Sociability ─────────────────────────────────────────
    {
        tag: 'social',
        patterns: [
            /\bsocial\b/i,
            /\bfriendly\b/i,
            /loves?\s+people/i,
            /outgoing/i,
            /greet(s|ing)?\b/i,
            /loves?\s+attention/i,
            /people[\s-]?person/i,
            /loves?\s+meeting/i,
            /loves?\s+visitors/i,
            /loves?\s+company/i,
            /everyone/i,
            /\bwelcom(e|es|ing)\b/i,
            /follows?\s+you/i,
            /loves?\s+to\s+be\s+around/i,
        ],
    },
    {
        tag: 'shy',
        patterns: [
            /\bshy\b/i,
            /timid/i,
            /\breserved\b/i,
            /takes?\s+(some\s+)?time\s+to\s+warm/i,
            /nervous/i,
            /skittish/i,
            /cautious/i,
            /hides?\b/i,
            /needs?\s+patience/i,
            /slowly\s+opens?\s+up/i,
            /warming\s+up/i,
            /a\s+bit\s+scared/i,
            /needs?\s+a\s+quiet/i,
        ],
    },

    // ── Affection ───────────────────────────────────────────
    {
        tag: 'affectionate',
        patterns: [
            /affectionate/i,
            /cuddl(y|e|es|ing)/i,
            /lap\s*cat/i,
            /loves?\s+to\s+snuggle/i,
            /purr(s|ing)?\b/i,
            /snuggl(y|e|es|ing)/i,
            /loves?\s+to\s+be\s+(held|petted|pet)/i,
            /head\s*butt/i,
            /nuzzle/i,
            /lovebug/i,
            /love\s*bug/i,
            /sweetest/i,
            /sweet\s+(boy|girl|kitty|cat)/i,
            /velcro/i,
            /wants?\s+to\s+be\s+(close|near|next)/i,
            /loves?\s+belly\s+rubs/i,
            /big\s+purr/i,
            /loud\s+purr/i,
            /kneading/i,
            /makes?\s+biscuits/i,
        ],
    },
    {
        tag: 'independent',
        patterns: [
            /independent/i,
            /does\s+(his|her|their)\s+own\s+thing/i,
            /aloof/i,
            /self[\s-]?sufficient/i,
            /on\s+(his|her|their)\s+own\s+terms/i,
            /doesn'?t\s+need\s+constant/i,
            /entertains?\s+(him|her|them)self/i,
            /low[\s-]?maintenance\s+personality/i,
            /happy\s+(on\s+)?(his|her|their)\s+own/i,
            /needs?\s+(his|her|their)\s+space/i,
            /give\s+(him|her|them)\s+space/i,
        ],
    },

    // ── Play ────────────────────────────────────────────────
    {
        tag: 'playful',
        patterns: [
            /playful/i,
            /loves?\s+toys/i,
            /\bplay(s|ing)?\b/i,
            /feather/i,
            /chase(s|ing)?\b/i,
            /pounce/i,
            /wand\s+toy/i,
            /laser/i,
            /string/i,
            /fetch/i,
            /bat(s|ting)?\s+(at|around)/i,
            /wrestl(e|es|ing)/i,
            /frisky/i,
        ],
    },
    {
        tag: 'low_play',
        patterns: [
            /couch\s+potato/i,
            /prefers?\s+watching/i,
            /not\s+(much|very)\s+into\s+play/i,
            /\bobserver\b/i,
            /prefers?\s+napping/i,
            /window\s+(watcher|watching|sitter|sitting)/i,
            /mostly\s+(sleeps?|naps?|rests?)/i,
            /content\s+to\s+(just\s+)?(sit|watch|lounge|lay|lie)/i,
            /rather\s+(sleep|nap|relax)/i,
        ],
    },

    // ── Age ─────────────────────────────────────────────────
    {
        tag: 'young',
        patterns: [
            /\bkitten\b/i,
            /\byoung\b/i,
            /\b\d\s*months?\s*old\b/i,
            /\bbaby\b/i,
            /under\s+(1|2|one|two)\s*year/i,
            /\b(1|2)\s*year(s)?\s*old\b/i,
            /junior/i,
            /adolescent/i,
            /teeny/i,
            /little\s+(guy|girl|one)/i,
        ],
    },
    {
        tag: 'adult',
        patterns: [
            /\badult\b/i,
            /\bsenior\b/i,
            /\bmature\b/i,
            /\b[3-9]\s*year(s)?\s*old\b/i,
            /\b1[0-9]\s*year(s)?\s*old\b/i,
            /\b[3-9]\s*years?\b/i,
            /\b1[0-9]\s*years?\b/i,
            /older\b/i,
            /golden\s+years/i,
            /middle[\s-]?aged/i,
            /distinguished/i,
        ],
    },

    // ── Grooming ────────────────────────────────────────────
    {
        tag: 'high_groom',
        patterns: [
            /long[\s-]?hair(ed)?\b/i,
            /\bfluffy\b/i,
            /requires?\s+grooming/i,
            /persian/i,
            /maine\s+coon/i,
            /medium[\s-]?hair/i,
            /luxurious\s+coat/i,
            /thick\s+coat/i,
            /silky\s+coat/i,
            /regular\s+(brushing|grooming)/i,
            /himalayan/i,
            /ragdoll/i,
            /angora/i,
            /floof/i,
        ],
    },
    {
        tag: 'low_groom',
        patterns: [
            /short[\s-]?hair(ed)?\b/i,
            /low[\s-]?maintenance\b/i,
            /easy\s+coat/i,
            /sleek\s+coat/i,
            /smooth\s+coat/i,
            /tabby/i,
            /domestic\s+short/i,
            /DSH/,
        ],
    },

    // ── Vocalization ────────────────────────────────────────
    {
        tag: 'vocal',
        patterns: [
            /\bvocal\b/i,
            /talkative/i,
            /\bmeow(s|ing)?\b/i,
            /chatty/i,
            /loves?\s+to\s+talk/i,
            /has\s+a\s+lot\s+to\s+say/i,
            /chirps?/i,
            /trills?/i,
            /siamese/i,
            /will\s+tell\s+you/i,
            /lets?\s+you\s+know/i,
        ],
    },
    {
        tag: 'quiet',
        patterns: [
            /\bquiet\b/i,
            /\bsilent\b/i,
            /not\s+very\s+vocal/i,
            /rarely\s+(meow|vocal)/i,
            /soft[\s-]?spoken/i,
            /strong\s+silent/i,
            /doesn'?t\s+(meow|vocalize)\s+much/i,
        ],
    },

    // ── Household ───────────────────────────────────────────
    {
        tag: 'good_with_kids_pets',
        patterns: [
            /good\s+with\s+(kids|children|dogs|other\s+cats|pets|other\s+animals)/i,
            /family[\s-]?friendly/i,
            /gets?\s+along/i,
            /tolerant/i,
            /great\s+with\s+(kids|children|other|dogs)/i,
            /loves?\s+(kids|children|dogs|other\s+cats)/i,
            /does\s+well\s+with/i,
            /multi[\s-]?(cat|pet)/i,
            /cat[\s-]?friendly/i,
            /dog[\s-]?friendly/i,
            /would\s+do\s+well\s+in\s+a\s+home\s+with/i,
        ],
    },
    {
        tag: 'calm_home',
        patterns: [
            /prefers?\s+quiet/i,
            /single[\s-]?cat/i,
            /no\s+(kids|children|dogs)/i,
            /calm\s+environment/i,
            /only\s+pet/i,
            /quiet\s+(home|household|environment)/i,
            /sole\s+cat/i,
            /adult[\s-]?only/i,
            /no\s+small\s+children/i,
            /would\s+prefer\s+to\s+be\s+the\s+only/i,
            /best\s+as\s+(the\s+)?only/i,
            /does\s+not\s+(like|do\s+well\s+with)\s+(other|dogs|cats)/i,
        ],
    },
];

/**
 * Extract personality/trait tags from a cat's description text.
 *
 * @param description - Free-text biography of a cat
 * @returns Array of matched Tag strings (may be empty)
 */
export function extractKeywords(description: string): Tag[] {
    const tags: Tag[] = [];
    for (const rule of rules) {
        if (rule.patterns.some((p) => p.test(description))) {
            tags.push(rule.tag);
        }
    }
    return [...new Set(tags)]; // deduplicate just in case
}
