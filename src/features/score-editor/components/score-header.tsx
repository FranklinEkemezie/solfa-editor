import type { EditorDocument } from '../adapters/editor-document-schema';
import { metadataKeyLabel } from '../adapters/editor-to-domain';

export function ScoreHeader({ document }: { document: EditorDocument }) {
    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-semibold text-ink">
                    {document.title || 'Untitled solfa'}
                </h1>
                <p className="text-sm text-muted mt-1">
                    {document.author ? `by ${document.author}` : 'Anonymous composition'}
                </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-green-dark">
                <span className="text-ink">{metadataKeyLabel(document)}</span>
                <span className="text-muted">·</span>
                <span className="text-ink">
                    {document.timeSignature.count}/
                    {noteValueDenominator(document.timeSignature.note)}
                </span>
                <span className="text-muted">·</span>
                <span className="text-ink">♩ = {document.tempo.beatsPerMinute}</span>
                {document.tempo.description ? (
                    <span className="text-muted ml-2 italic">{document.tempo.description}</span>
                ) : null}
            </div>
        </div>
    );
}

function noteValueDenominator(note: EditorDocument['timeSignature']['note']): number {
    const map = {
        WHOLE: 1,
        HALF: 2,
        QUARTER: 4,
        EIGHTH: 8,
        SIXTEENTH: 16,
        THIRTY_SECOND: 32,
        SIXTY_FOURTH: 64,
    } as const;
    return map[note];
}
