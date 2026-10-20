import { PARTS, type PartId } from '@/domain/parts';
import type { ScoreDocument } from '@/domain/score-document';
import { clampOffset } from '@/features/notation/source-position';
import type { Token } from '@/features/notation/tokens';

/** Where the writer is: one voice, and a character position in its source. */
export type EditorPosition = {
    readonly part: PartId;
    readonly offset: number;
};

export function caretAt(part: PartId, source: string, offset: number): EditorPosition {
    return { part, offset: clampOffset(source, offset) };
}

/** The position a document opens at: the end of the soprano's line. */
export function caretAtEnd(document: ScoreDocument, part: PartId = 'soprano'): EditorPosition {
    return { part, offset: document.voices[part].length };
}

/** The end of the first token that begins after `offset`. */
export function offsetAfter(tokens: readonly Token[], offset: number, length: number): number {
    const token = tokens.find((candidate) => candidate.range.end > offset);
    return token ? token.range.end : length;
}

/** The start of the last token that begins before `offset`. */
export function offsetBefore(tokens: readonly Token[], offset: number): number {
    let previous = 0;
    for (const token of tokens) {
        if (token.range.start >= offset) break;
        previous = token.range.start;
    }
    return previous;
}

/** Move to the voice above or below, keeping the character position where possible. */
export function siblingCaret(
    document: ScoreDocument,
    position: EditorPosition,
    step: -1 | 1,
): EditorPosition {
    const index = PARTS.findIndex((part) => part.id === position.part);
    const sibling = PARTS[index + step];
    if (!sibling) return position;
    return caretAt(sibling.id, document.voices[sibling.id], position.offset);
}
