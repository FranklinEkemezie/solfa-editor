import { isSolfaSyllable, NoteValue } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import {
    advancePosition,
    type EditorPosition,
} from '@/features/score-editor/state/editor-position';
import {
    continueSlot,
    replaceSlot,
    setSlotDuration,
} from '@/features/score-editor/state/score-slot-commands';

export type InputResult = {
    document: EditorDocument;
    position: EditorPosition;
    status?: string;
    rejected?: string;
};

export function interpretInput(
    document: EditorDocument,
    position: EditorPosition,
    key: string,
): InputResult {
    const normalized = key.toLowerCase();

    if (isSolfaSyllable(normalized)) {
        const nextDocument = replaceSlot(document, position, normalized);
        return { document: nextDocument, position: advancePosition(nextDocument, position) };
    }

    if (key === '.') {
        const nextDocument = setSlotDuration(document, position, NoteValue.HALF);
        return nextDocument
            ? {
                  document: nextDocument,
                  position: advancePosition(nextDocument, position),
                  status: 'Half-note duration applied.',
              }
            : { document, position, rejected: 'No rhythmic position is active.' };
    }

    if (key === ',') {
        const nextDocument = setSlotDuration(document, position, NoteValue.QUARTER);
        return nextDocument
            ? {
                  document: nextDocument,
                  position: advancePosition(nextDocument, position),
                  status: 'Quarter-note duration applied.',
              }
            : { document, position, rejected: 'No rhythmic position is active.' };
    }

    if (key === '-') {
        const nextDocument = continueSlot(document, position);
        return nextDocument
            ? { document: nextDocument, position: advancePosition(nextDocument, position) }
            : {
                  document,
                  position,
                  rejected: 'A continuation needs a note immediately before it.',
              };
    }

    return { document, position, rejected: `“${key}” is not a supported sol-fa input.` };
}
