import { describe, expect, it } from 'vitest';
import { createEmptyScore, PARTS } from '@/domain/music';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import { advanceCursor } from '@/features/score-editor/state/advance-cursor';

function newDocument() {
    return domainToEditor(createEmptyScore());
}

describe('advanceCursor', () => {
    it('moves within a measure without touching the score', () => {
        const document = newDocument();
        const step = advanceCursor(document, { measureId: 'soprano-1', slotIndex: 0 });

        expect(step.document).toBe(document);
        expect(step.position).toEqual({ measureId: 'soprano-1', slotIndex: 1 });
    });

    it('crosses into the next existing measure', () => {
        const document = newDocument();
        const step = advanceCursor(document, { measureId: 'soprano-1', slotIndex: 3 });

        expect(step.document).toBe(document);
        expect(step.position).toEqual({ measureId: 'soprano-2', slotIndex: 0 });
    });

    it('appends a measure for every part at the end of the score', () => {
        const document = newDocument();
        const step = advanceCursor(document, { measureId: 'soprano-2', slotIndex: 3 });

        expect(step.document).not.toBe(document);
        expect(step.position).toEqual({ measureId: 'soprano-3', slotIndex: 0 });
        const appended = step.document.measures.filter((measure) => measure.number === 3);
        expect(appended.map((measure) => measure.part).sort()).toEqual(
            PARTS.map((part) => part.id).sort(),
        );
    });
});
