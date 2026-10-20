import { MAX_ZOOM, MIN_ZOOM } from '@/features/score-editor/layout/document-zoom';

/**
 * The geometry of a pinch.
 *
 * A pinch is two points that move: the zoom follows the distance between them,
 * and the page is kept still under the point halfway between them. None of that
 * needs a browser, so it lives here, away from the hook that listens for
 * touches, and is checked by its own tests.
 */

/** A point in the window, in the pixels a touch reports. */
export type Point = { x: number; y: number };

/** A box in the window, as `getBoundingClientRect` reports one. */
export type Box = { left: number; top: number; width: number; height: number };

/** How far apart two fingers are. */
export function fingerSpan(first: Point, second: Point): number {
    return Math.hypot(first.x - second.x, first.y - second.y);
}

/** The point halfway between two fingers. A pinch turns about it. */
export function midpoint(first: Point, second: Point): Point {
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

/** Where a point sits inside a box, from 0 to 1 along each axis. */
export function boxFraction(box: Box, point: Point): Point {
    return {
        x: box.width === 0 ? 0 : (point.x - box.left) / box.width,
        y: box.height === 0 ? 0 : (point.y - box.top) / box.height,
    };
}

/**
 * The zoom a pinch asks for.
 *
 * The page grows by however much the fingers have spread since the pinch began,
 * so putting a second finger down never makes it jump. The result stays within
 * the same limits the zoom controls step through.
 */
export function pinchedZoom(startZoom: number, startSpan: number, currentSpan: number): number {
    if (startSpan <= 0) return startZoom;
    const wanted = startZoom * (currentSpan / startSpan);
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, wanted));
}

/**
 * How far to scroll so that the page stays under the fingers.
 *
 * `origin` is where the fingers first landed inside the page, as a fraction of
 * it; `box` is where the page is drawn now, and `point` is where the fingers
 * are. A page that grew around that point needs no scrolling; one that grew
 * away from it is brought back to it, and two fingers that move together carry
 * the page with them.
 */
export function anchoredScroll(box: Box, origin: Point, point: Point): Point {
    return {
        x: box.left - (point.x - origin.x * box.width),
        y: box.top - (point.y - origin.y * box.height),
    };
}
