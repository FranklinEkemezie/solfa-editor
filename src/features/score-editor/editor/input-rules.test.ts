import { describe, expect, it } from 'vitest';
import { createEmptyScore } from '@/domain/music';
import type {
    EditorDocument,
    EditorSlot,
} from '@/features/score-editor/adapters/editor-document-schema';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import { interpretInput } from '@/features/score-editor/editor/input-rules';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

function newDocument(): EditorDocument {
    return domainToEditor(createEmptyScore());
}

function beat(
    document: EditorDocument,
    measureId: string,
    slotIndex: number,
): EditorSlot | undefined {
    return document.measures.find((measure) => measure.id === measureId)?.slots[slotIndex];
}

function syllables(document: EditorDocument, measureId: string, slotIndex: number) {
    return beat(document, measureId, slotIndex)?.notes.map((note) => note.syllable);
}

function type(
    document: EditorDocument,
    position: EditorPosition,
    keys: string[],
): { document: EditorDocument; position: EditorPosition } {
    let current = document;
    let caret = position;
    for (const key of keys) {
        const result = interpretInput(current, caret, key);
        current = result.document;
        caret = result.position;
    }
    return { document: current, position: caret };
}

describe('interpretInput', () => {
    it('writes a note and holds the caret on its beat until the next note', () => {
        const document = newDocument();
        const result = interpretInput(document, { measureId: 'soprano-1', slotIndex: 0 }, 'de');

        expect(syllables(result.document, 'soprano-1', 0)).toEqual(['de']);
        expect(result.position).toEqual({ measureId: 'soprano-1', slotIndex: 0 });
    });

    it('advances to a fresh beat when the next note cannot join the current one', () => {
        const typed = type(newDocument(), { measureId: 'soprano-1', slotIndex: 0 }, ['d', 'r']);

        expect(syllables(typed.document, 'soprano-1', 0)).toEqual(['d']);
        expect(syllables(typed.document, 'soprano-1', 1)).toEqual(['r']);
        expect(typed.position).toEqual({ measureId: 'soprano-1', slotIndex: 1 });
    });

    it('holds a dot and the next note in the same beat', () => {
        const typed = type(newDocument(), { measureId: 'soprano-1', slotIndex: 0 }, [
            'd',
            '.',
            'r',
        ]);

        expect(beat(typed.document, 'soprano-1', 0)?.division).toBe(2);
        expect(syllables(typed.document, 'soprano-1', 0)).toEqual(['d', 'r']);
        expect(syllables(typed.document, 'soprano-1', 1)).toEqual([]);
    });

    it('holds a comma and three further notes in the same beat', () => {
        const typed = type(newDocument(), { measureId: 'soprano-1', slotIndex: 0 }, [
            'd',
            ',',
            'r',
            'm',
            'f',
        ]);

        expect(beat(typed.document, 'soprano-1', 0)?.division).toBe(4);
        expect(syllables(typed.document, 'soprano-1', 0)).toEqual(['d', 'r', 'm', 'f']);
    });

    it('never divides a beat more finely than a comma', () => {
        const typed = type(newDocument(), { measureId: 'soprano-1', slotIndex: 0 }, [
            'd',
            ',',
            '.',
        ]);

        expect(beat(typed.document, 'soprano-1', 0)?.division).toBe(4);
    });

    it('appends a measure instead of stopping at the end of the score', () => {
        const typed = type(newDocument(), { measureId: 'soprano-2', slotIndex: 3 }, ['d', 'r']);

        expect(typed.document.measures.some((measure) => measure.id === 'soprano-3')).toBe(true);
        expect(typed.position).toEqual({ measureId: 'soprano-3', slotIndex: 0 });
    });

    it('rejects unsupported input without altering the score', () => {
        const document = newDocument();
        const result = interpretInput(document, { measureId: 'soprano-1', slotIndex: 0 }, 'z');

        expect(result.rejected).toBeTruthy();
        expect(result.document).toBe(document);
    });

    it('prolongs a note into the next beat with a continuation', () => {
        const typed = type(newDocument(), { measureId: 'soprano-1', slotIndex: 0 }, ['d', '-']);

        expect(syllables(typed.document, 'soprano-1', 0)).toEqual(['d']);
        expect(beat(typed.document, 'soprano-1', 1)?.notes[0]).toMatchObject({
            syllable: 'd',
            continuation: true,
        });
    });

    it('lets a written note override a continuation', () => {
        const typed = type(newDocument(), { measureId: 'soprano-1', slotIndex: 0 }, [
            'd',
            '-',
            'm',
        ]);

        expect(syllables(typed.document, 'soprano-1', 1)).toEqual(['m']);
        expect(beat(typed.document, 'soprano-1', 1)?.notes[0].continuation).toBeFalsy();
    });
});
