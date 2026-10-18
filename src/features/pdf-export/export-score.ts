import { editorToDomain } from '@/features/score-editor/adapters/editor-to-domain';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export function exportScoreToPdf(
    scoreDocument: EditorDocument,
): { ok: true } | { ok: false; message: string } {
    try {
        editorToDomain(scoreDocument);
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : 'The score is not ready to print.',
        };
    }

    const cleanup = () => window.document.body.classList.remove('print-mode');
    window.document.body.classList.add('print-mode');
    window.setTimeout(() => window.print(), 40);
    window.addEventListener('afterprint', cleanup, { once: true });
    return { ok: true };
}
