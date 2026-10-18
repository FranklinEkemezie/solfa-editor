import { PARTS } from '@/domain/music';
import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';
import { PartMeasure } from '@/features/score-editor/components/score-canvas/part-measure';
import type { MeasureLayout } from '@/features/score-editor/layout/calculate-score-layout';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

export function MeasureColumn({
    layoutMeasure,
    isLast,
    isFirst,
    measureById,
    position,
    onPositionChange,
    activeSlotId,
}: {
    layoutMeasure: MeasureLayout;
    isLast: boolean;
    isFirst: boolean;
    measureById: Map<string, EditorMeasure>;
    position: EditorPosition;
    onPositionChange: (position: EditorPosition) => void;
    activeSlotId?: string | null;
}) {
    const columnClasses = [
        'relative border-l border-r border-[#87988c] bg-[linear-gradient(180deg,rgba(93,130,109,0.03),rgba(93,130,109,0.01))]',
        isLast ? 'border-r-[3px] border-r-[#52695a]' : '',
        isFirst ? '' : 'border-l-0',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={columnClasses} style={{ width: layoutMeasure.width }}>
            {PARTS.map((part) => {
                const measure =
                    measureById.get(`${part.id}-${layoutMeasure.number}`) ??
                    measureById.get(layoutMeasure.measureId);
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
