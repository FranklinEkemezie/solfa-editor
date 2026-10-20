import type { ScoreView } from '@/features/score-editor/model/score-view';

export function exportScoreToPdf(view: ScoreView): { ok: true } | { ok: false; message: string } {
    if (view.diagnostics.length > 0) {
        return {
            ok: false,
            message: view.diagnostics[0].message,
        };
    }

    const cleanup = () => window.document.body.classList.remove('print-mode');
    window.document.body.classList.add('print-mode');
    window.setTimeout(() => window.print(), 40);
    window.addEventListener('afterprint', cleanup, { once: true });
    return { ok: true };
}
