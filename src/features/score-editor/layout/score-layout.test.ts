import { describe, expect, it } from 'vitest';
import { createEmptyScoreDocument, withMeasureCount } from '@/domain/music';
import {
    PAGE_CONTENT_WIDTH_PX,
    PART_LABEL_WIDTH_PX,
    SYSTEM_BARLINE_PX,
    SYSTEM_HEIGHT_PX,
    systemRoomPx,
} from '@/features/score-editor/layout/page-geometry';
import { calculateScoreLayout } from '@/features/score-editor/layout/score-layout';
import { buildScoreView } from '@/features/score-editor/model/build-score';
import type { ScoreView } from '@/features/score-editor/model/score-view';

function viewOf(measureCount: number): ScoreView {
    return buildScoreView(withMeasureCount(createEmptyScoreDocument(), measureCount));
}

function systems(view: ScoreView) {
    return calculateScoreLayout(view).pages.flatMap((page) => page.systems);
}

describe('calculateScoreLayout', () => {
    it('fits the default two measures on a single sheet', () => {
        const layout = calculateScoreLayout(viewOf(2));

        expect(layout.pages).toHaveLength(1);
        expect(layout.pages[0].showsMasthead).toBe(true);
        expect(layout.pages[0].systems).toEqual([{ measureNumbers: [1, 2] }]);
    });

    it('gives every measure the same width', () => {
        const layout = calculateScoreLayout(viewOf(5));

        expect(layout.measureWidth).toBeGreaterThan(0);
        expect(layout.measuresPerSystem).toBeGreaterThan(0);
    });

    it('works out how many measures a line holds from the page width', () => {
        const layout = calculateScoreLayout(viewOf(20));

        expect(layout.measuresPerSystem).toBeGreaterThan(1);
        expect(layout.pages[0].systems[0].measureNumbers).toHaveLength(layout.measuresPerSystem);
    });

    it('keeps the part labels, the opening barline and the measures inside the page', () => {
        const layout = calculateScoreLayout(viewOf(20));

        expect(
            PART_LABEL_WIDTH_PX +
                SYSTEM_BARLINE_PX +
                layout.measuresPerSystem * layout.measureWidth,
        ).toBeLessThanOrEqual(PAGE_CONTENT_WIDTH_PX);
    });

    it('never gives a measure more width than the labels leave it', () => {
        const layout = calculateScoreLayout(viewOf(3));

        expect(layout.measureWidth).toBeLessThanOrEqual(
            PAGE_CONTENT_WIDTH_PX - PART_LABEL_WIDTH_PX - SYSTEM_BARLINE_PX,
        );
        expect(layout.measuresPerSystem).toBeGreaterThanOrEqual(1);
    });

    it('breaks the score into systems that cover every measure once, in order', () => {
        const view = viewOf(13);
        const laid = systems(view).flatMap((system) => system.measureNumbers);

        expect(laid).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });

    it('fills the first page less than the rest, because the title block is on it', () => {
        const layout = calculateScoreLayout(viewOf(200));
        const [first, second] = layout.pages;

        expect(layout.pages.length).toBeGreaterThan(1);
        expect(first.showsMasthead).toBe(true);
        expect(second.showsMasthead).toBe(false);
        expect(first.systems.length).toBeLessThanOrEqual(second.systems.length);
        expect(first.systems.length * SYSTEM_HEIGHT_PX).toBeLessThanOrEqual(systemRoomPx(true));
        expect(second.systems.length * SYSTEM_HEIGHT_PX).toBeLessThanOrEqual(systemRoomPx(false));
    });

    it('numbers the pages from one, in order', () => {
        const layout = calculateScoreLayout(viewOf(200));

        expect(layout.pages.map((page) => page.number)).toEqual(
            layout.pages.map((_, index) => index + 1),
        );
    });

    it('still returns one sheet for a score with nothing on it', () => {
        const layout = calculateScoreLayout(viewOf(1));

        expect(layout.pages).toHaveLength(1);
        expect(layout.pages[0].showsMasthead).toBe(true);
    });
});
