import type { ReactNode } from 'react';

/**
 * The bar across the top of the app.
 *
 * It holds the name of the app, the name of the document being written, and
 * whatever the shell needs within reach from anywhere in the editor — today
 * that is playback and Save. The score's own title block is part of the sheet,
 * not part of this chrome; this name is the same title, shown where a document
 * editor keeps its file name.
 */
export function AppHeader({
    documentName,
    documentStatus,
    actions,
}: {
    documentName: string;
    documentStatus?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="flex h-14 flex-none items-center justify-between gap-3 border-b border-line bg-paper px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 items-baseline gap-1 font-serif text-2xl text-ink">
                    <span className="-rotate-6 text-3xl leading-none text-green">∿</span>
                    <span className="hidden sm:inline">solfa</span>
                </div>
                <span aria-hidden="true" className="h-6 w-px shrink-0 bg-line" />
                <div className="min-w-0">
                    <div
                        className="truncate text-sm font-medium leading-tight text-ink"
                        title={documentName}
                    >
                        {documentName}
                    </div>
                    {documentStatus ? (
                        <div
                            aria-live="polite"
                            className="truncate text-[10px] uppercase tracking-[0.14em] text-ink-muted"
                        >
                            {documentStatus}
                        </div>
                    ) : null}
                </div>
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
        </header>
    );
}
