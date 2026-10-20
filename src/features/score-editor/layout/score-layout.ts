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
const SLOT_WIDTH = 40;
/** Extra room each subdivision mark needs between two notes of a beat. */
const SUBDIVISION_MARK_WIDTH = 7;
/** The barline and breathing space around the beats of a measure. */
const MEASURE_PADDING = 14;
const MINIMUM_MEASURE_WIDTH = 156;

/** One measure's column in a system. */
export type MeasureLayout = {
    number: number;
    width: number;
};

/** A line of measures, as many as the page is wide. */
export type ScoreSystem = {
    measureNumbers: number[];
};

/** One A4 page of systems. Only the first carries the title block. */
export type ScorePage = {
    number: number;
    systems: ScoreSystem[];
    showsMasthead: boolean;
};

export type ScoreLayout = {
    /** Every measure is this wide, so the beats line up across the page. */
    measureWidth: number;
    /** How many measures fit on one line, before the sheet runs out of width. */
    measuresPerSystem: number;
    pages: ScorePage[];
};

/**
 * Lay the score out as sheets of paper.
 *
 * Measures are packed into systems of equal width and the systems are then
 * stacked into pages, the first of which gives up room to the title block. What
 * comes out is a page count the editor can draw and the printer can repeat, so
 * neither has to guess where the music breaks.
 */
export function calculateScoreLayout(view: ScoreView): ScoreLayout {
    const measureWidth = uniformMeasureWidth(view);
    const perSystem = Math.max(1, Math.floor(measureRoomPx() / measureWidth));
    const systems = chunk(view.measureNumbers, perSystem).map((measureNumbers) => ({
        measureNumbers,
    }));

    return { measureWidth, measuresPerSystem: perSystem, pages: paginate(systems) };
}

/**
 * The width a system has for its measures.
 *
 * A system carries the part labels in a column of their own at its head, with
 * the opening barline beside it, so both come off the page before the measures
 * are packed. Rounding them away is what lets a system grow a part of a measure
 * too wide for the paper.
 */
function measureRoomPx(): number {
    return PAGE_CONTENT_WIDTH_PX - PART_LABEL_WIDTH_PX - SYSTEM_BARLINE_PX;
}

/**
 * The width every measure is given.
 *
 * One width across the whole score keeps the beats of the four parts aligned
 * from the first system to the last, and it comes from the fullest beat any
 * part writes anywhere — not from each measure's own needs — so a page never
 * mixes wide and narrow bars.
 */
function uniformMeasureWidth(view: ScoreView): number {
    const widest = view.measureNumbers.reduce(
        (width, number) => Math.max(width, naturalWidth(view, number)),
        MINIMUM_MEASURE_WIDTH,
    );
    return Math.min(Math.round(widest), measureRoomPx());
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

function chunk<T>(items: readonly T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}
