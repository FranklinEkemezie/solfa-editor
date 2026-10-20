/**
 * A half-open range of characters in a notation source.
 *
 * `[start, end)` means character `start` is included and `end` is the first
 * character after the token. Ranges are zero-based, matching JavaScript string
 * indexing, and are used for highlighting, diagnostics and cursor mapping.
 */
export type SourceRange = {
    readonly start: number;
    readonly end: number;
};

export function sourceRange(start: number, end: number): SourceRange {
    return { start, end };
}

export function rangeLength(range: SourceRange): number {
    return range.end - range.start;
}

export function rangeText(source: string, range: SourceRange): string {
    return source.slice(range.start, range.end);
}

/** True when `offset` falls inside the range, counting the start but not the end. */
export function containsOffset(range: SourceRange, offset: number): boolean {
    return offset >= range.start && offset < range.end;
}

export function rangesEqual(left: SourceRange, right: SourceRange): boolean {
    return left.start === right.start && left.end === right.end;
}

/** Keep an offset inside the source, which is what a caret always needs. */
export function clampOffset(source: string, offset: number): number {
    return Math.max(0, Math.min(source.length, offset));
}
