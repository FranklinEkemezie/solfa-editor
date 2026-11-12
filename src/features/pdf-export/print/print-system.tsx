import { PARTS } from '@/domain/music';
import { PrintMeasure } from '@/features/pdf-export/print/print-measure';
import {
    PART_LABEL_WIDTH_PX,
    PART_ROW_HEIGHT_PX,
    SYSTEM_GAP_PX,
    SYSTEM_HEIGHT_PX,
    SYSTEM_NUMBER_ROW_PX,
} from '@/features/score-editor/layout/page-geometry';
import type { ScoreSystem } from '@/features/score-editor/layout/score-layout';
import type { ScoreView } from '@/features/score-editor/model/score-view';

/**
 * One line of the printed score: a numbered row of measures read across the
 * four parts.
 *
 * The measures keep the width the editor gave them instead of stretching to
 * the width of the paper, which is what leaves the bars as narrow as the music
 * needs and the beats of every system in the same place. Only the opening
 * measure of a system is numbered, and the opening barline is carried up
 * through the number row so the system closes on its left from top to bottom.
 */
export function PrintSystem({
    system,
    isFinalSystem,
    view,
}: {
    system: ScoreSystem;
    isFinalSystem: boolean;
    view: ScoreView;
}) {
    const measures = system.measures;
    const lastMeasure = measures.length - 1;

    return (
        <div
            className="print-system"
            style={{ height: SYSTEM_HEIGHT_PX, marginBottom: SYSTEM_GAP_PX }}
        >
            <div className="flex" style={{ height: SYSTEM_NUMBER_ROW_PX }}>
                <div className="shrink-0" style={{ width: PART_LABEL_WIDTH_PX }} />
                <div className="flex border-l border-ink-muted/60">
                    {measures.map((measure, index) => (
                        <span
                            key={measure.number}
                            className="shrink-0 pl-[2px] font-mono text-[6pt] leading-none text-ink-muted"
                            style={{ width: measure.width }}
                        >
                            {index === 0 ? measure.number : ''}
                        </span>
                    ))}
                </div>
            </div>
            {PARTS.map((part) => (
                <div
                    key={part.id}
                    className="print-part-row flex"
                    style={{ height: PART_ROW_HEIGHT_PX }}
                >
                    <div
                        className="flex shrink-0 items-center font-serif text-[8pt] font-bold text-ink"
                        style={{ width: PART_LABEL_WIDTH_PX }}
                        title={part.label}
                    >
                        {part.shortLabel}
                    </div>
                    <div className="flex border-l border-ink-muted/60">
                        {measures.map((measure, index) => (
                            <PrintMeasure
                                key={measure.number}
                                measure={view.parts[part.id].measures[measure.number - 1]}
                                width={measure.width}
                                isFinal={isFinalSystem && index === lastMeasure}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
