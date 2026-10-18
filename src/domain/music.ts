/**
 * The domain public entry point.
 *
 * Every domain entity, value type, and helper is re-exported here so the rest
 * of the app can depend on a single import path (`@/domain/music`). Keep this
 * file free of logic — it only wires the focused modules together.
 */

export { Letter } from '@/domain/letter';
export { Accidental } from '@/domain/accidental';
export { Mode } from '@/domain/mode';
export { NoteValue, NOTE_VALUE_ORDER, NOTE_VALUE_UNITS } from '@/domain/note-value';
export {
    type BeatDivision,
    BEAT_DIVISION_MARKS,
    beatMarkBetween,
    divisionForMark,
    divisionForValues,
    divideNoteValue,
    isBeatDivision,
    refineDivision,
} from '@/domain/beat-division';
export { type PartId, PARTS } from '@/domain/parts';
export {
    type SolfaSyllable,
    type NaturalSolfaSyllable,
    type ChromaticSolfaSyllable,
    SOLFA_SYLLABLES,
    NATURAL_SOLFA_SYLLABLES,
    CHROMATIC_SOLFA_SYLLABLES,
    SOLFA_TO_PITCH,
    isSolfaSyllable,
} from '@/domain/solfa';
export { type Fraction, fraction, addFractions, compareFractions } from '@/domain/fraction';
export { Duration } from '@/domain/duration';
export { Pitch } from '@/domain/pitch';
export { MusicalEvent } from '@/domain/musical-event';
export { Note } from '@/domain/note';
export { Measure } from '@/domain/measure';
export { KeySignature } from '@/domain/key-signature';
export { Key } from '@/domain/key';
export { tonicPitchClass } from '@/domain/key-tonic';
export { Tempo } from '@/domain/tempo';
export { TimeSignature } from '@/domain/time-signature';
export { Score } from '@/domain/score';

export { createEmptyScore } from '@/domain/score-factory';
export { validateScore } from '@/domain/score-validation';
export { noteValueDenominator, timeSignatureLabel } from '@/domain/notational-labels';
