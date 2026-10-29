import { toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import {
    A4_HEIGHT_PX,
    A4_WIDTH_PX,
} from '@/features/score-editor/layout/page-geometry';

/**
 * Render A4 pages in the export root to PNG data URLs.
 *
 * `limit` lets the preview draw only the first sheet while a full export still
 * asks for every page. Pages are drawn one at a time so a long score does not
 * keep several full-size canvases alive at once.
 */
export async function renderScorePages(root: HTMLElement, limit = Infinity): Promise<string[]> {
    const pages = Array.from(root.querySelectorAll<HTMLElement>('.print-page--paper')).slice(
        0,
        limit,
    );
    if (pages.length === 0) {
        throw new Error('The score has no pages to export.');
    }

    if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
    }

    const images: string[] = [];
    for (const page of pages) {
        images.push(
            await withTimeout(
                renderPage(page),
                20_000,
                'The page took too long to render. Try again.',
            ),
        );
    }
    return images;
}

/**
 * Turn one paper page into a PNG.
 *
 * `html-to-image` has a `toPng` helper, but it waits on `HTMLImageElement.decode`
 * after loading the generated SVG. Chromium can leave that promise pending for
 * an SVG built from a large foreignObject, so the export would sit on
 * "Preparing preview" forever. Drawing the SVG ourselves only needs `onload`,
 * which is the signal we actually care about.
 *
 * Fonts are left out of the SVG on purpose. Embedding every face in the app's
 * stylesheet makes the first preview wait on font requests, while the sheet is
 * set in the system serif faces the browser already has.
 */
async function renderPage(page: HTMLElement): Promise<string> {
    const scale = 2;
    const svg = await toSvg(page, {
        backgroundColor: '#ffffff',
        fontEmbedCSS: '',
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
    });
    const image = await loadImage(svg);

    const canvas = document.createElement('canvas');
    canvas.width = A4_WIDTH_PX * scale;
    canvas.height = A4_HEIGHT_PX * scale;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('The page could not be drawn for export.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The page image could not be loaded.'));
        image.src = url;
    });
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error(message)), milliseconds);
        promise.then(
            (value) => {
                window.clearTimeout(timer);
                resolve(value);
            },
            (cause: unknown) => {
                window.clearTimeout(timer);
                reject(cause);
            },
        );
    });
}

/** A multi-page PDF with one rendered page per sheet. */
export function createScorePdf(images: readonly string[]): jsPDF {
    if (images.length === 0) throw new Error('There are no pages to export.');

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [A4_WIDTH_PX, A4_HEIGHT_PX],
        hotfixes: ['px_scaling'],
    });

    images.forEach((image, index) => {
        if (index > 0) pdf.addPage([A4_WIDTH_PX, A4_HEIGHT_PX], 'portrait');
        pdf.addImage(image, 'PNG', 0, 0, A4_WIDTH_PX, A4_HEIGHT_PX, undefined, 'FAST');
    });

    return pdf;
}

/** One PNG per page, collected in a zip so the browser only asks once. */
export async function createPagesZip(images: readonly string[]): Promise<Blob> {
    if (images.length === 0) throw new Error('There are no pages to export.');

    const zip = new JSZip();
    images.forEach((image, index) => {
        zip.file(`page-${String(index + 1).padStart(2, '0')}.png`, dataUrlBytes(image));
    });

    return zip.generateAsync({ type: 'blob' });
}

function dataUrlBytes(dataUrl: string): Uint8Array {
    const comma = dataUrl.indexOf(',');
    if (comma === -1) throw new Error('A rendered page was not a valid image.');

    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}
