import { Accidental } from '@/domain/accidental';
import { Letter } from '@/domain/letter';
import { Pitch } from '@/domain/pitch';

/** The seven diatonic tonic sol-fa syllables: doh, ray, mi, fah, soh, lah, te. */
export const NATURAL_SOLFA_SYLLABLES = ['d', 'r', 'm', 'f', 's', 'l', 't'] as const;
export type NaturalSolfaSyllable = (typeof NATURAL_SOLFA_SYLLABLES)[number];

/**
 * The chromatic syllables, named by the project's convention.
 *
 * A vowel `e` raises a degree and a vowel `a` lowers one: `de` raises doh,
 * `re` raises ray, `ma` lowers mi, `fe` raises fah, `ba` lowers soh, `se`
 * raises soh, and `ta` lowers te.
 *
 * Two pairs are enharmonic on purpose — they sound identical but read
 * differently depending on how the passage is spelled:
 *
 * - `re` (raised ray) and `ma` (lowered mi) are both D♯/E♭.
 * - `fe` (raised fah) and `ba` (lowered soh) are both F♯/G♭.
 */
export const CHROMATIC_SOLFA_SYLLABLES = ['de', 're', 'ma', 'fe', 'ba', 'se', 'ta'] as const;
export type ChromaticSolfaSyllable = (typeof CHROMATIC_SOLFA_SYLLABLES)[number];

/** Every syllable the editor accepts: the diatonic set followed by the chromatic set. */
export const SOLFA_SYLLABLES = [...NATURAL_SOLFA_SYLLABLES, ...CHROMATIC_SOLFA_SYLLABLES] as const;
export type SolfaSyllable = (typeof SOLFA_SYLLABLES)[number];

/**
 * The written pitch for each syllable, all spelled within the fourth octave.
 *
 * The editor transposes per part, so these values are relative spellings rather
 * than concert pitch.
 */
export const SOLFA_TO_PITCH: Record<SolfaSyllable, Pitch> = {
    d: new Pitch(Letter.C, Accidental.NATURAL, 4),
    r: new Pitch(Letter.D, Accidental.NATURAL, 4),
    m: new Pitch(Letter.E, Accidental.NATURAL, 4),
    f: new Pitch(Letter.F, Accidental.NATURAL, 4),
    s: new Pitch(Letter.G, Accidental.NATURAL, 4),
    l: new Pitch(Letter.A, Accidental.NATURAL, 4),
    t: new Pitch(Letter.B, Accidental.NATURAL, 4),
    de: new Pitch(Letter.C, Accidental.SHARP, 4),
    re: new Pitch(Letter.D, Accidental.SHARP, 4),
    ma: new Pitch(Letter.E, Accidental.FLAT, 4),
    fe: new Pitch(Letter.F, Accidental.SHARP, 4),
    ba: new Pitch(Letter.G, Accidental.FLAT, 4),
    se: new Pitch(Letter.G, Accidental.SHARP, 4),
    ta: new Pitch(Letter.B, Accidental.FLAT, 4),
};

const SOLFA_SYLLABLE_SET: ReadonlySet<string> = new Set(SOLFA_SYLLABLES);

export function isSolfaSyllable(value: string): value is SolfaSyllable {
    return SOLFA_SYLLABLE_SET.has(value);
}
