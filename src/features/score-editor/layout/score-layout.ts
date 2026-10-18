import type {
    EditorDocument,
    EditorMeasure,
    EditorSlot,
} from '@/features/score-editor/adapters/editor-document-schema';
import {
    PAGE_CONTENT_WIDTH_PX,
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
export function calculateScoreLayout(document: EditorDocument): ScoreLayout {
    const measureWidth = uniformMeasureWidth(document);
    const perSystem = Math.max(1, Math.floor(PAGE_CONTENT_WIDTH_PX / measureWidth));
    const systems = chunk(measureNumbers(document), perSystem).map((measureNumbers) => ({
        measureNumbers,
    }));

    return { measureWidth, measuresPerSystem: perSystem, pages: paginate(systems) };
}

function measureNumbers(document: EditorDocument): number[] {
    return [...new Set(document.measures.map((measure) => measure.number))].sort(
        (left, right) => left - right,
    );
}

/**
 * The width every measure is given.
 *
 * One width across the whole score keeps the beats of the four parts aligned
 * from the first system to the last, and it comes from the fullest beat any
 * part writes anywhere — not from each measure's own needs — so a page never
 * mixes wide and narrow bars.
 */
function uniformMeasureWidth(document: EditorDocument): number {
    const widest = document.measures.reduce(
        (width, measure) => Math.max(width, naturalWidth(measure)),
        MINIMUM_MEASURE_WIDTH,
    );
    return Math.min(Math.round(widest), PAGE_CONTENT_WIDTH_PX);
}

function naturalWidth(measure: EditorMeasure): number {
    const widestBeat = measure.slots.reduce(
        (widest, slot) => Math.max(widest, SLOT_WIDTH + markRoom(slot)),
        SLOT_WIDTH,
    );
    return measure.slots.length * widestBeat + MEASURE_PADDING;
}

/** The beats of a measure share its width, so every beat is as wide as the fullest one. */
function markRoom(slot: EditorSlot): number {
    return Math.max(0, slot.notes.length - 1) * SUBDIVISION_MARK_WIDTH;
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

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}
