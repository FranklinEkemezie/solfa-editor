import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import {
    anchoredScroll,
    boxFraction,
    fingerSpan,
    midpoint,
    pinchedZoom,
    type Point,
} from '@/features/score-editor/layout/pinch-zoom';

type PinchZoomOptions = {
    /** The window the document is read in, and the element that scrolls. */
    surfaceRef: RefObject<HTMLElement | null>;
    /** The box the pages are drawn in. The pinch turns about a point inside it. */
    pagesRef: RefObject<HTMLElement | null>;
    /** The zoom the document is drawn at now. */
    zoom: number;
    /** Applies a zoom. Must be stable, so the listeners are attached once. */
    onZoom: (zoom: number) => void;
};

type Gesture = {
    /** How far apart the fingers were when they landed. */
    startSpan: number;
    /** The zoom the gesture began at. */
    startZoom: number;
    /** Where the fingers first landed inside the pages, from 0 to 1. */
    origin: Point;
};

/**
 * Pinch to zoom the document, rather than the browser zooming the whole app.
 *
 * A phone reads a pinch as a gesture on the window, which magnifies the header
 * and the toolbar along with the score and leaves the page wider than the
 * screen. The gesture is claimed here instead: `touch-action` on the document
 * stops the browser from taking it, and two fingers scale the paper exactly as
 * the zoom controls do. One finger still scrolls natively, with the browser's
 * own momentum.
 *
 * The page is redrawn around the point between the fingers, so the bar being
 * read stays under them as the paper grows, and two fingers that move together
 * carry the page with them. The new zoom is applied before the scroll is
 * measured, which is what `flushSync` is for: the anchor has to be found on the
 * page as it will be drawn, not as it was a frame ago.
 */
export function usePinchZoom({ surfaceRef, pagesRef, zoom, onZoom }: PinchZoomOptions) {
    const zoomRef = useRef(zoom);

    useLayoutEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    useEffect(() => {
        const surface = surfaceRef.current;
        const pages = pagesRef.current;
        if (!surface || !pages) return;

        let gesture: Gesture | null = null;

        const begin = (event: TouchEvent) => {
            if (event.touches.length !== 2) return;
            const [first, second] = pointsOf(event);
            gesture = {
                startSpan: fingerSpan(first, second),
                startZoom: zoomRef.current,
                origin: boxFraction(pages.getBoundingClientRect(), midpoint(first, second)),
            };
            // Without this the browser reads the gesture as a pinch on the window.
            event.preventDefault();
        };

        const change = (event: TouchEvent) => {
            const started = gesture;
            if (!started || event.touches.length < 2) return;
            event.preventDefault();

            const [first, second] = pointsOf(event);
            const fingers = midpoint(first, second);
            flushSync(() =>
                onZoom(
                    pinchedZoom(started.startZoom, started.startSpan, fingerSpan(first, second)),
                ),
            );

            const scroll = anchoredScroll(pages.getBoundingClientRect(), started.origin, fingers);
            surface.scrollTo({
                left: surface.scrollLeft + scroll.x,
                top: surface.scrollTop + scroll.y,
                behavior: 'instant',
            });
        };

        const end = (event: TouchEvent) => {
            if (event.touches.length < 2) gesture = null;
        };

        // Safari announces a pinch on the window before it sends the touches.
        const claim = (event: Event) => event.preventDefault();

        surface.addEventListener('touchstart', begin, { passive: false });
        surface.addEventListener('touchmove', change, { passive: false });
        surface.addEventListener('touchend', end);
        surface.addEventListener('touchcancel', end);
        surface.addEventListener('gesturestart', claim);

        return () => {
            surface.removeEventListener('touchstart', begin);
            surface.removeEventListener('touchmove', change);
            surface.removeEventListener('touchend', end);
            surface.removeEventListener('touchcancel', end);
            surface.removeEventListener('gesturestart', claim);
        };
    }, [surfaceRef, pagesRef, onZoom]);
}

function pointsOf(event: TouchEvent): [Point, Point] {
    const first = event.touches[0];
    const second = event.touches[1];
    return [
        { x: first.clientX, y: first.clientY },
        { x: second.clientX, y: second.clientY },
    ];
}
