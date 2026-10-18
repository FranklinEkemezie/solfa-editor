import type { ReactNode } from 'react';

/**
 * The bar across the top of the app.
 *
 * It holds the name of the app and whatever the shell needs within reach from
 * anywhere in the editor — today that is playback. The score's own title block
 * is part of the sheet, not part of this chrome.
 */
export function AppHeader({ actions }: { actions?: ReactNode }) {
    return (
        <header className="flex h-14 flex-none items-center justify-between gap-4 border-b border-line bg-paper px-4 sm:px-6">
            <div className="flex items-baseline gap-1 font-serif text-2xl text-ink">
                <span className="-rotate-6 text-3xl leading-none text-green">∿</span>
                <span>solfa</span>
            </div>
            {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
        </header>
    );
}
