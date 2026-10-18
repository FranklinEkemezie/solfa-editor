import { ArrowDownToLine, FileMinus2, FilePlus2, RotateCcw, RotateCw } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

export function ScoreToolbar({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onAddMeasure,
    onRemoveMeasure,
    onExport,
}: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onAddMeasure: () => void;
    onRemoveMeasure: () => void;
    onExport: () => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 my-6">
            <div className="flex flex-wrap items-center gap-1">
                <IconButton label="Undo" onClick={onUndo} disabled={!canUndo}>
                    <RotateCcw size={16} strokeWidth={2} />
                </IconButton>
                <IconButton label="Redo" onClick={onRedo} disabled={!canRedo}>
                    <RotateCw size={16} strokeWidth={2} />
                </IconButton>
                <span className="mx-2 h-5 w-px bg-line" />
                <IconButton
                    label="Add measure"
                    variant="ghost"
                    onClick={onAddMeasure}
                    className="gap-2"
                >
                    <FilePlus2 size={15} strokeWidth={2} />
                    <span className="hidden sm:inline">Add measure</span>
                </IconButton>
                <IconButton
                    label="Remove last measure"
                    variant="ghost"
                    onClick={onRemoveMeasure}
                    className="gap-2"
                >
                    <FileMinus2 size={15} strokeWidth={2} />
                    <span className="hidden sm:inline">Remove measure</span>
                </IconButton>
            </div>
            <IconButton label="Print / PDF" variant="primary" onClick={onExport} className="gap-2">
                <ArrowDownToLine size={16} strokeWidth={2} />
                <span className="hidden sm:inline">Print / PDF</span>
            </IconButton>
        </div>
    );
}
