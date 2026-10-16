import { Letter } from './letter';
import { Accidental } from './accidental';
import { Pitch } from './pitch';

export const SOLFA_SYLLABLES = ['d', 'r', 'm', 'f', 's', 'l', 't'] as const;
export type SolfaSyllable = (typeof SOLFA_SYLLABLES)[number];

export const SOLFA_TO_PITCH: Record<SolfaSyllable, Pitch> = {
    d: new Pitch(Letter.C, Accidental.NATURAL, 4),
    r: new Pitch(Letter.D, Accidental.NATURAL, 4),
    m: new Pitch(Letter.E, Accidental.NATURAL, 4),
    f: new Pitch(Letter.F, Accidental.NATURAL, 4),
    s: new Pitch(Letter.G, Accidental.NATURAL, 4),
    l: new Pitch(Letter.A, Accidental.NATURAL, 4),
    t: new Pitch(Letter.B, Accidental.NATURAL, 4),
};
