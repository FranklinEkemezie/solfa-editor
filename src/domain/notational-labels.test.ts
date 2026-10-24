import { describe, expect, it } from 'vitest';
import { NOTE_VALUE_ORDER, noteValueLabel } from '@/domain/music';

describe('note value labels', () => {
    it('names every value the tempo can count', () => {
        expect(NOTE_VALUE_ORDER.map(noteValueLabel)).toEqual([
            'Whole note',
            'Half note',
            'Quarter note',
            'Eighth note',
            'Sixteenth note',
            'Thirty-second note',
            'Sixty-fourth note',
        ]);
    });
});
