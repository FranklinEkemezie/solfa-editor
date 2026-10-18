import { type BeatDivision, type SolfaSyllable } from '@/domain/music';
import type {
    EditorDocument,
    EditorNote,
    EditorSlot,
} from '@/features/score-editor/adapters/editor-document-schema';
import {
    advancePosition,
    findMeasure,
    previousPosition,
    type EditorPosition,
} from '@/features/score-editor/state/editor-position';
import { mapMeasure } from '@/features/score-editor/state/measure-mapping';
import { createNoteId } from '@/features/score-editor/state/note-id';

function mapBeat(
    document: EditorDocument,
    position: EditorPosition,
    mapper: (slot: EditorSlot) => EditorSlot,
): EditorDocument {
    return mapMeasure(document, position.measureId, (measure) => ({
        ...measure,
        slots: measure.slots.map((slot, index) =>
            index === position.slotIndex ? mapper(slot) : slot,
        ),
    }));
}

function beatAt(document: EditorDocument, position: EditorPosition): EditorSlot | undefined {
    return findMeasure(document, position.measureId)?.slots[position.slotIndex];
}

/** Append a note to the end of a beat. */
export function appendNote(
    document: EditorDocument,
    position: EditorPosition,
    note: Omit<EditorNote, 'id'>,
): EditorDocument {
    const beat = beatAt(document, position);
    const id = createNoteId(beat?.id ?? position.measureId);
    return mapBeat(document, position, (slot) => ({
        ...slot,
        notes: [...slot.notes, { ...note, id }],
    }));
}

/** Respell the most recently written note of a beat, for chromatic entry. */
export function replaceLastNoteSyllable(
    document: EditorDocument,
    position: EditorPosition,
    syllable: SolfaSyllable,
): EditorDocument | null {
    const beat = beatAt(document, position);
    if (!beat || beat.notes.length === 0) return null;

    return mapBeat(document, position, (slot) => ({
        ...slot,
        notes: slot.notes.map((note, index) =>
            index === slot.notes.length - 1 ? { ...note, syllable, continuation: false } : note,
        ),
    }));
}

/** Set how finely a beat is divided. */
export function setBeatDivision(
    document: EditorDocument,
    position: EditorPosition,
    division: BeatDivision,
): EditorDocument {
    return mapBeat(document, position, (slot) => ({ ...slot, division }));
}

/** Empty a beat and return it to a plain, undivided beat. */
export function clearBeat(document: EditorDocument, position: EditorPosition): EditorDocument {
    return mapBeat(document, position, (slot) => ({ ...slot, division: 1, notes: [] }));
}

/** Remove the most recently written note of a beat. */
export function clearLastNote(document: EditorDocument, position: EditorPosition): EditorDocument {
    return mapBeat(document, position, (slot) => {
        const notes = slot.notes.slice(0, -1);
        return { ...slot, notes, division: notes.length > 0 ? slot.division : 1 };
    });
}

/**
 * The note a continuation would prolong: the last note of the current beat, or
 * the last note of the previous beat when the current one is still empty.
 */
export function lastNote(
    document: EditorDocument,
    position: EditorPosition,
): EditorNote | undefined {
    const beat = beatAt(document, position);
    if (beat && beat.notes.length > 0) return beat.notes[beat.notes.length - 1];

    const previous = previousPosition(document, position);
    const previousBeat = beatAt(document, previous);
    return previousBeat?.notes[previousBeat.notes.length - 1];
}

/** Prolong the previous note into the current beat. */
export function continueBeat(
    document: EditorDocument,
    position: EditorPosition,
): EditorDocument | null {
    const previous = lastNote(document, position);
    if (!previous?.syllable) return null;
    return appendNote(document, position, { syllable: previous.syllable, continuation: true });
}

/** True when a beat holds nothing but a continuation of the note before it. */
export function isContinuationOnly(document: EditorDocument, position: EditorPosition): boolean {
    const beat = beatAt(document, position);
    return Boolean(beat && beat.notes.length === 1 && beat.notes[0].continuation);
}

/**
 * True when the position right after this one opens with a continuation.
 *
 * A continuation sustains the note immediately before it, so emptying this
 * position would leave that continuation with nothing to sustain.
 */
export function isSustainedByNextPosition(
    document: EditorDocument,
    position: EditorPosition,
): boolean {
    const next = advancePosition(document, position);
    if (next.measureId === position.measureId && next.slotIndex === position.slotIndex)
        return false;
    return Boolean(beatAt(document, next)?.notes[0]?.continuation);
}

/** Emptying a whole beat is refused while the next position still continues it. */
export function canClearBeat(document: EditorDocument, position: EditorPosition): boolean {
    const beat = beatAt(document, position);
    if (!beat || beat.notes.length === 0) return true;
    return !isSustainedByNextPosition(document, position);
}

/** Removing the last note of a beat is refused while the next position continues it. */
export function canClearLastNote(document: EditorDocument, position: EditorPosition): boolean {
    const beat = beatAt(document, position);
    if (!beat || beat.notes.length === 0) return false;
    if (beat.notes.length > 1) return true;
    return !isSustainedByNextPosition(document, position);
}

/**
 * Replace everything written in a beat with a single note.
 *
 * This is how a note overrides a continuation: the continuation is not a note
 * in its own right, so writing on top of it substitutes rather than follows.
 */
export function overrideBeat(
    document: EditorDocument,
    position: EditorPosition,
    note: Omit<EditorNote, 'id'>,
): EditorDocument {
    const beat = beatAt(document, position);
    const id = createNoteId(beat?.id ?? position.measureId);
    return mapBeat(document, position, (slot) => ({
        ...slot,
        division: 1,
        notes: [{ ...note, id }],
    }));
}
