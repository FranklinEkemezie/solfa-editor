import {
    Download,
    FileMinus2,
    FilePlus,
    FilePlus2,
    FolderOpen,
    RotateCcw,
    RotateCw,
    Settings2,
    Upload,
} from 'lucide-react';
import type { ToolRailGroup } from '@/app/components/tool-rail';

/** What the editor's tools need from the app to work. */
export type ScoreToolActions = {
    onNewDocument: () => void;
    onOpenDocument: () => void;
    onImportDocument: () => void;
    onExportDocument: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onAddMeasure: () => void;
    onRemoveMeasure: () => void;
    onSettings: () => void;
};

const ICON = { size: 16, strokeWidth: 2 } as const;

/**
 * The controls the score editor offers, in the order the rail stacks them.
 *
 * File first, then history, the measure commands, and the editor's settings.
 * Zoom and theme live inside Settings rather than beside the document, so the
 * rail stays about the score and the shell keeps its few device preferences in
 * one place.
 */
export function buildScoreToolGroups(actions: ScoreToolActions): ToolRailGroup[] {
    return [
        {
            id: 'file',
            label: 'File',
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
                {
                    label: 'Import .solfa file',
                    icon: <Upload {...ICON} />,
                    onSelect: actions.onImportDocument,
                },
                {
                    label: 'Export score',
                    icon: <Download {...ICON} />,
                    onSelect: actions.onExportDocument,
                },
            ],
        },
        {
            id: 'history',
            label: 'History',
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
            label: 'Measures',
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
            id: 'settings',
            label: 'Settings',
            items: [
                {
                    label: 'Settings',
                    icon: <Settings2 {...ICON} />,
                    onSelect: actions.onSettings,
                },
            ],
        },
    ];
}
