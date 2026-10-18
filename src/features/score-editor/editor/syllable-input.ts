import { isSolfaSyllable, SOLFA_SYLLABLES, type SolfaSyllable } from '@/domain/music';
import { interpretInput, type InputResult } from '@/features/score-editor/editor/input-rules';
import {
    findMeasure,
    type EditorPosition,
} from '@/features/score-editor/state/editor-position';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { replaceLastNoteSyllable } from '@/features/score-editor/state/score-slot-commands';

/**
 * The first letter of a syllable that only becomes a note once a second letter
 * completes it. Only `b` qualifies: it starts `ba` but is not itself a note.
 */
export type PendingSyllable = string | null;

export type ComposeResult = InputResult & { pending: PendingSyllable };

const CHROMATIC_PREFIXES: ReadonlySet<string> = new Set(
    SOLFA_SYLLABLES.filter((syllable) => syllable.length > 1).map((syllable) => syllable[0]),
);

function isSyllablePrefix(letter: string): boolean {
    return CHROMATIC_PREFIXES.has(letter) && !isSolfaSyllable(letter);
}

/** Respell the note under the caret with a trailing `e`/`a`, or null when it cannot. */
function extendLastNote(
    document: EditorDocument,
    position: EditorPosition,
    letter: string,
): { document: EditorDocument; syllable: SolfaSyllable } | null {
    const beat = findMeasure(document, position.measureId)?.slots[position.slotIndex];
    const last = beat?.notes[beat.notes.length - 1];
    if (!last?.syllable) return null;

    const combined = `${last.syllable}${letter}`;
    if (!isSolfaSyllable(combined)) return null;

    const next = replaceLastNoteSyllable(document, position, combined);
    return next ? { document: next, syllable: combined } : null;
}

/**
 * Turn a physical key press into a sol-fa edit.
 *
 * A syllable that doubles as the first letter of a chromatic one (`d` → `de`)
 * is written immediately and respelled when the vowel arrives, so typing stays
 * one key per note. A letter that only starts a syllable (`b` → `ba`) waits for
 * its second letter instead of being written as an error.
 */
export function composeKey(
    document: EditorDocument,
    position: EditorPosition,
    pending: PendingSyllable,
    key: string,
): ComposeResult {
    const lower = key.toLowerCase();

    if (pending) {
        const combined = `${pending}${lower}`;
        if (isSolfaSyllable(combined)) {
            return { ...interpretInput(document, position, combined), pending: null };
        }
        // The pending first letter was abandoned; read this key on its own.
        return composeKey(document, position, null, key);
    }

    if (isSyllablePrefix(lower)) {
        return { document, position, pending: lower };
    }

    const extended = extendLastNote(document, position, lower);
    if (extended) {
        return {
            document: extended.document,
            position,
            pending: null,
            status: `Note respelled as ${extended.syllable}.`,
        };
    }

    if (isSolfaSyllable(lower)) {
        return { ...interpretInput(document, position, lower), pending: null };
    }

    return { ...interpretInput(document, position, key), pending: null };
}
