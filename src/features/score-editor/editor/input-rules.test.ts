import { describe, expect, it } from 'vitest';
import { createEmptyScore } from '@/domain/music';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import { interpretInput } from '@/features/score-editor/editor/input-rules';

function newDocument() {
    return domainToEditor(createEmptyScore());
}

describe('interpretInput', () => {
    it('enters a chromatic syllable and advances the caret', () => {
        const document = newDocument();
        const result = interpretInput(document, { measureId: 'soprano-1', slotIndex: 0 }, 'de');

        const measure = result.document.measures.find((candidate) => candidate.id === 'soprano-1');
        expect(measure?.slots[0].syllable).toBe('de');
        expect(result.position).toEqual({ measureId: 'soprano-1', slotIndex: 1 });
    });

    it('appends a measure instead of stopping at the end of the score', () => {
        const document = newDocument();
        const result = interpretInput(document, { measureId: 'soprano-2', slotIndex: 3 }, 'd');

        expect(result.document.measures.some((measure) => measure.id === 'soprano-3')).toBe(true);
        expect(result.position).toEqual({ measureId: 'soprano-3', slotIndex: 0 });
    });

    it('rejects unsupported input without altering the score', () => {
        const document = newDocument();
        const result = interpretInput(document, { measureId: 'soprano-1', slotIndex: 0 }, 'z');

        expect(result.rejected).toBeTruthy();
        expect(result.document).toBe(document);
    });
});
