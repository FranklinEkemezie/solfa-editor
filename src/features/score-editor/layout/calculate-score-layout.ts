import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';

export type MeasureLayout = {
    measureId: string;
    number: number;
    slotCount: number;
    width: number;
};

export type ScoreLayout = {
    measures: MeasureLayout[];
    minimumWidth: number;
};

const MINIMUM_MEASURE_WIDTH = 156;
const SLOT_WIDTH = 46;
/** Extra room each subdivision mark needs inside a beat. */
const SUBDIVISION_MARK_WIDTH = 8;

export function calculateScoreLayout(document: EditorDocument): ScoreLayout {
    const measures = document.measures
        .filter((measure) => measure.part === 'soprano')
        .sort((left, right) => left.number - right.number)
        .map((measure) => toMeasureLayout(measure));
    return {
        measures,
        minimumWidth: measures.reduce((total, measure) => total + measure.width, 0),
    };
}

/**
 * The beats of a measure share its width evenly, which is what keeps the four
 * parts lined up beat for beat. So every beat has to be as wide as the fullest
 * one: a measure of `d,r.m,f` gives all four of its beats room for a divided
 * beat rather than squeezing the four notes of the first one together.
 */
function toMeasureLayout(measure: EditorMeasure): MeasureLayout {
    const widestBeat = measure.slots.reduce(
        (widest, slot) =>
            Math.max(
                widest,
                SLOT_WIDTH + Math.max(0, slot.notes.length - 1) * SUBDIVISION_MARK_WIDTH,
            ),
        SLOT_WIDTH,
    );
    return {
        measureId: measure.id,
        number: measure.number,
        slotCount: measure.slots.length,
        width: Math.max(MINIMUM_MEASURE_WIDTH, measure.slots.length * widestBeat + 18),
    };
}
