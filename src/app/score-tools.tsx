import {
    ArrowDownToLine,
    FileMinus2,
    FileMusic,
    FilePlus,
    FilePlus2,
    FolderOpen,
    RotateCcw,
    RotateCw,
    UnfoldHorizontal,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { ToolRailGroup } from '@/app/components/tool-rail';
import { zoomLabel } from '@/features/score-editor/layout/document-zoom';

/** What the editor's tools need from the app to work. */
export type ScoreToolActions = {
    onNewDocument: () => void;
    onOpenDocument: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onAddMeasure: () => void;
    onRemoveMeasure: () => void;
    /** Open the Gloria sample without losing the blank default. */
    onOpenGloria: () => void;
    onExport: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitWidth: () => void;
    onActualSize: () => void;
    /** The zoom the document is being read at, shown on the rail. */
    zoom: number;
};

const ICON = { size: 16, strokeWidth: 2 } as const;

/**
 * The controls the score editor offers, in the order the rail stacks them.
 *
 * File first, then history, the measure commands, the sample, how the sheet is
 * looked at, and finally the way out of the app and onto paper.
 */
export function buildScoreToolGroups(actions: ScoreToolActions): ToolRailGroup[] {
    return [
        {
            id: 'file',
            items: [
                {
                    label: 'New document',
                    icon: <FilePlus {...ICON} />,
                    onSelect: actions.onNewDocument,
                },
                {
                    label: 'Open document',
                    icon: <FolderOpen {...ICON} />,
                    onSelect: actions.onOpenDocument,
                },
            ],
        },
        {
            id: 'history',
            items: [
                {
                    label: 'Undo',
                    icon: <RotateCcw {...ICON} />,
                    onSelect: actions.onUndo,
                    disabled: !actions.canUndo,
                },
                {
                    label: 'Redo',
                    icon: <RotateCw {...ICON} />,
                    onSelect: actions.onRedo,
                    disabled: !actions.canRedo,
                },
            ],
        },
        {
            id: 'measures',
            items: [
                {
                    label: 'Add measure',
                    icon: <FilePlus2 {...ICON} />,
                    onSelect: actions.onAddMeasure,
                },
                {
                    label: 'Remove last measure',
                    icon: <FileMinus2 {...ICON} />,
                    onSelect: actions.onRemoveMeasure,
                },
            ],
        },
        {
            id: 'samples',
            items: [
                {
                    label: 'Open the Gloria sample',
                    icon: <FileMusic {...ICON} />,
                    onSelect: actions.onOpenGloria,
                },
            ],
        },
        {
            id: 'view',
            items: [
                {
                    label: 'Zoom in',
                    icon: <ZoomIn {...ICON} />,
                    onSelect: actions.onZoomIn,
                },
                {
                    label: 'Zoom out',
                    icon: <ZoomOut {...ICON} />,
                    onSelect: actions.onZoomOut,
                },
                {
                    label: 'Fit the page width',
                    icon: <UnfoldHorizontal {...ICON} />,
                    onSelect: actions.onFitWidth,
                },
                {
                    label: 'Actual size',
                    icon: (
                        <span className="text-[0.6875rem] font-semibold tabular-nums">
                            {zoomLabel(actions.zoom)}
                        </span>
                    ),
                    onSelect: actions.onActualSize,
                },
            ],
        },
        {
            id: 'output',
            items: [
                {
                    label: 'Print / PDF',
                    icon: <ArrowDownToLine {...ICON} />,
                    onSelect: actions.onExport,
                },
            ],
        },
    ];
}
