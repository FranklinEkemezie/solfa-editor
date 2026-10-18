import { describe, expect, it } from 'vitest';
import { createEmptyScore } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import { interpretInput } from '@/features/score-editor/editor/input-rules';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';
import {
    canClearBeat,
    canClearLastNote,
    isContinuationOnly,
    isSustainedByNextPosition,
} from '@/features/score-editor/state/score-slot-commands';

function newDocument(): EditorDocument {
    return domainToEditor(createEmptyScore());
}

/** Type a run of tokens at `soprano-1`, starting from its first beat. */
function type(keys: string[], measureId = 'soprano-1'): EditorDocument {
    let document = newDocument();
    let position: EditorPosition = { measureId, slotIndex: 0 };
    for (const key of keys) {
        const result = interpretInput(document, position, key);
        document = result.document;
        position = result.position;
    }
    return document;
}

const first: EditorPosition = { measureId: 'soprano-1', slotIndex: 0 };
const second: EditorPosition = { measureId: 'soprano-1', slotIndex: 1 };
const third: EditorPosition = { measureId: 'soprano-1', slotIndex: 2 };

describe('continuation guards', () => {
    const sustained = type(['d', '-', '-']);

    it('recognises a beat that holds nothing but a continuation', () => {
        expect(isContinuationOnly(sustained, first)).toBe(false);
        expect(isContinuationOnly(sustained, second)).toBe(true);
    });

    it('reports the beat immediately before a continuation as sustained', () => {
        expect(isSustainedByNextPosition(sustained, first)).toBe(true);
        expect(isSustainedByNextPosition(sustained, second)).toBe(true);
        expect(isSustainedByNextPosition(sustained, third)).toBe(false);
    });

    it('refuses to clear a note while the next beat still continues it', () => {
        expect(canClearLastNote(sustained, first)).toBe(false);
        expect(canClearLastNote(sustained, second)).toBe(false);
    });

    it('allows the trailing continuation to be cleared', () => {
        expect(canClearLastNote(sustained, third)).toBe(true);
        expect(canClearBeat(sustained, third)).toBe(true);
    });

    it('allows a whole beat that nothing continues', () => {
        const plain = type(['d', 'r']);
        expect(canClearBeat(plain, first)).toBe(true);
        expect(canClearLastNote(plain, first)).toBe(true);
    });

    it('treats an empty beat as clearable but nothing to remove', () => {
        const empty = newDocument();
        expect(canClearBeat(empty, first)).toBe(true);
        expect(canClearLastNote(empty, first)).toBe(false);
    });
});
