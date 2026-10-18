import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { ScoreSummary } from '@/features/score-editor/components/score-summary';
import { ScoreTitle } from '@/features/score-editor/components/score-title';

export function ScoreHeader({ document }: { document: EditorDocument }) {
    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <ScoreTitle document={document} />
            <ScoreSummary document={document} />
        </div>
    );
}
