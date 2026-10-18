import { PARTS, type PartId } from '@/domain/music';
import type {
    EditorDocument,
    EditorMeasure,
    EditorSlot,
} from '@/features/score-editor/adapters/editor-document-schema';

/** Width of the column that carries the part labels. */
export const PRINT_LABEL_COLUMN = '34pt';

/** Room one written note needs, in points. */
const BEAT_WIDTH_PT = 20;
/** Room each subdivision mark adds to its beat. */
const MARK_WIDTH_PT = 4;
const CELL_PADDING_PT = 12;
const MINIMUM_MEASURE_PT = 56;

function beatWidth(beat: EditorSlot): number {
    return BEAT_WIDTH_PT + Math.max(0, beat.notes.length - 1) * MARK_WIDTH_PT;
}

function measureFor(
    document: EditorDocument,
    part: PartId,
    number: number,
): EditorMeasure | undefined {
    return document.measures.find((measure) => measure.part === part && measure.number === number);
}

function partMeasures(document: EditorDocument, number: number): EditorMeasure[] {
    return PARTS.map((part) => measureFor(document, part.id, number)).filter(
        (measure): measure is EditorMeasure => Boolean(measure),
    );
}

/**
 * Room a measure needs, in points.
 *
 * The beats of a measure are laid out at one even width, which is what keeps
 * the four parts aligned beat for beat, so every beat is sized from the widest
 * beat any part writes in that measure.
 */
function measureWidthPt(document: EditorDocument, number: number): number {
    const measures = partMeasures(document, number);
    if (measures.length === 0) return MINIMUM_MEASURE_PT;

    const widestBeat = Math.max(
        ...measures.flatMap((measure) => measure.slots.map((slot) => beatWidth(slot))),
    );
    const beatCount = Math.max(...measures.map((measure) => measure.slots.length));

    return Math.max(MINIMUM_MEASURE_PT, CELL_PADDING_PT + beatCount * widestBeat);
}

/**
 * The column template every printed row shares, so the beats of the four parts
 * stay vertically aligned and a divided beat such as `d,r.m,f` has the room its
 * four notes need.
 */
export function printGridTemplate(document: EditorDocument, measures: EditorMeasure[]): string {
    const columns = measures.map(
        (measure) => `minmax(${Math.round(measureWidthPt(document, measure.number))}pt, 1fr)`,
    );

    return [PRINT_LABEL_COLUMN, ...columns].join(' ');
}
