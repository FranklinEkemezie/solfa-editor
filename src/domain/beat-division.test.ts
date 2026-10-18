import { describe, expect, it } from 'vitest';
import {
    BEAT_DIVISION_MARKS,
    divisionForMark,
    divisionForValues,
    divideNoteValue,
    isBeatDivision,
    NoteValue,
    refineDivision,
} from '@/domain/music';

describe('beat division', () => {
    it('spells a halved beat with a dot and a quartered beat with commas', () => {
        expect(BEAT_DIVISION_MARKS[1]).toEqual([]);
        expect(BEAT_DIVISION_MARKS[2]).toEqual(['.']);
        expect(BEAT_DIVISION_MARKS[4]).toEqual([',', '.', ',']);
    });

    it('only refines a beat towards a finer division', () => {
        expect(refineDivision(1, 2)).toBe(2);
        expect(refineDivision(2, 4)).toBe(4);
        expect(refineDivision(4, 2)).toBe(4);
    });

    it('reads the division a mark asks for', () => {
        expect(divisionForMark('.')).toBe(2);
        expect(divisionForMark(',')).toBe(4);
        expect(divisionForMark('x')).toBeNull();
    });

    it('splits a note value into equal shorter note values', () => {
        expect(divideNoteValue(NoteValue.QUARTER, 1)).toBe(NoteValue.QUARTER);
        expect(divideNoteValue(NoteValue.QUARTER, 2)).toBe(NoteValue.EIGHTH);
        expect(divideNoteValue(NoteValue.QUARTER, 4)).toBe(NoteValue.SIXTEENTH);
    });

    it('reads a written note value back as its division', () => {
        expect(divisionForValues(NoteValue.QUARTER, NoteValue.QUARTER)).toBe(1);
        expect(divisionForValues(NoteValue.QUARTER, NoteValue.EIGHTH)).toBe(2);
        expect(divisionForValues(NoteValue.QUARTER, NoteValue.SIXTEENTH)).toBe(4);
    });

    it('accepts only the divisions the notation can write', () => {
        expect([1, 2, 4].every(isBeatDivision)).toBe(true);
        expect([3, 8, 0].some(isBeatDivision)).toBe(false);
    });
});
