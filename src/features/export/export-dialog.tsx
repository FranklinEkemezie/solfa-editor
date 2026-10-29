import {
    Download,
    FileJson,
    FileText,
    Image as ImageIcon,
    Loader2,
    Music,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { scoreDisplayTitle } from '@/domain/music';
import { encodeSolfaFile, solfaFileName } from '@/features/document-file/solfa-file';
import { downloadBlob, downloadText, scoreFileStemFor } from '@/features/export/download';
import {
    createPagesZip,
    createScorePdf,
    renderScorePages,
} from '@/features/export/render-score-images';
import {
    audioBufferToMp3,
    audioBufferToWav,
    renderScoreAudio,
    scoreAudioEvents,
    scoreDurationSeconds,
    type AudioFormat,
} from '@/features/export/score-audio';
import { PrintScore } from '@/features/pdf-export/print-score';
import { calculateScoreLayout } from '@/features/score-editor/layout/score-layout';
import type { ScoreView } from '@/features/score-editor/model/score-view';

type ExportType = 'pdf' | 'images' | 'audio' | 'solfa';

const EXPORT_TYPES: readonly {
    value: ExportType;
    label: string;
    description: string;
    icon: typeof FileText;
}[] = [
    {
        value: 'pdf',
        label: 'PDF',
        description: 'A4 pages',
        icon: FileText,
    },
    {
        value: 'images',
        label: 'Images',
        description: 'One PNG per page',
        icon: ImageIcon,
    },
    {
        value: 'audio',
        label: 'Audio',
        description: 'MP3 or WAV',
        icon: Music,
    },
    {
        value: 'solfa',
        label: 'Solfa file',
        description: 'Editable document',
        icon: FileJson,
    },
];

type PreviewState =
    | { status: 'idle'; images: string[] }
    | { status: 'loading'; images: string[] }
    | { status: 'ready'; images: string[] }
    | { status: 'error'; images: string[]; message: string };

function formatDuration(seconds: number): string {
    if (seconds <= 0) return '0:00';
    const whole = Math.ceil(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * The export sheet.
 *
 * The type picker changes the details and the preview together: a PDF or an
 * image set shows the actual first page, while audio and `.solfa` describe what
 * will be written. PDF and image exports are always rendered from the light
 * print sheet, whatever theme the editor is using.
 */
export function ExportDialog({
    open,
    onOpenChange,
    view,
    onExported,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    view: ScoreView;
    onExported?: (message: string) => void;
}) {
    const [type, setType] = useState<ExportType>('pdf');
    const [audioFormat, setAudioFormat] = useState<AudioFormat>('mp3');
    const [preview, setPreview] = useState<PreviewState>({ status: 'idle', images: [] });
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const renderRootRef = useRef<HTMLDivElement>(null);

    const pageCount = useMemo(() => calculateScoreLayout(view).pages.length, [view]);
    const audioEvents = useMemo(() => scoreAudioEvents(view), [view]);
    const audioDuration = useMemo(() => scoreDurationSeconds(audioEvents), [audioEvents]);
    const hasDiagnostics = view.diagnostics.length > 0;
    const needsPreview = type === 'pdf' || type === 'images';
    const selected = EXPORT_TYPES.find((option) => option.value === type) ?? EXPORT_TYPES[0];
    const SelectedIcon = selected.icon;

    useEffect(() => {
        if (open) return;
        setType('pdf');
        setAudioFormat('mp3');
        setPreview({ status: 'idle', images: [] });
        setExporting(false);
        setError(null);
    }, [open]);

    useEffect(() => {
        if (!open || !needsPreview || hasDiagnostics) {
            setPreview({ status: 'idle', images: [] });
            return undefined;
        }

        let cancelled = false;
        setPreview({ status: 'loading', images: [] });
        setError(null);

        // The hidden print sheet is mounted in the same render as this effect.
        // Waiting a frame lets its fonts and layout settle before capture.
        const timer = window.setTimeout(() => {
            const root = renderRootRef.current;
            if (!root) {
                if (!cancelled) {
                    setPreview({
                        status: 'error',
                        images: [],
                        message: 'The preview could not be prepared.',
                    });
                }
                return;
            }

            void renderScorePages(root, 1)
                .then((images) => {
                    if (!cancelled) setPreview({ status: 'ready', images });
                })
                .catch((cause: unknown) => {
                    if (!cancelled) {
                        setPreview({
                            status: 'error',
                            images: [],
                            message:
                                cause instanceof Error
                                    ? cause.message
                                    : 'The preview could not be prepared.',
                        });
                    }
                });
        }, 30);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [open, needsPreview, hasDiagnostics, view]);

    const exportEnabled =
        !exporting &&
        (type === 'solfa' ||
            (!hasDiagnostics &&
                (type === 'audio'
                    ? audioEvents.length > 0
                    : preview.status === 'ready' && preview.images.length > 0)));

    /** The preview holds page one; a multi-page export needs the rest. */
    const exportImages = async (): Promise<string[]> => {
        const root = renderRootRef.current;
        if (!root) throw new Error('The export sheet is not ready.');

        if (pageCount === 1 && preview.images.length === 1) return preview.images;
        return renderScorePages(root, pageCount);
    };

    const runExport = async () => {
        setExporting(true);
        setError(null);
        const stem = scoreFileStemFor(view.document);

        try {
            if (type === 'solfa') {
                downloadText(
                    encodeSolfaFile(view.document),
                    solfaFileName(view.document),
                    'application/json',
                );
                onExported?.('Solfa file exported.');
            } else if (type === 'pdf') {
                const images = await exportImages();
                const pdf = createScorePdf(images);
                pdf.save(`${stem}.pdf`);
                onExported?.('PDF exported.');
            } else if (type === 'images') {
                const zip = await createPagesZip(await exportImages());
                downloadBlob(zip, `${stem}-pages.zip`);
                onExported?.('Page images exported.');
            } else {
                const buffer = await renderScoreAudio(view);
                if (audioFormat === 'mp3') {
                    const bytes = audioBufferToMp3(buffer);
                    downloadBlob(
                        new Blob([bytes.slice().buffer], { type: 'audio/mpeg' }),
                        `${stem}.mp3`,
                    );
                    onExported?.('MP3 exported.');
                } else {
                    downloadBlob(audioBufferToWav(buffer), `${stem}.wav`);
                    onExported?.('WAV exported.');
                }
            }

            onOpenChange(false);
        } catch (cause) {
            setError(
                cause instanceof Error ? cause.message : 'The score could not be exported.',
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={exporting ? undefined : onOpenChange}>
                <DialogContent className="w-[min(56rem,calc(100vw-2rem))]">
                    <DialogHeader>
                        <DialogTitle>Export score</DialogTitle>
                        <DialogDescription>
                            Choose a format. PDF and image exports always use the light sheet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                        <div className="grid content-start gap-4">
                            <div className="grid gap-2">
                                <span className="text-sm font-medium text-ink">Format</span>
                                <Select
                                    value={type}
                                    onValueChange={(value) => {
                                        setType(value as ExportType);
                                        setError(null);
                                    }}
                                >
                                    <SelectTrigger aria-label="Export format" className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXPORT_TYPES.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label} — {option.description}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-md border border-line bg-cream/50 px-3.5 py-3 text-sm">
                                {type === 'pdf' ? (
                                    <p className="text-ink-muted">
                                        {pageCount} {pageCount === 1 ? 'page' : 'pages'} · A4 ·
                                        light theme
                                    </p>
                                ) : null}
                                {type === 'images' ? (
                                    <p className="text-ink-muted">
                                        {pageCount} PNG {pageCount === 1 ? 'file' : 'files'}, one
                                        per page · 2× resolution · ZIP
                                    </p>
                                ) : null}
                                {type === 'audio' ? (
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-ink-muted">Format</span>
                                            <Select
                                                value={audioFormat}
                                                onValueChange={(value) =>
                                                    setAudioFormat(value as AudioFormat)
                                                }
                                            >
                                                <SelectTrigger
                                                    aria-label="Audio format"
                                                    className="h-8 w-36"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="mp3">
                                                        MP3 · 192 kbps
                                                    </SelectItem>
                                                    <SelectItem value="wav">WAV · 16-bit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-ink-muted">
                                            {formatDuration(audioDuration)} · 44.1 kHz
                                        </p>
                                        {audioEvents.length === 0 ? (
                                            <p className="text-amber">There are no notes to export.</p>
                                        ) : null}
                                    </div>
                                ) : null}
                                {type === 'solfa' ? (
                                    <p className="text-ink-muted">
                                        Editable document only. Theme, zoom and other device
                                        preferences are not included.
                                    </p>
                                ) : null}
                            </div>

                            {hasDiagnostics ? (
                                <p
                                    role="alert"
                                    className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-ink"
                                >
                                    Fix the notation before exporting pages or audio:{' '}
                                    {view.diagnostics[0].message}
                                </p>
                            ) : null}

                            {error ? (
                                <p
                                    role="alert"
                                    className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-ink"
                                >
                                    {error}
                                </p>
                            ) : null}
                        </div>

                        <div className="min-w-0">
                            {needsPreview ? (
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-ink">Preview</span>
                                        {preview.status === 'ready' ? (
                                            <span className="text-xs text-muted">
                                                Page 1 of {pageCount}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="relative aspect-[794/1123] w-full overflow-hidden rounded-md border border-line bg-white shadow-panel">
                                        {preview.status === 'ready' && preview.images[0] ? (
                                            <img
                                                src={preview.images[0]}
                                                alt="First page of the exported score"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : preview.status === 'error' ? (
                                            <div className="grid h-full place-items-center px-4 text-center text-sm text-ink-muted">
                                                {preview.message}
                                            </div>
                                        ) : (
                                            <div className="grid h-full place-items-center gap-2 text-sm text-ink-muted">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Preparing preview…
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid h-full min-h-40 place-items-center rounded-md border border-line bg-cream/50 px-5 text-center">
                                    <div className="grid gap-1">
                                        <SelectedIcon
                                            size={22}
                                            strokeWidth={1.7}
                                            className="mx-auto text-green"
                                        />
                                        <p className="font-serif text-lg font-semibold text-ink">
                                            {scoreDisplayTitle(view.document)}
                                        </p>
                                        <p className="text-sm text-ink-muted">
                                            {selected.label} · {selected.description}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={exporting}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={!exportEnabled}
                            onClick={() => void runExport()}
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            {exporting ? 'Exporting…' : 'Export'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {open && needsPreview && !hasDiagnostics ? (
                <div ref={renderRootRef} className="export-render-root" aria-hidden="true">
                    <PrintScore view={view} paper />
                </div>
            ) : null}
        </>
    );
}
