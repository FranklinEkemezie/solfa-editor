import { PARTS } from '@/domain/parts';
import type { BeatView, ScoreView } from '@/features/score-editor/model/score-view';
import {
    PAGE_CONTENT_WIDTH_PX,
    PART_LABEL_WIDTH_PX,
    SYSTEM_BARLINE_PX,
    SYSTEM_GAP_PX,
    SYSTEM_HEIGHT_PX,
    systemRoomPx,
} from '@/features/score-editor/layout/page-geometry';

/** Room one written note needs inside its beat. */
const SLOT_WIDTH = 28;
/** Extra room each subdivision mark needs between two notes of a beat. */
const SUBDIVISION_MARK_WIDTH = 5;
/** The barline and breathing space around the beats of a measure. */
const MEASURE_PADDING = 8;
const MINIMUM_MEASURE_WIDTH = 96;
/**
 * The last line of a score is left ragged unless it is already mostly full.
 * Stretching three bars across a whole page is what makes a short score look
 * sparse; a printed score leaves the final line as wide as its music.
 */
const LAST_SYSTEM_FILL_THRESHOLD = 0.6;

/** One measure's column in a system. */
export type MeasureLayout = {
    number: number;
    width: number;
};

/** A line of measures, as many as the page is wide. */
export type ScoreSystem = {
    measures: MeasureLayout[];
};

/** One A4 page of systems. Only the first carries the title block. */
export type ScorePage = {
    number: number;
    systems: ScoreSystem[];
    showsMasthead: boolean;
};

export type ScoreLayout = {
    pages: ScorePage[];
};

/**
 * Lay the score out as sheets of paper.
 *
 * Each measure is measured from its own music, then the measures are packed
 * into lines. The spare width on a line is shared between that line's measures,
 * so a wide measure only makes its own neighbours a little wider; it no longer
 * sets the width of every measure on every page.
 */
export function calculateScoreLayout(view: ScoreView): ScoreLayout {
    const measures = view.measureNumbers.map((number) => ({
        number,
        width: naturalWidth(view, number),
    }));

    return { pages: paginate(packSystems(measures)) };
}

/** The width a system has for its measures. */
function measureRoomPx(): number {
    return PAGE_CONTENT_WIDTH_PX - PART_LABEL_WIDTH_PX - SYSTEM_BARLINE_PX;
}

/**
 * Pack measures into systems, keeping each measure close to the width its own
 * notes need. The line is then justified, but only within itself.
 */
function packSystems(measures: readonly MeasureLayout[]): ScoreSystem[] {
    const room = measureRoomPx();
    const systems: ScoreSystem[] = [];
    let current: MeasureLayout[] = [];
    let used = 0;

    for (const measure of measures) {
        const width = Math.min(room, Math.max(MINIMUM_MEASURE_WIDTH, Math.round(measure.width)));

        if (current.length > 0 && used + width > room) {
            systems.push({ measures: justify(current, room) });
            current = [];
            used = 0;
        }

        current.push({ number: measure.number, width });
        used += width;
    }

    if (current.length > 0) {
        systems.push({
            measures:
                used >= room * LAST_SYSTEM_FILL_THRESHOLD
                    ? justify(current, room)
                    : current.map((measure) => ({ ...measure })),
        });
    }

    return systems;
}

/**
 * Share a line's spare width between its measures in proportion to what each
 * one already needs. Rounding stays integral, with the last measure taking the
 * remainder, so the barlines land on whole pixels.
 */
function justify(measures: readonly MeasureLayout[], room: number): MeasureLayout[] {
    const total = measures.reduce((sum, measure) => sum + measure.width, 0);
    if (total <= 0 || total >= room) return measures.map((measure) => ({ ...measure }));

    const extra = room - total;
    let shared = 0;

    return measures.map((measure, index) => {
        if (index === measures.length - 1) {
            return { number: measure.number, width: measure.width + extra - shared };
        }

        const addition = Math.floor(extra * (measure.width / total));
        shared += addition;
        return { number: measure.number, width: measure.width + addition };
    });
}

function naturalWidth(view: ScoreView, number: number): number {
    let beatCount = 0;
    let widestBeat = SLOT_WIDTH;

    for (const part of PARTS) {
        const measure = view.parts[part.id].measures[number - 1];
        if (!measure) continue;
        beatCount = Math.max(beatCount, measure.beats.length);
        for (const beat of measure.beats) {
            widestBeat = Math.max(widestBeat, SLOT_WIDTH + markRoom(beat));
        }
    }

    return beatCount * widestBeat + MEASURE_PADDING;
}

/** The beats of a measure share its width, so every beat is as wide as the fullest one. */
function markRoom(beat: BeatView): number {
    return Math.max(0, beat.items.length - 1) * SUBDIVISION_MARK_WIDTH;
}

function paginate(systems: ScoreSystem[]): ScorePage[] {
    const pages: ScorePage[] = [];
    let current: ScoreSystem[] = [];
    let used = 0;
    let number = 1;

    const room = () => systemRoomPx(number === 1);

    for (const system of systems) {
        const gap = current.length > 0 ? SYSTEM_GAP_PX : 0;
        if (current.length > 0 && used + SYSTEM_HEIGHT_PX + gap > room()) {
            pages.push({ number, systems: current, showsMasthead: number === 1 });
            number += 1;
            current = [];
            used = 0;
        }
        used += SYSTEM_HEIGHT_PX + (current.length > 0 ? SYSTEM_GAP_PX : 0);
        current.push(system);
    }

    pages.push({ number, systems: current, showsMasthead: number === 1 });
    return pages;
}
