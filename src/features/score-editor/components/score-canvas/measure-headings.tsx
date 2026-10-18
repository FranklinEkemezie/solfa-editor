import type { MeasureLayout } from '@/features/score-editor/layout/calculate-score-layout';

export function MeasureHeadings({ measures }: { measures: MeasureLayout[] }) {
    return (
        <div className="flex min-w-max items-end">
            <div className="w-[52px] shrink-0 sm:w-[84px]" />
            <div className="flex min-w-max items-end gap-0">
                {measures.map((measure) => (
                    <div
                        key={measure.measureId}
                        className="px-3 pb-2 text-right text-[10px] uppercase tracking-[0.08em] text-faint"
                        style={{ width: measure.width }}
                    >
                        {measure.number}
                    </div>
                ))}
            </div>
        </div>
    );
}
