import { PARTS } from '@/domain/music';
import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';
import { PartMeasure } from '@/features/score-editor/components/score-canvas/part-measure';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

/**
 * One measure, as a column of the four parts.
 *
 * The barline closes the measure on its right, so the columns of a system read
 * as one continuous staff group; the final measure of the score closes it more
 * heavily, the way a printed score does.
 */
export function MeasureColumn({
    number,
    width,
    isFinal,
    measureById,
    position,
    onPositionChange,
    activeSlotId,
}: {
    number: number;
    width: number;
    isFinal: boolean;
    measureById: Map<string, EditorMeasure>;
    position: EditorPosition;
    onPositionChange: (position: EditorPosition) => void;
    activeSlotId?: string | null;
}) {
    return (
        <div
            className={`relative shrink-0 ${
                isFinal ? 'border-r-[2.5px] border-r-ink' : 'border-r border-r-ink-muted/60'
            }`}
            style={{ width }}
        >
            {PARTS.map((part) => {
                const measure = measureById.get(`${part.id}-${number}`);
                if (!measure) return null;
                return (
                    <PartMeasure
                        key={part.id}
                        measure={measure}
                        position={position}
                        onPositionChange={onPositionChange}
                        activeSlotId={part.id === 'soprano' ? activeSlotId : null}
                    />
                );
            })}
        </div>
    );
}
