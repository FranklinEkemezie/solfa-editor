import { PARTS } from '@/domain/music';
import { FinalBarline } from '@/features/score-editor/components/score-canvas/final-barline';
import { PartMeasure } from '@/features/score-editor/components/score-canvas/part-measure';
import { activeBeat, type ScoreView } from '@/features/score-editor/model/score-view';
import type { EditorPosition } from '@/features/score-editor/editing/caret';
import { cn } from '@/lib/utils';

/**
 * One measure, as a column of the four parts.
 *
 * The barline closes the measure on its right, so the columns of a system read
 * as one continuous staff group; the last measure of the score closes it with
 * the double barline, the way a printed score does.
 */
export function MeasureColumn({
    number,
    width,
    isFinal,
    view,
    position,
    onPositionChange,
    activeNoteKey,
}: {
    number: number;
    width: number;
    isFinal: boolean;
    view: ScoreView;
    position: EditorPosition;
    onPositionChange: (position: EditorPosition) => void;
    activeNoteKey?: string | null;
}) {
    return (
        <div
            className={cn('relative shrink-0', !isFinal && 'border-r border-r-ink-muted/60')}
            style={{ width }}
        >
            {PARTS.map((part) => {
                const partView = view.parts[part.id];
                const measure = partView.measures[number - 1];
                if (!measure) return null;
                const active =
                    position.part === part.id ? activeBeat(partView, position.offset) : null;

                return (
                    <PartMeasure
                        key={part.id}
                        part={partView}
                        measure={measure}
                        onPositionChange={onPositionChange}
                        activeBeatNumber={active && active.measure === number ? active.beat : null}
                        activeNoteKey={activeNoteKey}
                    />
                );
            })}
            {isFinal ? <FinalBarline /> : null}
        </div>
    );
}
