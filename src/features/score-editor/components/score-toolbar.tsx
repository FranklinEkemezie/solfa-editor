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
        <div className="score-toolbar">
            <div className="toolbar-group">
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
                <span className="toolbar-divider" />
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
