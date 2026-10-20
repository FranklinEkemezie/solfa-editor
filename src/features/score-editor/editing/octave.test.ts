import { describe, expect, it } from 'vitest';
import { createEmptyScoreDocument, withVoice } from '@/domain/music';
import { insertSyllable, setNoteOctave } from '@/features/score-editor/editing/notation-editing';
import {
    nextOctaveStep,
    octaveMark,
    octaveStatus,
    type OctaveStep,
} from '@/features/score-editor/editing/octave';

const SOPRANO = { part: 'soprano' as const, offset: 0 };

function at(offset: number) {
    return { part: 'soprano' as const, offset };
}

function written(source: string) {
    return withVoice(createEmptyScoreDocument(), 'soprano', source);
}

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

describe('moving the note at the caret', () => {
    it('applies the chosen register to the note that was just written', () => {
        const outcome = setNoteOctave(written(':d'), at(2), octaveMark(1));

        expect(outcome?.document.voices.soprano).toBe(":d'");
        expect(outcome?.position).toEqual(at(3));
        expect(outcome?.changed).toBe(true);
    });

    it('replaces an octave mark instead of stacking another one', () => {
        expect(setNoteOctave(written(":d'"), at(3), octaveMark(2))?.document.voices.soprano).toBe(
            ":d''",
        );
        expect(setNoteOctave(written(":d''"), at(4), octaveMark(-1))?.document.voices.soprano).toBe(
            ':d1',
        );
        expect(setNoteOctave(written(':d2'), at(3), octaveMark(0))?.document.voices.soprano).toBe(
            ':d',
        );
    });

    it('keeps accidentals and moves the octave to the end of the note', () => {
        const outcome = setNoteOctave(written(":d#'"), at(4), octaveMark(-2));

        expect(outcome?.document.voices.soprano).toBe(':d#2');
        expect(outcome?.position).toEqual(at(4));
    });

    it('does nothing when the caret is not after a note', () => {
        expect(setNoteOctave(createEmptyScoreDocument(), SOPRANO, octaveMark(1))).toBeNull();
        expect(setNoteOctave(written(':d '), at(3), octaveMark(1))).toBeNull();
        expect(setNoteOctave(written(':d-'), at(3), octaveMark(1))).toBeNull();
    });

    it('reports no change when the note already carries that mark', () => {
        const document = written(":d'");
        const outcome = setNoteOctave(document, at(3), octaveMark(1));

        expect(outcome?.changed).toBe(false);
        expect(outcome?.document).toBe(document);
    });
});

describe('octaveStatus', () => {
    it('names the register the keys will write in', () => {
        expect(octaveStatus(0)).toContain('own octave');
        expect(octaveStatus(1)).toContain('one octave up');
        expect(octaveStatus(2)).toContain('two octaves up');
        expect(octaveStatus(-1)).toContain('one octave down');
        expect(octaveStatus(-2)).toContain('two octaves down');
    });
});
