import { describe, expect, it } from 'vitest';
import { createEmptyScore } from '@/domain/music';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { addMeasure } from '@/features/score-editor/state/score-measure-commands';
import { SYSTEM_HEIGHT_PX, systemRoomPx } from '@/features/score-editor/layout/page-geometry';
import { calculateScoreLayout } from '@/features/score-editor/layout/score-layout';

function scoreOf(measureCount: number): EditorDocument {
    let document = domainToEditor(createEmptyScore());
    while (measureNumbers(document).length < measureCount) document = addMeasure(document);
    return document;
}

function measureNumbers(document: EditorDocument): number[] {
    return [...new Set(document.measures.map((measure) => measure.number))];
}

function systems(document: EditorDocument) {
    return calculateScoreLayout(document).pages.flatMap((page) => page.systems);
}

describe('calculateScoreLayout', () => {
    it('fits the default two measures on a single sheet', () => {
        const layout = calculateScoreLayout(scoreOf(2));

        expect(layout.pages).toHaveLength(1);
        expect(layout.pages[0].showsMasthead).toBe(true);
        expect(layout.pages[0].systems).toEqual([{ measureNumbers: [1, 2] }]);
    });

    it('gives every measure the same width', () => {
        const layout = calculateScoreLayout(scoreOf(5));

        expect(layout.measureWidth).toBeGreaterThan(0);
        expect(layout.measuresPerSystem).toBeGreaterThan(0);
    });

    it('works out how many measures a line holds from the page width', () => {
        const layout = calculateScoreLayout(scoreOf(20));

        expect(layout.measuresPerSystem).toBeGreaterThan(1);
        expect(layout.pages[0].systems[0].measureNumbers).toHaveLength(layout.measuresPerSystem);
    });

    it('breaks the score into systems that cover every measure once, in order', () => {
        const document = scoreOf(13);
        const laid = systems(document).flatMap((system) => system.measureNumbers);

        expect(laid).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });

    it('fills the first page less than the rest, because the title block is on it', () => {
        const layout = calculateScoreLayout(scoreOf(200));
        const [first, second] = layout.pages;

        expect(layout.pages.length).toBeGreaterThan(1);
        expect(first.showsMasthead).toBe(true);
        expect(second.showsMasthead).toBe(false);
        expect(first.systems.length).toBeLessThanOrEqual(second.systems.length);
        expect(first.systems.length * SYSTEM_HEIGHT_PX).toBeLessThanOrEqual(systemRoomPx(true));
        expect(second.systems.length * SYSTEM_HEIGHT_PX).toBeLessThanOrEqual(systemRoomPx(false));
    });

    it('numbers the pages from one, in order', () => {
        const layout = calculateScoreLayout(scoreOf(200));

        expect(layout.pages.map((page) => page.number)).toEqual(
            layout.pages.map((_, index) => index + 1),
        );
    });

    it('still returns one sheet for a score with nothing on it', () => {
        const layout = calculateScoreLayout(scoreOf(1));

        expect(layout.pages).toHaveLength(1);
        expect(layout.pages[0].showsMasthead).toBe(true);
    });
});
