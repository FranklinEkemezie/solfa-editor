import { MeasureColumn } from '@/features/score-editor/components/score-canvas/measure-column';
import { PartLabels } from '@/features/score-editor/components/score-canvas/part-labels';
import {
    PartLabelSpacer,
    SystemNumbers,
} from '@/features/score-editor/components/score-canvas/system-numbers';
import { SYSTEM_HEIGHT_PX } from '@/features/score-editor/layout/page-geometry';
import type { ScoreSystem as SystemLayout } from '@/features/score-editor/layout/score-layout';
import type { ScoreView } from '@/features/score-editor/model/score-view';
import type { EditorPosition } from '@/features/score-editor/editing/caret';

/** One line of the score: a numbered row of measures, read across four parts. */
export function ScoreSystem({
    system,
    measureWidth,
    isFinalSystem,
    view,
    position,
    onPositionChange,
    activeNoteKey,
}: {
    system: SystemLayout;
    measureWidth: number;
    isFinalSystem: boolean;
    view: ScoreView;
    position: EditorPosition;
    onPositionChange: (position: EditorPosition) => void;
    activeNoteKey?: string | null;
}) {
    const numbers = system.measureNumbers;

    return (
        <div style={{ height: SYSTEM_HEIGHT_PX }}>
            <div className="flex">
                <PartLabelSpacer />
                <SystemNumbers
                    firstMeasureNumber={numbers[0]}
                    measureWidth={measureWidth}
                    measureCount={numbers.length}
                />
            </div>
            <div className="flex">
                <PartLabels />
                <div className="flex border-l border-ink-muted/60">
                    {numbers.map((number, index) => (
                        <MeasureColumn
                            key={number}
                            number={number}
                            width={measureWidth}
                            isFinal={isFinalSystem && index === numbers.length - 1}
                            view={view}
                            position={position}
                            onPositionChange={onPositionChange}
                            activeNoteKey={activeNoteKey}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
