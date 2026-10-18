import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { ScoreMetadata } from '@/features/score-editor/components/score-metadata';

export function MetadataPanel({
    isOpen,
    document,
    onChange,
}: {
    isOpen: boolean;
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    return (
        <div
            className={`transition-all duration-300 ${isOpen ? 'max-h-[1400px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
            aria-hidden={!isOpen}
        >
            <ScoreMetadata document={document} onChange={onChange} />
        </div>
    );
}
