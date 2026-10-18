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
        'relative border-l border-r border-muted bg-linear-to-b from-green/3 to-green/1',
        isLast ? 'border-r-[3px] border-r-ink-muted' : '',
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
