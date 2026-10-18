import { useMemo } from 'react';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export function MeasureCount({ document }: { document: EditorDocument }) {
    const count = useMemo(
        () =>
            new Set(
                document.measures
                    .filter((measure) => measure.part === 'soprano')
                    .map((measure) => measure.number),
            ).size,
        [document],
    );

    return (
        <div className="flex justify-center mt-2">
            <span className="text-sm text-muted uppercase tracking-wide">
                {count} {count === 1 ? 'measure' : 'measures'} · SATB
            </span>
        </div>
    );
}
