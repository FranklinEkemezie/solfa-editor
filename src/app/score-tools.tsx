import {
    ArrowDownToLine,
    FileMinus2,
    FilePlus2,
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
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onAddMeasure: () => void;
    onRemoveMeasure: () => void;
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
 * History first, then the measure commands, then how the sheet is looked at,
 * then the way out of the app and onto paper.
 */
export function buildScoreToolGroups(actions: ScoreToolActions): ToolRailGroup[] {
    return [
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
