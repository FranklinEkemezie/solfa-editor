import { PARTS } from '@/domain/music';

/**
 * The geometry of the sheet, in CSS pixels at 96 to the inch.
 *
 * The editor draws a real A4 page rather than a strip that grows, so what is on
 * screen and what the printer emits are the same page. Nothing scrolls inside
 * the sheet either: a score too tall for one page is broken across several, and
 * the document is read by scrolling past them.
 */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

/**
 * The margin inside the sheet, on every edge.
 *
 * This is the document's margin in the word-processor sense — the air the
 * music is set in — and the printer uses the very same measurement, so what
 * comes off the paper is the page that was on screen.
 */
export const PAGE_MARGIN_PX = 70;

export const PAGE_CONTENT_WIDTH_PX = A4_WIDTH_PX - PAGE_MARGIN_PX * 2;
export const PAGE_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_PX * 2;

/** The column that carries the part labels, at the head of every system. */
export const PART_LABEL_WIDTH_PX = 44;

/** The barline that closes that column on the left, from the number row down. */
export const SYSTEM_BARLINE_PX = 1;

/** One part's row of beats. */
export const PART_ROW_HEIGHT_PX = 46;

/** The measure numbers written above the first measure of a system. */
export const SYSTEM_NUMBER_ROW_PX = 15;

/** Clear air between one system and the next. */
export const SYSTEM_GAP_PX = 26;

/** The title block, which only the first page carries. */
export const MASTHEAD_HEIGHT_PX = 119;

export const SYSTEM_HEIGHT_PX = SYSTEM_NUMBER_ROW_PX + PART_ROW_HEIGHT_PX * PARTS.length;

/** How far the top of one system sits below the top of the last. */
export const SYSTEM_STRIDE_PX = SYSTEM_HEIGHT_PX + SYSTEM_GAP_PX;

/** How much of a page's height the systems may use. */
export function systemRoomPx(showsMasthead: boolean): number {
    return PAGE_CONTENT_HEIGHT_PX - (showsMasthead ? MASTHEAD_HEIGHT_PX + SYSTEM_GAP_PX : 0);
}
