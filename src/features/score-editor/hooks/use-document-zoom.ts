import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
    fitWidthZoom,
    MAX_ZOOM,
    MIN_ZOOM,
    nextZoom,
    openingZoom,
    previousZoom,
} from '@/features/score-editor/layout/document-zoom';

/**
 * The zoom the document is read at, and the window it is read in.
 *
 * The window is measured once, when the editor opens, so a narrow screen opens
 * on a page it can show whole. After that the reader is in charge: resizing the
 * window leaves the zoom exactly where they left it, which is what a word
 * processor does and what stops the page jumping about while being read.
 *
 * The pages are given a ref of their own because the pinch gesture has to know
 * where the paper is drawn to zoom about the reader's fingers.
 */
export function useDocumentZoom() {
    const viewportRef = useRef<HTMLElement | null>(null);
    const pagesRef = useRef<HTMLDivElement | null>(null);
    const [zoom, setZoom] = useState(1);

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        setZoom(openingZoom(viewport.clientWidth));
    }, []);

    /**
     * Set the zoom from anything that is not one of the ladder's steps — a
     * pinch, today. The ladder is for the controls; a gesture is continuous, so
     * it hands over a scale of its own and only needs it kept within reach.
     */
    const zoomTo = useCallback((next: number) => {
        setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
    }, []);

    return {
        viewportRef,
        pagesRef,
        zoom,
        zoomTo,
        zoomIn: () => setZoom((current) => nextZoom(current)),
        zoomOut: () => setZoom((current) => previousZoom(current)),
        fitWidth: () => {
            const viewport = viewportRef.current;
            if (viewport) setZoom(fitWidthZoom(viewport.clientWidth));
        },
        actualSize: () => setZoom(1),
    };
}
