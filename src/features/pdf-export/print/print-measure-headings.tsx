import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';

export function PrintMeasureHeadings({ measures }: { measures: EditorMeasure[] }) {
    return (
        <div
            className="grid items-center border-b border-line-soft bg-cream py-1.5 text-[8pt] font-bold uppercase tracking-[0.08em] text-muted"
            style={{
                gridTemplateColumns: `26pt repeat(${measures.length}, minmax(48pt, 1fr))`,
            }}
        >
            <div />
            {measures.map((measure) => (
                <span key={measure.id} className="text-center">
                    m{measure.number}
                </span>
            ))}
        </div>
    );
}
