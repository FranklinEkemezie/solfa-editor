import { describe, expect, it } from 'vitest';
import { createEmptyScore } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import type { InputResult } from '@/features/score-editor/editor/input-rules';
import { composeKey, type PendingSyllable } from '@/features/score-editor/editor/syllable-input';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

const START: EditorPosition = { measureId: 'soprano-1', slotIndex: 0 };

function newDocument(): EditorDocument {
    return domainToEditor(createEmptyScore());
}

function beat(document: EditorDocument, slotIndex: number) {
    return document.measures.find((measure) => measure.id === 'soprano-1')?.slots[slotIndex];
}

function press(
    document: EditorDocument,
    position: EditorPosition,
    pending: PendingSyllable,
    keys: string[],
): { document: EditorDocument; position: EditorPosition; pending: PendingSyllable } {
    let state: InputResult & { pending: PendingSyllable } = {
        document,
        position,
        pending,
    };
    for (const key of keys) {
        state = composeKey(state.document, state.position, state.pending, key);
    }
    return state;
}

describe('composeKey', () => {
    it('respells a natural note when its vowel follows', () => {
        const typed = press(newDocument(), START, null, ['d', 'e']);

        expect(beat(typed.document, 0)?.notes.map((note) => note.syllable)).toEqual(['de']);
        expect(typed.pending).toBeNull();
    });

    it('respells every chromatic pair the keyboard cannot type in one key', () => {
        for (const [letters, syllable] of [
            [['d', 'e'], 'de'],
            [['r', 'e'], 're'],
            [['m', 'a'], 'ma'],
            [['f', 'e'], 'fe'],
            [['s', 'e'], 'se'],
            [['t', 'a'], 'ta'],
        ] as const) {
            const typed = press(newDocument(), START, null, [...letters]);
            expect(beat(typed.document, 0)?.notes[0].syllable).toBe(syllable);
        }
    });

    it('waits for the second letter of b-a before writing anything', () => {
        const first = press(newDocument(), START, null, ['b']);

        expect(first.pending).toBe('b');
        expect(beat(first.document, 0)?.notes).toHaveLength(0);

        const second = press(first.document, first.position, first.pending, ['a']);
        expect(beat(second.document, 0)?.notes[0].syllable).toBe('ba');
    });

    it('treats two plain naturals as two separate beats', () => {
        const typed = press(newDocument(), START, null, ['d', 'r']);

        expect(beat(typed.document, 0)?.notes.map((note) => note.syllable)).toEqual(['d']);
        expect(beat(typed.document, 1)?.notes.map((note) => note.syllable)).toEqual(['r']);
    });
});
