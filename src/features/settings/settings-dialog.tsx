import { Monitor, Moon, Scan, Sun, UnfoldHorizontal, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import { zoomLabel } from '@/features/score-editor/layout/document-zoom';
import {
    THEME_OPTIONS,
    type ResolvedTheme,
    type ThemePreference,
} from '@/features/theme/theme';
import { cn } from '@/lib/utils';

const THEME_ICONS = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const;

/**
 * The settings that belong to the editor rather than to a score.
 *
 * Theme and zoom are device preferences. They are changed here, beside each
 * other, and never travel with a saved document or an exported `.solfa` file.
 */
export function SettingsDialog({
    open,
    onOpenChange,
    theme,
    resolvedTheme,
    onThemeChange,
    zoom,
    onZoomIn,
    onZoomOut,
    onFitWidth,
    onActualSize,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    theme: ThemePreference;
    resolvedTheme: ResolvedTheme;
    onThemeChange: (theme: ThemePreference) => void;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitWidth: () => void;
    onActualSize: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(28rem,calc(100vw-2rem))]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>Set how the editor looks and how much of the page fits.</DialogDescription>
                </DialogHeader>

                <section className="grid gap-2" aria-labelledby="settings-theme">
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 id="settings-theme" className="text-sm font-medium text-ink">
                            Theme
                        </h3>
                        <span className="text-xs text-muted">
                            {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 rounded-md border border-line bg-cream/60 p-1">
                        {THEME_OPTIONS.map((option) => {
                            const Icon = THEME_ICONS[option.value];
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={theme === option.value}
                                    onClick={() => onThemeChange(option.value)}
                                    className={cn(
                                        'flex items-center justify-center gap-1.5 rounded px-2 py-2 text-sm transition',
                                        theme === option.value
                                            ? 'bg-paper text-ink shadow-key'
                                            : 'text-ink-muted hover:bg-paper/60 hover:text-ink',
                                    )}
                                >
                                    <Icon size={15} strokeWidth={2} />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                        The sheet and exports stay light.
                    </p>
                </section>

                <section className="grid gap-2" aria-labelledby="settings-zoom">
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 id="settings-zoom" className="text-sm font-medium text-ink">
                            Zoom
                        </h3>
                        <span className="font-mono text-xs tabular-nums text-ink-muted">
                            {zoomLabel(zoom)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <IconButton
                            label="Zoom out"
                            variant="secondary"
                            onClick={onZoomOut}
                            className="size-9"
                        >
                            <ZoomOut size={16} strokeWidth={2} />
                        </IconButton>
                        <div className="flex h-9 flex-1 items-center justify-center rounded-md border border-line bg-paper font-mono text-sm tabular-nums text-ink">
                            {zoomLabel(zoom)}
                        </div>
                        <IconButton
                            label="Zoom in"
                            variant="secondary"
                            onClick={onZoomIn}
                            className="size-9"
                        >
                            <ZoomIn size={16} strokeWidth={2} />
                        </IconButton>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={onFitWidth}>
                            <UnfoldHorizontal className="mr-1.5 h-3.5 w-3.5" />
                            Fit width
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={onActualSize}>
                            <Scan className="mr-1.5 h-3.5 w-3.5" />
                            Actual size
                        </Button>
                    </div>
                </section>

                <DialogFooter>
                    <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
