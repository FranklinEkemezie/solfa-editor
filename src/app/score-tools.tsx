import {
    ArrowDownToLine,
    FileMinus2,
    FilePlus2,
    Frame,
    RotateCcw,
    RotateCw,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { ToolRailGroup } from '@/app/components/tool-rail';

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
    onFitPage: () => void;
    onActualSize: () => void;
    /** The current zoom, shown on the control that returns to full size. */
    zoomPercent: number;
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
                    label: 'Fit the page to the window',
                    icon: <Frame {...ICON} />,
                    onSelect: actions.onFitPage,
                },
                {
                    label: 'Actual size',
                    icon: (
                        <span className="text-[0.6875rem] font-semibold tabular-nums">
                            {actions.zoomPercent}%
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
