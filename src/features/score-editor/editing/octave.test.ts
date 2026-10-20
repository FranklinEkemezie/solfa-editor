import { describe, expect, it } from 'vitest';
import { createEmptyScoreDocument } from '@/domain/music';
import { insertSyllable } from '@/features/score-editor/editing/notation-editing';
import {
    nextOctaveStep,
    octaveMark,
    type OctaveStep,
} from '@/features/score-editor/editing/octave';

const SOPRANO = { part: 'soprano' as const, offset: 0 };

describe('the on-screen octave selector', () => {
    it('walks up one octave at a time and turns itself off after two', () => {
        const steps: OctaveStep[] = [0];
        let current: OctaveStep = 0;

        for (let press = 0; press < 3; press += 1) {
            current = nextOctaveStep(current, 'up');
            steps.push(current);
        }

        expect(steps).toEqual([0, 1, 2, 0]);
    });

    it('walks down one octave at a time and turns itself off after two', () => {
        const steps: OctaveStep[] = [0];
        let current: OctaveStep = 0;

        for (let press = 0; press < 3; press += 1) {
            current = nextOctaveStep(current, 'down');
            steps.push(current);
        }

        expect(steps).toEqual([0, -1, -2, 0]);
    });

    it('starts the other direction afresh, so only one side can be active', () => {
        expect(nextOctaveStep(1, 'down')).toBe(-1);
        expect(nextOctaveStep(2, 'down')).toBe(-1);
        expect(nextOctaveStep(-1, 'up')).toBe(1);
        expect(nextOctaveStep(-2, 'up')).toBe(1);
    });
});

describe('octaveMark', () => {
    it('writes the raw mark the language reads', () => {
        expect(octaveMark(0)).toBe('');
        expect(octaveMark(1)).toBe("'");
        expect(octaveMark(2)).toBe("''");
        expect(octaveMark(-1)).toBe('1');
        expect(octaveMark(-2)).toBe('2');
    });
});

describe('entering a pitch at a chosen octave', () => {
    it('writes the octave with the syllable in one edit', () => {
        const outcome = insertSyllable(createEmptyScoreDocument(), SOPRANO, 'd', octaveMark(1));

        expect(outcome.document.voices.soprano).toBe(":d'");
        expect(outcome.position).toEqual({ part: 'soprano', offset: 3 });
    });

    it('keeps the duration in force for the note after it', () => {
        const first = insertSyllable(createEmptyScoreDocument(), SOPRANO, 'd', octaveMark(-2));
        const second = insertSyllable(first.document, first.position, 'r', octaveMark(2));

        expect(first.document.voices.soprano).toBe(':d2');
        expect(second.document.voices.soprano).toBe(":d2r''");
        expect(second.position).toEqual({ part: 'soprano', offset: 6 });
    });
});
