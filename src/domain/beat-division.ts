import { NoteValue, NOTE_VALUE_ORDER } from '@/domain/note-value';

/** How many equal notes a beat is divided into. */
export type BeatDivision = 1 | 2 | 4;

/**
 * The marks written between the notes of a divided beat.
 *
 * Curwen tonic sol-fa halves a beat with a full stop (`d.m`) and quarters it
 * with commas (`d,r.m,f`). The marks are derived from the division rather than
 * stored, so the notation always reads the way the method writes it.
 */
export const BEAT_DIVISION_MARKS: Record<BeatDivision, readonly string[]> = {
    1: [],
    2: ['.'],
    4: [',', '.', ','],
};

/** The mark written between two neighbouring notes of a beat, or null when there is none. */
export function beatMarkBetween(division: BeatDivision, index: number): string | null {
    return BEAT_DIVISION_MARKS[division][index] ?? null;
}

/** True for the values the editor accepts as a beat division. */
export function isBeatDivision(value: number): value is BeatDivision {
    return value === 1 || value === 2 || value === 4;
}

/** The division a `.` or `,` asks for, or null for every other character. */
export function divisionForMark(mark: string): BeatDivision | null {
    if (mark === '.') return 2;
    if (mark === ',') return 4;
    return null;
}

/** Refine a beat towards a finer division. Divisions only ever get finer. */
export function refineDivision(current: BeatDivision, requested: BeatDivision): BeatDivision {
    return Math.max(current, requested) as BeatDivision;
}

/** Split a note value into `division` equal shorter note values. */
export function divideNoteValue(value: NoteValue, division: BeatDivision): NoteValue {
    const steps = division === 2 ? 1 : division === 4 ? 2 : 0;
    const index = NOTE_VALUE_ORDER.indexOf(value);
    if (index < 0) return value;
    return NOTE_VALUE_ORDER[Math.min(NOTE_VALUE_ORDER.length - 1, index + steps)];
}

/** The division that turns a `beatValue` beat into a run of `writtenValue` notes, if any. */
export function divisionForValues(beatValue: NoteValue, writtenValue: NoteValue): BeatDivision {
    const steps = NOTE_VALUE_ORDER.indexOf(writtenValue) - NOTE_VALUE_ORDER.indexOf(beatValue);
    if (steps === 1) return 2;
    if (steps === 2) return 4;
    return 1;
}
