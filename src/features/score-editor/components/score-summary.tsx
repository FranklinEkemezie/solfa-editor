import { timeSignatureLabel } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { metadataKeyLabel } from '@/features/score-editor/adapters/metadata-label';

export function ScoreSummary({ document }: { document: EditorDocument }) {
    return (
        <div className="flex items-center gap-3 text-sm text-green-dark">
            <span className="text-ink">{metadataKeyLabel(document)}</span>
            <span className="text-muted">·</span>
            <span className="text-ink">{timeSignatureLabel(document.timeSignature)}</span>
            <span className="text-muted">·</span>
            <span className="text-ink">♩ = {document.tempo.beatsPerMinute}</span>
            {document.tempo.description ? (
                <span className="text-muted ml-2 italic">{document.tempo.description}</span>
            ) : null}
        </div>
    );
}
