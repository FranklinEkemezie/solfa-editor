import { useLayoutEffect, useRef, useState } from 'react';
import {
    fitWidthZoom,
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
 */
export function useDocumentZoom() {
    const viewportRef = useRef<HTMLElement | null>(null);
    const [zoom, setZoom] = useState(1);

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        setZoom(openingZoom(viewport.clientWidth));
    }, []);

    return {
        viewportRef,
        zoom,
        zoomIn: () => setZoom((current) => nextZoom(current)),
        zoomOut: () => setZoom((current) => previousZoom(current)),
        fitWidth: () => {
            const viewport = viewportRef.current;
            if (viewport) setZoom(fitWidthZoom(viewport.clientWidth));
        },
        actualSize: () => setZoom(1),
    };
}
