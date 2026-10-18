import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { AuthorField } from '@/features/score-editor/components/metadata/author-field';
import { KeyField } from '@/features/score-editor/components/metadata/key-field';
import { TempoField } from '@/features/score-editor/components/metadata/tempo-field';
import { TimeSignatureField } from '@/features/score-editor/components/metadata/time-signature-field';
import { TitleField } from '@/features/score-editor/components/metadata/title-field';

export function ScoreMetadata({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    return (
        <section
            className="grid gap-6 grid-cols-1 lg:grid-cols-[1.1fr_2.4fr] mt-7 p-6 border border-line rounded-lg bg-paper"
            aria-label="Score metadata"
        >
            <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-green">
                    Score
                </span>
                <p className="mt-2 text-sm leading-6 text-muted max-w-[160px]">
                    Minimal score details.
                </p>
            </div>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                <TitleField document={document} onChange={onChange} />
                <AuthorField document={document} onChange={onChange} />
            </div>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:col-start-2">
                <KeyField document={document} onChange={onChange} />
                <TimeSignatureField document={document} onChange={onChange} />
                <TempoField document={document} onChange={onChange} />
            </div>
        </section>
    );
}
