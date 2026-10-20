import { Accidental } from '@/domain/accidental';
import { Degree } from '@/domain/degree';
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

/** A degree together with the accidental the syllable itself implies. */
export type SolfaPitchSpec = {
    readonly degree: Degree;
    readonly accidental: Accidental;
};

/**
 * The degree and inherent accidental of every syllable.
 *
 * This is the single mapping from notation to scale meaning. It deliberately
 * carries no octave and no letter: the octave belongs to the voice and the
 * letter belongs to the key. A chromatic syllable contributes its alteration
 * once, here; an explicit `#` or `b` later overrides it rather than adding to
 * it.
 */
export const SOLFA_TO_DEGREE: Record<SolfaSyllable, SolfaPitchSpec> = {
    d: { degree: Degree.I, accidental: Accidental.NATURAL },
    r: { degree: Degree.II, accidental: Accidental.NATURAL },
    m: { degree: Degree.III, accidental: Accidental.NATURAL },
    f: { degree: Degree.IV, accidental: Accidental.NATURAL },
    s: { degree: Degree.V, accidental: Accidental.NATURAL },
    l: { degree: Degree.VI, accidental: Accidental.NATURAL },
    t: { degree: Degree.VII, accidental: Accidental.NATURAL },
    de: { degree: Degree.I, accidental: Accidental.SHARP },
    re: { degree: Degree.II, accidental: Accidental.SHARP },
    ma: { degree: Degree.III, accidental: Accidental.FLAT },
    fe: { degree: Degree.IV, accidental: Accidental.SHARP },
    ba: { degree: Degree.V, accidental: Accidental.FLAT },
    se: { degree: Degree.V, accidental: Accidental.SHARP },
    ta: { degree: Degree.VII, accidental: Accidental.FLAT },
};

/**
 * Build the written pitch of a syllable at a given octave.
 *
 * The notation engine resolves octaves from the voice's reference octave; this
 * helper is the convenience form used where a neutral register is enough.
 */
export function solfaPitch(syllable: SolfaSyllable, octave = 4): Pitch {
    const spec = SOLFA_TO_DEGREE[syllable];
    return new Pitch(spec.degree, spec.accidental, octave);
}

const SOLFA_SYLLABLE_SET: ReadonlySet<string> = new Set(SOLFA_SYLLABLES);

export function isSolfaSyllable(value: string): value is SolfaSyllable {
    return SOLFA_SYLLABLE_SET.has(value);
}
