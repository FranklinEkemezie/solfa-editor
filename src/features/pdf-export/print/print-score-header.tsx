import { timeSignatureLabel } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { metadataKeyLabel } from '@/features/score-editor/adapters/metadata-label';

export function PrintScoreHeader({ document }: { document: EditorDocument }) {
    const facts = [
        metadataKeyLabel(document),
        timeSignatureLabel(document.timeSignature),
        `♩ = ${document.tempo.beatsPerMinute}`,
    ];

    return (
        <header className="mb-[16pt] text-center">
            <p className="m-0 mb-[8pt] text-[7.5pt] font-bold uppercase tracking-[0.3em] text-green">
                SATB tonic sol-fa
            </p>
            <h1 className="m-0 text-[26pt] font-medium leading-[1.1] tracking-[-0.01em]">
                {document.title || 'Untitled solfa'}
            </h1>
            <p className="m-0 mt-[6pt] text-[11pt] italic text-ink-muted">
                {document.author ? `by ${document.author}` : 'Anonymous composition'}
            </p>
            <p className="m-0 mt-[9pt] text-[10pt] tracking-[0.06em] text-ink-muted">
                {facts.join('  ·  ')}
            </p>
            {document.tempo.description ? (
                <p className="m-0 mt-[5pt] text-[10.5pt] italic text-ink-muted">
                    {document.tempo.description}
                </p>
            ) : null}
            <div className="mt-[13pt] border-t border-line" />
        </header>
    );
}
