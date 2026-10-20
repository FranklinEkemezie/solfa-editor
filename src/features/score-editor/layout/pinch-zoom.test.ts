import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM } from '@/features/score-editor/layout/document-zoom';
import {
    anchoredScroll,
    boxFraction,
    fingerSpan,
    midpoint,
    pinchedZoom,
} from '@/features/score-editor/layout/pinch-zoom';

describe('finger geometry', () => {
    it('measures the distance between two fingers', () => {
        expect(fingerSpan({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
        expect(fingerSpan({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
    });

    it('turns about the point halfway between them', () => {
        expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
    });

    it('reads where a point sits inside a box', () => {
        const box = { left: 100, top: 50, width: 200, height: 400 };
        expect(boxFraction(box, { x: 200, y: 250 })).toEqual({ x: 0.5, y: 0.5 });
        expect(boxFraction(box, { x: 100, y: 50 })).toEqual({ x: 0, y: 0 });
        expect(boxFraction({ ...box, width: 0, height: 0 }, { x: 1, y: 2 })).toEqual({
            x: 0,
            y: 0,
        });
    });
});

describe('pinched zoom', () => {
    it('scales the zoom the pinch began at', () => {
        expect(pinchedZoom(1, 100, 200)).toBe(2);
        expect(pinchedZoom(0.5, 200, 100)).toBe(0.25);
        expect(pinchedZoom(0.9, 100, 150)).toBeCloseTo(1.35);
    });

    it('stays on the same ladder limits as the controls', () => {
        expect(pinchedZoom(1, 100, 10_000)).toBe(MAX_ZOOM);
        expect(pinchedZoom(1, 10_000, 1)).toBe(MIN_ZOOM);
    });

    it('holds still when the fingers have not moved', () => {
        expect(pinchedZoom(0.85, 0, 120)).toBe(0.85);
        expect(pinchedZoom(0.85, 120, 120)).toBe(0.85);
    });
});

describe('anchored scroll', () => {
    const box = { left: 100, top: 50, width: 200, height: 400 };

    it('does nothing when the page is drawn where it was', () => {
        expect(anchoredScroll(box, { x: 0.5, y: 0.5 }, { x: 200, y: 250 })).toEqual({ x: 0, y: 0 });
    });

    it('brings the page back under a point it has moved away from', () => {
        // Same fingers, a page twice as large, drawn from the top-left corner.
        const grown = { left: 0, top: 0, width: 400, height: 800 };
        expect(anchoredScroll(grown, { x: 0.5, y: 0.5 }, { x: 200, y: 250 })).toEqual({
            x: 0,
            y: 150,
        });
    });

    it('carries the page along when the fingers move together', () => {
        expect(anchoredScroll(box, { x: 0.5, y: 0.5 }, { x: 210, y: 240 })).toEqual({
            x: -10,
            y: 10,
        });
    });
});
