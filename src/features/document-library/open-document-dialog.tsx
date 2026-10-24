import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { scoreDisplayTitle, timeSignatureLabel } from '@/domain/music';
import { formatSavedAt, formatSavedDate } from '@/features/document-library/saved-time';
import { keyLabel } from '@/features/score-editor/adapters/metadata-options';
import type { ScoreSummary } from '@/features/persistence/score-storage';
import type { SaveOutcome } from '@/features/persistence/use-score-persistence';

/**
 * The Open document picker.
 *
 * The list is read when the dialog opens, newest first, and the chosen sheet is
 * described beneath the picker before it is opened. The current sheet is saved
 * first by the persistence layer, so opening another score cannot discard work
 * that was still waiting for autosave.
 */
export function OpenDocumentDialog({
    open,
    onOpenChange,
    onList,
    onOpen,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onList: () => Promise<ScoreSummary[]>;
    onOpen: (id: string) => Promise<SaveOutcome>;
}) {
    const [documents, setDocuments] = useState<ScoreSummary[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(false);
    const [opening, setOpening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!open) return undefined;

        let cancelled = false;
        setLoading(true);
        setError(null);

        void onList()
            .then((list) => {
                if (cancelled) return;
                setDocuments(list);
                setSelectedId((current) =>
                    list.some((document) => document.id === current)
                        ? current
                        : (list[0]?.id ?? ''),
                );
            })
            .catch(() => {
                if (cancelled) return;
                setDocuments([]);
                setSelectedId('');
                setError('The saved sheets could not be read.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, onList, reloadToken]);

    useEffect(() => {
        if (open) return;
        setOpening(false);
        setError(null);
    }, [open]);

    const selected = documents.find((document) => document.id === selectedId) ?? null;

    const openSelected = async () => {
        if (!selected) return;

        setOpening(true);
        setError(null);
        try {
            const result = await onOpen(selected.id);
            if (result.ok) onOpenChange(false);
            else setError(result.message);
        } finally {
            setOpening(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={opening ? undefined : onOpenChange}>
            <DialogContent className="w-[min(32rem,calc(100vw-2rem))]">
                <DialogHeader>
                    <DialogTitle>Open document</DialogTitle>
                    <DialogDescription>
                        Saved sheets are listed newest first. Your current sheet is saved before
                        another one opens.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center gap-2 rounded-md border border-line-soft bg-cream/60 px-3 py-6 text-sm text-ink-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reading your saved sheets…
                    </div>
                ) : documents.length === 0 ? (
                    <div className="rounded-md border border-line-soft bg-cream/60 px-4 py-6 text-sm text-ink-muted">
                        <p className="font-medium text-ink">No saved sheets yet.</p>
                        <p className="mt-1">
                            Use File → New document to start one. It will appear here as you write.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <FormField label="Saved sheets">
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger aria-label="Saved sheet">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {documents.map((document) => (
                                        <SelectItem key={document.id} value={document.id}>
                                            {scoreDisplayTitle(document)} ·{' '}
                                            {formatSavedAt(document.savedAt)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        {selected ? (
                            <div className="rounded-md border border-line bg-cream/50 px-4 py-3">
                                <p className="font-serif text-lg font-semibold leading-tight text-ink">
                                    {scoreDisplayTitle(selected)}
                                </p>
                                {selected.subtitle ? (
                                    <p className="text-sm italic text-ink-muted">
                                        {selected.subtitle}
                                    </p>
                                ) : null}
                                <p className="mt-1 text-sm text-ink-muted">
                                    {selected.author ? `By ${selected.author} · ` : ''}
                                    {keyLabel(selected.key)} ·{' '}
                                    {timeSignatureLabel(selected.timeSignature)} ·{' '}
                                    {selected.measureCount}{' '}
                                    {selected.measureCount === 1 ? 'measure' : 'measures'}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted">
                                    Saved {formatSavedDate(selected.savedAt)}
                                </p>
                            </div>
                        ) : null}
                    </div>
                )}

                {error ? (
                    <div
                        role="alert"
                        className="flex items-center justify-between gap-3 rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-ink"
                    >
                        <span>{error}</span>
                        {documents.length === 0 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0"
                                onClick={() => setReloadToken((token) => token + 1)}
                            >
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                Try again
                            </Button>
                        ) : null}
                    </div>
                ) : null}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={opening}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={!selected || loading || opening}
                        onClick={() => void openSelected()}
                    >
                        {opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {opening ? 'Opening…' : 'Open sheet'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
