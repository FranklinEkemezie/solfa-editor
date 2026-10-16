import { ArrowDownToLine, FileMinus2, FilePlus2, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';

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
                <Button
                    variant="icon"
                    title="Undo"
                    aria-label="Undo"
                    onClick={onUndo}
                    disabled={!canUndo}
                >
                    <RotateCcw size={16} strokeWidth={2} />
                </Button>
                <Button
                    variant="icon"
                    title="Redo"
                    aria-label="Redo"
                    onClick={onRedo}
                    disabled={!canRedo}
                >
                    <RotateCw size={16} strokeWidth={2} />
                </Button>
                <span className="mx-2 h-5 w-px bg-line" />
                <Button variant="ghost" onClick={onAddMeasure}>
                    <FilePlus2 size={15} strokeWidth={2} />
                    <span>Measure</span>
                </Button>
                <Button variant="ghost" onClick={onRemoveMeasure}>
                    <FileMinus2 size={15} strokeWidth={2} />
                    <span>Measure</span>
                </Button>
            </div>
            <Button variant="primary" onClick={onExport}>
                <ArrowDownToLine size={16} strokeWidth={2} />
                <span>Print / PDF</span>
            </Button>
        </div>
    );
}
