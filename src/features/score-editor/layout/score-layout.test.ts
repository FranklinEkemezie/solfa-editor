import { describe, expect, it } from 'vitest';
import {
    createEmptyScoreDocument,
    withMeasureCount,
    withVoice,
} from '@/domain/music';
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

function denseView(): ScoreView {
    return buildScoreView(
        withVoice(
            createEmptyScoreDocument(),
            'soprano',
            ':d---:drmf:d---:drmf:d---:drmf:d---:drmf',
        ),
    );
}

function systems(view: ScoreView) {
    return calculateScoreLayout(view).pages.flatMap((page) => page.systems);
}

function measureRoom(): number {
    return PAGE_CONTENT_WIDTH_PX - PART_LABEL_WIDTH_PX - SYSTEM_BARLINE_PX;
}

describe('calculateScoreLayout', () => {
    it('fits two measures on a single sheet', () => {
        const layout = calculateScoreLayout(viewOf(2));

        expect(layout.pages).toHaveLength(1);
        expect(layout.pages[0].showsMasthead).toBe(true);
        expect(layout.pages[0].systems[0]?.measures.map((measure) => measure.number)).toEqual([
            1, 2,
        ]);
    });

    it('measures each measure from its own music instead of one global width', () => {
        const widths = systems(denseView()).flatMap((system) =>
            system.measures.map((measure) => measure.width),
        );

        expect(new Set(widths).size).toBeGreaterThan(1);
        expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths));
    });

    it('fills every line but leaves a sparse last line as wide as its music', () => {
        const laid = systems(denseView());

        for (const system of laid.slice(0, -1)) {
            const total = system.measures.reduce((sum, measure) => sum + measure.width, 0);
            expect(total).toBe(measureRoom());
        }

        const last = laid[laid.length - 1];
        const lastTotal = last.measures.reduce((sum, measure) => sum + measure.width, 0);
        expect(lastTotal).toBeLessThanOrEqual(measureRoom());
    });

    it('does not stretch a short last line across the page', () => {
        const laid = systems(viewOf(3));

        expect(laid).toHaveLength(1);
        const total = laid[0].measures.reduce((sum, measure) => sum + measure.width, 0);
        expect(total).toBeLessThan(measureRoom());
    });

    it('still stretches a last line that is already mostly full', () => {
        const laid = systems(viewOf(9));
        const last = laid[laid.length - 1];
        const total = last.measures.reduce((sum, measure) => sum + measure.width, 0);

        expect(laid.length).toBeGreaterThan(1);
        expect(total).toBe(measureRoom());
    });

    it('keeps every measure and the opening barline inside the page', () => {
        for (const system of systems(denseView())) {
            const total = system.measures.reduce((sum, measure) => sum + measure.width, 0);
            expect(PART_LABEL_WIDTH_PX + SYSTEM_BARLINE_PX + total).toBeLessThanOrEqual(
                PAGE_CONTENT_WIDTH_PX,
            );
        }
    });

    it('breaks the score into systems that cover every measure once, in order', () => {
        const view = viewOf(13);
        const laid = systems(view).flatMap((system) =>
            system.measures.map((measure) => measure.number),
        );

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
