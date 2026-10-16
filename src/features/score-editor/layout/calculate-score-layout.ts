import type { EditorDocument, EditorMeasure } from '../adapters/editor-document-schema';

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

function toMeasureLayout(measure: EditorMeasure): MeasureLayout {
    return {
        measureId: measure.id,
        number: measure.number,
        slotCount: measure.slots.length,
        width: Math.max(MINIMUM_MEASURE_WIDTH, measure.slots.length * SLOT_WIDTH + 18),
    };
}
