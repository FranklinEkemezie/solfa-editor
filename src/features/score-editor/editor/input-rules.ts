import {
    divisionForMark,
    isSolfaSyllable,
    refineDivision,
    type BeatDivision,
    type SolfaSyllable,
} from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { advanceCursor } from '@/features/score-editor/state/advance-cursor';
import { findMeasure, type EditorPosition } from '@/features/score-editor/state/editor-position';
import {
    appendNote,
    continueBeat,
    setBeatDivision,
} from '@/features/score-editor/state/score-slot-commands';

export type InputResult = {
    document: EditorDocument;
    position: EditorPosition;
    status?: string;
    rejected?: string;
};

const DIVISION_LABELS: Record<BeatDivision, string> = {
    1: 'a whole beat',
    2: 'two',
    4: 'four',
};

function beatAt(document: EditorDocument, position: EditorPosition) {
    return findMeasure(document, position.measureId)?.slots[position.slotIndex];
}

/**
 * The beat the next note belongs to.
 *
 * A note joins the beat under the caret while that beat still has an unwritten
 * division left over; otherwise the caret steps on to the next beat first. This
 * is what makes `.` and `,` keep the following notes in the same beat.
 */
function beatWithRoom(
    document: EditorDocument,
    position: EditorPosition,
): { document: EditorDocument; position: EditorPosition } {
    const beat = beatAt(document, position);
    if (beat && beat.notes.length < beat.division) return { document, position };

    const step = advanceCursor(document, position);
    return { document: step.document, position: step.position };
}

/**
 * Apply one sol-fa token at the caret.
 *
 * Notes advance the caret only once the beat is full; `.` and `,` never advance
 * because they refine the beat the caret is already on.
 */
export function interpretInput(
    document: EditorDocument,
    position: EditorPosition,
    key: string,
): InputResult {
    const normalized = key.toLowerCase();

    if (isSolfaSyllable(normalized)) return placeNote(document, position, normalized);

    const requested = divisionForMark(key);
    if (requested) return refineBeat(document, position, requested, key);

    if (key === '-') return placeContinuation(document, position);

    return { document, position, rejected: `“${key}” is not a supported sol-fa input.` };
}

function placeNote(
    document: EditorDocument,
    position: EditorPosition,
    syllable: SolfaSyllable,
): InputResult {
    const target = beatWithRoom(document, position);
    return {
        document: appendNote(target.document, target.position, { syllable }),
        position: target.position,
    };
}

function placeContinuation(document: EditorDocument, position: EditorPosition): InputResult {
    const target = beatWithRoom(document, position);
    const next = continueBeat(target.document, target.position);
    if (!next) {
        return {
            document,
            position,
            rejected: 'A continuation needs a note immediately before it.',
        };
    }
    return { document: next, position: target.position };
}

function refineBeat(
    document: EditorDocument,
    position: EditorPosition,
    requested: BeatDivision,
    mark: string,
): InputResult {
    const beat = beatAt(document, position);
    if (!beat) return { document, position, rejected: 'No rhythmic position is active.' };

    const division = refineDivision(beat.division, requested);
    if (division === beat.division) {
        return {
            document,
            position,
            status: `A ${mark === ',' ? 'comma' : 'dot'} cannot divide this beat any further.`,
        };
    }

    return {
        document: setBeatDivision(document, position, division),
        position,
        status: `Beat divided into ${DIVISION_LABELS[division]}.`,
    };
}
