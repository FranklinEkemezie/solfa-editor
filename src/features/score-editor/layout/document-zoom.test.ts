import { describe, expect, it } from 'vitest';
import { A4_WIDTH_PX } from '@/features/score-editor/layout/page-geometry';
import {
    DOCUMENT_INSET_PX,
    MAX_ZOOM,
    MIN_ZOOM,
    ZOOM_STOPS,
    fitWidthZoom,
    nextZoom,
    openingZoom,
    previousZoom,
    zoomLabel,
} from '@/features/score-editor/layout/document-zoom';

describe('document zoom', () => {
    it('steps up and down through round levels', () => {
        expect(nextZoom(1)).toBe(1.1);
        expect(nextZoom(1.25)).toBe(1.5);
        expect(previousZoom(1)).toBe(0.9);
        expect(previousZoom(1.5)).toBe(1.25);
    });

    it('steps from a fitted zoom to the next level on the ladder', () => {
        expect(nextZoom(0.87)).toBe(0.9);
        expect(previousZoom(0.87)).toBe(0.8);
    });

    it('stops at the ends of the ladder', () => {
        expect(nextZoom(MAX_ZOOM)).toBe(MAX_ZOOM);
        expect(previousZoom(MIN_ZOOM)).toBe(MIN_ZOOM);
    });

    it('fits the page and its air across the window', () => {
        const window = 429;
        expect(fitWidthZoom(window)).toBeCloseTo(window / (A4_WIDTH_PX + DOCUMENT_INSET_PX * 2));
    });

    it('never opens on paper larger than life', () => {
        expect(openingZoom(4000)).toBe(1);
        expect(openingZoom(1200)).toBe(1);
    });

    it('opens smaller when the window cannot show the page', () => {
        expect(openingZoom(429)).toBeLessThan(0.6);
        expect(openingZoom(429)).toBeGreaterThan(MIN_ZOOM);
    });

    it('covers every level the controls can reach', () => {
        expect(ZOOM_STOPS[0]).toBe(MIN_ZOOM);
        expect(ZOOM_STOPS[ZOOM_STOPS.length - 1]).toBe(MAX_ZOOM);
        expect(ZOOM_STOPS.every((stop, index) => index === 0 || stop > ZOOM_STOPS[index - 1])).toBe(
            true,
        );
    });

    it('reads a zoom as a whole percentage', () => {
        expect(zoomLabel(1)).toBe('100%');
        expect(zoomLabel(0.87)).toBe('87%');
        expect(zoomLabel(1.25)).toBe('125%');
    });
});
