import { useRef, useState } from 'react';
import { ToastViewport } from '@/components/feedback/toast-viewport';
import { useToasts } from '@/components/feedback/use-toasts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppHeader } from '@/app/components/app-header';
import { ToolRail } from '@/app/components/tool-rail';
import { buildScoreToolGroups } from '@/app/score-tools';
import { exportScoreToPdf } from '@/features/pdf-export/export-score';
import { PrintScore } from '@/features/pdf-export/print-score';
import { usePlayback } from '@/features/playback/hooks/use-playback';
import { PlaybackControls } from '@/features/playback/playback-controls';
import { OnScreenKeyboard } from '@/features/score-editor/components/on-screen-keyboard';
import { ScoreCanvas } from '@/features/score-editor/components/score-canvas';
import { ScoreHeader } from '@/features/score-editor/components/score-header';
import { ScoreStage, type ScoreStageHandle } from '@/features/score-editor/components/score-stage';
import { useCommit } from '@/features/score-editor/hooks/use-commit';
import { useMetadataEditing } from '@/features/score-editor/hooks/use-metadata-editing';
import { useScoreEditor } from '@/features/score-editor/hooks/use-score-editor';
import { useScoreKeyboard } from '@/features/score-editor/hooks/use-score-keyboard';
import { useScoreStore } from '@/features/score-editor/state/score-store';

export function App() {
    const store = useScoreStore();
    const { toasts, addToast, dismiss } = useToasts();
    const stage = useRef<ScoreStageHandle>(null);
    const [scale, setScale] = useState(1);
    const [toolsOpen, setToolsOpen] = useState(true);

    const editor = useScoreEditor(store.document);
    const commit = useCommit(store, addToast);
    const changeMetadata = useMetadataEditing(store, commit);
    const { isPlaying, activeSlotId, toggle, stop } = usePlayback(store.document, addToast);

    const keyboard = useScoreKeyboard({
        document: store.document,
        position: store.position,
        commit,
        moveTo: (position) => store.commit(store.document, position),
        undo: store.undo,
        redo: store.redo,
        onMessage: addToast,
    });

    const printResult = () => {
        const result = exportScoreToPdf(store.document);
        if (!result.ok) addToast(result.message);
    };

    const removeMeasure = () => {
        if (!store.removeMeasure()) addToast('Keep at least one measure in the score.');
    };

    const tools = buildScoreToolGroups({
        canUndo: store.canUndo,
        canRedo: store.canRedo,
        onUndo: store.undo,
        onRedo: store.redo,
        onAddMeasure: store.addMeasure,
        onRemoveMeasure: removeMeasure,
        onExport: printResult,
        onZoomIn: () => stage.current?.zoomIn(),
        onZoomOut: () => stage.current?.zoomOut(),
        onFitPage: () => stage.current?.fitToPage(),
        onActualSize: () => stage.current?.actualSize(),
        zoomPercent: Math.round(scale * 100),
    });

    return (
        <TooltipProvider delayDuration={200}>
            <div className="app-shell flex h-dvh flex-col overflow-hidden">
                <AppHeader
                    actions={
                        <PlaybackControls
                            isPlaying={isPlaying}
                            onPlayPause={toggle}
                            onStop={stop}
                        />
                    }
                />
                <div className="relative flex min-h-0 flex-1">
                    <main className="min-w-0 flex-1">
                        <ScoreStage ref={stage} onScaleChange={setScale}>
                            <ScoreCanvas
                                document={store.document}
                                position={store.position}
                                editor={editor}
                                masthead={
                                    <ScoreHeader
                                        document={store.document}
                                        onChange={changeMetadata}
                                    />
                                }
                                onPositionChange={(next) => store.commit(store.document, next)}
                                onKeyDown={keyboard.handleKeyDown}
                                activeSlotId={activeSlotId}
                            />
                        </ScoreStage>
                    </main>
                    <ToolRail
                        groups={tools}
                        open={toolsOpen}
                        onToggle={() => setToolsOpen((open) => !open)}
                    />
                </div>
                <OnScreenKeyboard onInput={keyboard.input} onBackspace={keyboard.backspace} />
            </div>
            <PrintScore document={store.document} />
            <ToastViewport messages={toasts} dismiss={dismiss} />
        </TooltipProvider>
    );
}
