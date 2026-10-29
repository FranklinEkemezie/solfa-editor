import {
    ChevronDown,
    FileMusic,
    FolderOpen,
    Loader2,
    Plus,
    RefreshCw,
    Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { scoreDisplayTitle, timeSignatureLabel } from '@/domain/music';
import { formatSavedAt } from '@/features/document-library/saved-time';
import { keyLabel } from '@/features/score-editor/adapters/metadata-options';
import { gloriaJudeNnam, hallelujahChorus } from '@/features/score-editor/presets';
import type { ScorePreset } from '@/features/score-editor/presets/score-preset';
import type { ScoreSummary } from '@/features/persistence/score-storage';
import type { SaveOutcome } from '@/features/persistence/use-score-persistence';

const SAMPLES: readonly ScorePreset[] = [gloriaJudeNnam, hallelujahChorus];

/**
 * The Open document picker.
 *
 * Recent work and the built-in samples are two independently collapsible
 * shelves, so a long library does not push the samples out of reach. Opening a
 * sample or a recent sheet is save-first, like every other switch in the
 * editor: the current score is written before it is replaced.
 */
export function OpenDocumentDialog({
    open,
    onOpenChange,
    onList,
    onOpen,
    onOpenPreset,
    onImport,
    onNewDocument,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onList: () => Promise<ScoreSummary[]>;
    onOpen: (id: string) => Promise<SaveOutcome>;
    onOpenPreset: (preset: ScorePreset) => Promise<SaveOutcome>;
    onImport: () => void;
    onNewDocument: () => void;
}) {
    const [documents, setDocuments] = useState<ScoreSummary[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(false);
    const [opening, setOpening] = useState<string | null>(null);
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
                setError('The saved scores could not be read.');
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
        setOpening(null);
        setError(null);
    }, [open]);

    const selected = documents.find((document) => document.id === selectedId) ?? null;

    const openSelected = async (id = selectedId) => {
        if (!id) return;

        setOpening(id);
        setError(null);
        try {
            const result = await onOpen(id);
            if (result.ok) onOpenChange(false);
            else setError(result.message);
        } finally {
            setOpening(null);
        }
    };

    const openSample = async (preset: ScorePreset) => {
        setOpening(`sample:${preset.title}`);
        setError(null);
        try {
            const result = await onOpenPreset(preset);
            if (result.ok) onOpenChange(false);
            else setError(result.message);
        } finally {
            setOpening(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={opening ? undefined : onOpenChange}>
            <DialogContent className="w-[min(34rem,calc(100vw-2rem))]">
                <DialogHeader>
                    <DialogTitle>Open document</DialogTitle>
                    <DialogDescription>
                        Open a saved score, a sample, or a .solfa file.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center gap-2 rounded-md border border-line-soft bg-cream/60 px-3 py-6 text-sm text-ink-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reading your saved scores…
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <details
                            open
                            className="group rounded-md border border-line bg-cream/40"
                        >
                            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                                <ChevronDown
                                    size={15}
                                    strokeWidth={2}
                                    className="shrink-0 text-muted transition-transform group-open:rotate-180"
                                />
                                <FolderOpen size={15} strokeWidth={2} className="text-muted" />
                                <span className="flex-1">Recent</span>
                                <span className="font-mono text-xs tabular-nums text-muted">
                                    {documents.length}
                                </span>
                            </summary>
                            <div className="grid max-h-56 gap-1 overflow-y-auto border-t border-line-soft p-2">
                                {documents.length === 0 ? (
                                    <div className="px-2 py-4 text-sm text-ink-muted">
                                        No saved scores yet.
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onOpenChange(false);
                                                onNewDocument();
                                            }}
                                            className="ml-1 inline-flex items-center gap-1 font-medium text-green-dark underline-offset-2 hover:underline"
                                        >
                                            <Plus size={13} />
                                            Start a new one
                                        </button>
                                    </div>
                                ) : (
                                    documents.map((document) => {
                                        const isSelected = document.id === selectedId;
                                        const isOpening = opening === document.id;
                                        return (
                                            <button
                                                key={document.id}
                                                type="button"
                                                aria-pressed={isSelected}
                                                disabled={opening !== null}
                                                onClick={() => setSelectedId(document.id)}
                                                onDoubleClick={() => void openSelected(document.id)}
                                                className={
                                                    'grid gap-0.5 rounded px-2.5 py-2 text-left transition ' +
                                                    (isSelected
                                                        ? 'bg-paper shadow-key'
                                                        : 'hover:bg-paper/70')
                                                }
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="min-w-0 flex-1 truncate font-serif text-base font-semibold text-ink">
                                                        {scoreDisplayTitle(document)}
                                                    </span>
                                                    {isOpening ? (
                                                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted" />
                                                    ) : null}
                                                </span>
                                                {document.subtitle ? (
                                                    <span className="truncate text-xs italic text-ink-muted">
                                                        {document.subtitle}
                                                    </span>
                                                ) : null}
                                                <span className="truncate text-xs text-muted">
                                                    {document.author ? `${document.author} · ` : ''}
                                                    {keyLabel(document.key)} ·{' '}
                                                    {timeSignatureLabel(document.timeSignature)} ·{' '}
                                                    {document.measureCount}{' '}
                                                    {document.measureCount === 1
                                                        ? 'measure'
                                                        : 'measures'}{' '}
                                                    · {formatSavedAt(document.savedAt)}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </details>

                        <details className="group rounded-md border border-line bg-cream/40">
                            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                                <ChevronDown
                                    size={15}
                                    strokeWidth={2}
                                    className="shrink-0 text-muted transition-transform group-open:rotate-180"
                                />
                                <FileMusic size={15} strokeWidth={2} className="text-muted" />
                                <span className="flex-1">Samples</span>
                                <span className="font-mono text-xs tabular-nums text-muted">
                                    {SAMPLES.length}
                                </span>
                            </summary>
                            <div className="grid gap-1 border-t border-line-soft p-2">
                                {SAMPLES.map((sample) => {
                                    const key = `sample:${sample.title}`;
                                    const isOpening = opening === key;
                                    return (
                                        <button
                                            key={sample.title}
                                            type="button"
                                            disabled={opening !== null}
                                            onClick={() => void openSample(sample)}
                                            className="flex items-center gap-2 rounded px-2.5 py-2 text-left transition hover:bg-paper/70 disabled:opacity-50"
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-serif text-base font-semibold text-ink">
                                                    {sample.title}
                                                </span>
                                                <span className="block text-xs text-muted">
                                                    {sample.author}
                                                </span>
                                            </span>
                                            {isOpening ? (
                                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted" />
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </details>

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

                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={opening !== null}
                        onClick={() => {
                            onOpenChange(false);
                            onImport();
                        }}
                        className="sm:mr-auto"
                    >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Import .solfa
                    </Button>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={opening !== null}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={!selected || loading || opening !== null}
                            onClick={() => void openSelected()}
                        >
                            {opening === selectedId ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {opening === selectedId ? 'Opening…' : 'Open'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
