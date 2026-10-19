import { A4_WIDTH_PX } from '@/features/score-editor/layout/page-geometry';

/**
 * How the document is looked at.
 *
 * The sheets are read the way a word processor is read: the page sits still in
 * the middle of the window and the document scrolls past it. Zooming therefore
 * changes how large the page is drawn, not where it is — there is no camera to
 * aim, only a scale for the paper.
 */

/** Air between the sheet and the edge of the document surface, on every side. */
export const DOCUMENT_INSET_PX = 32;

/**
 * The zoom levels the controls step through, smallest first.
 *
 * A fixed ladder rather than a multiplication keeps every level a round
 * percentage — 125%, 150%, 175% — the way a word processor's zoom menu does,
 * instead of drifting into 156% after a few presses.
 */
export const ZOOM_STOPS = [
    0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3,
] as const;

export const MIN_ZOOM = ZOOM_STOPS[0];
export const MAX_ZOOM = ZOOM_STOPS[ZOOM_STOPS.length - 1];

/** A zoom that came from a fit can sit between two stops; this keeps comparisons honest. */
const EPSILON = 0.001;

/** The next level up, or the top of the ladder. */
export function nextZoom(zoom: number): number {
    return ZOOM_STOPS.find((stop) => stop > zoom + EPSILON) ?? MAX_ZOOM;
}

/** The next level down, or the bottom of the ladder. */
export function previousZoom(zoom: number): number {
    const stops = [...ZOOM_STOPS].reverse();
    return stops.find((stop) => stop < zoom - EPSILON) ?? MIN_ZOOM;
}

/**
 * The largest scale at which the whole page, with the air around it, still fits
 * across the window. A narrow window therefore opens on a page width it can
 * show, and a wide one on paper no larger than life.
 */
export function fitWidthZoom(availableWidth: number): number {
    const wanted = availableWidth / (A4_WIDTH_PX + DOCUMENT_INSET_PX * 2);
    return Math.min(Math.max(wanted, MIN_ZOOM), MAX_ZOOM);
}

/**
 * The zoom the editor opens on: the page width on a narrow window, and never
 * more than the paper's true size on a wide one. Magnifying a document the
 * reader has not asked to magnify is startling; shrinking it so it fits is not.
 */
export function openingZoom(availableWidth: number): number {
    return Math.min(1, fitWidthZoom(availableWidth));
}

/** How a zoom reads in the tool rail. */
export function zoomLabel(zoom: number): string {
    return `${Math.round(zoom * 100)}%`;
}
