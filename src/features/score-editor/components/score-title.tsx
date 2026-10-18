import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export function ScoreTitle({ document }: { document: EditorDocument }) {
    return (
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-ink">
                {document.title || 'Untitled solfa'}
            </h1>
            <p className="text-sm text-muted mt-1">
                {document.author ? `by ${document.author}` : 'Anonymous composition'}
            </p>
        </div>
    );
}
