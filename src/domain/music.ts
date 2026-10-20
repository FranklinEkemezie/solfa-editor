/**
 * The domain public entry point.
 *
 * Every domain entity, value type, and helper is re-exported here so the rest
 * of the app can depend on a single import path (`@/domain/music`). Keep this
 * file free of logic — it only wires the focused modules together.
 */

export { Letter } from '@/domain/letter';
export { Accidental } from '@/domain/accidental';
export { Degree, DEGREES } from '@/domain/degree';
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
export {
    BEAT_MARK,
    HALF_BAR_MARK,
    dividesInHalves,
    halfBarAfter,
    markAfterBeat,
} from '@/domain/bar-division';
export { type PartId, PARTS } from '@/domain/parts';
export {
    type SolfaSyllable,
    type NaturalSolfaSyllable,
    type ChromaticSolfaSyllable,
    type SolfaPitchSpec,
    SOLFA_SYLLABLES,
    NATURAL_SOLFA_SYLLABLES,
    CHROMATIC_SOLFA_SYLLABLES,
    SOLFA_TO_DEGREE,
    solfaPitch,
    isSolfaSyllable,
} from '@/domain/solfa';
export {
    type Fraction,
    fraction,
    addFractions,
    subtractFractions,
    multiplyFractions,
    divideFractions,
    compareFractions,
    ZERO_FRACTION,
    isZeroFraction,
    fractionsEqual,
    floorFraction,
    ceilFraction,
    fractionToNumber,
} from '@/domain/fraction';
export { Pitch } from '@/domain/pitch';
export {
    ACCIDENTAL_SEMITONES,
    DEGREE_SEMITONES,
    soundingMidi,
    soundingPitchClass,
} from '@/domain/pitch-resolution';
export { type VoiceSettings, VOICE_SETTINGS, referenceOctave } from '@/domain/voice';
export { MusicalEvent } from '@/domain/musical-event';
export { Note } from '@/domain/note';
export { Rest } from '@/domain/rest';
export { Measure } from '@/domain/measure';
export { KeySignature } from '@/domain/key-signature';
export { Key } from '@/domain/key';
export { tonicPitchClass } from '@/domain/key-tonic';
export { Tempo } from '@/domain/tempo';
export { TimeSignature } from '@/domain/time-signature';
export { Score } from '@/domain/score';
export {
    type ScoreDocument,
    createEmptyScoreDocument,
    emptyVoices,
    voiceSource,
    withVoice,
    withMeasureCount,
} from '@/domain/score-document';

export { validateScore } from '@/domain/score-validation';
export { noteValueDenominator, timeSignatureLabel } from '@/domain/notational-labels';
