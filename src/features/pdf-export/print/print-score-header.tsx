import { timeSignatureLabel } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { metadataKeyLabel } from '@/features/score-editor/adapters/metadata-label';

export function PrintScoreHeader({ document }: { document: EditorDocument }) {
    return (
        <header className="border-b border-line pb-[10pt] mb-[18pt] text-center">
            <p className="mb-[6pt] text-[8pt] font-bold uppercase tracking-[0.18em] text-green">
                SATB tonic sol-fa
            </p>
            <h1 className="m-0 mb-[4pt] text-[24pt] font-medium">
                {document.title || 'Untitled solfa'}
            </h1>
            <p className="m-0 italic text-ink-muted">
                {document.author ? `by ${document.author}` : 'Anonymous composition'}
            </p>
            <p className="mt-[6pt] text-[11pt]">
                {metadataKeyLabel(document)} · {timeSignatureLabel(document.timeSignature)} · ♩ ={' '}
                {document.tempo.beatsPerMinute}
            </p>
            {document.tempo.description ? (
                <p className="mt-[6pt] text-[11pt] italic text-ink-muted">
                    {document.tempo.description}
                </p>
            ) : null}
        </header>
    );
}
