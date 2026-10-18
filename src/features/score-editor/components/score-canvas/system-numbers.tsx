import {
    PART_LABEL_WIDTH_PX,
    SYSTEM_NUMBER_ROW_PX,
} from '@/features/score-editor/layout/page-geometry';

/**
 * The measure number above the first measure of a system.
 *
 * Only the opening measure of a system is numbered — the way a printed score is
 * read — and the opening barline is carried up through this row so the system
 * is closed on its left from top to bottom.
 */
export function SystemNumbers({
    firstMeasureNumber,
    measureWidth,
    measureCount,
}: {
    firstMeasureNumber: number;
    measureWidth: number;
    measureCount: number;
}) {
    return (
        <div className="flex border-l border-ink-muted/60" style={{ height: SYSTEM_NUMBER_ROW_PX }}>
            {Array.from({ length: measureCount }, (_, index) => (
                <span
                    key={index}
                    className="shrink-0 pl-1 font-mono text-[10px] leading-none text-muted"
                    style={{ width: measureWidth }}
                >
                    {index === 0 ? firstMeasureNumber : ''}
                </span>
            ))}
        </div>
    );
}

/** Blank space as wide as the part labels, so a system's rows and numbers start together. */
export function PartLabelSpacer() {
    return <div className="shrink-0" style={{ width: PART_LABEL_WIDTH_PX }} />;
}
