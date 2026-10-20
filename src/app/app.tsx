import { useState } from 'react';
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
import { ScoreDocument } from '@/features/score-editor/components/score-document';
import { ScoreHeader } from '@/features/score-editor/components/score-header';
import { activeDurationMark } from '@/features/score-editor/editing/notation-editing';
import { useDocumentZoom } from '@/features/score-editor/hooks/use-document-zoom';
import { usePinchZoom } from '@/features/score-editor/hooks/use-pinch-zoom';
import { useScoreEditing } from '@/features/score-editor/hooks/use-score-editing';
import { DOCUMENT_INSET_PX } from '@/features/score-editor/layout/document-zoom';
import { useScoreStore } from '@/features/score-editor/state/score-store';

export function App() {
    const store = useScoreStore();
    const { toasts, addToast, dismiss } = useToasts();
    const documentView = useDocumentZoom();
    const [toolsOpen, setToolsOpen] = useState(true);

    usePinchZoom({
        surfaceRef: documentView.viewportRef,
        pagesRef: documentView.pagesRef,
        zoom: documentView.zoom,
        onZoom: documentView.zoomTo,
    });

    const editing = useScoreEditing(store, addToast);
    const { isPlaying, activeNoteKey, toggle, stop } = usePlayback(store.view, addToast);

    const printResult = () => {
        const result = exportScoreToPdf(store.view);
        if (!result.ok) addToast(result.message);
    };

    const removeMeasure = () => {
        const result = store.removeMeasure();
        if (!result.ok) addToast(result.message);
    };

    const tools = buildScoreToolGroups({
        canUndo: store.canUndo,
        canRedo: store.canRedo,
        onUndo: store.undo,
        onRedo: store.redo,
        onAddMeasure: store.addMeasure,
        onRemoveMeasure: removeMeasure,
        onExport: printResult,
        onZoomIn: documentView.zoomIn,
        onZoomOut: documentView.zoomOut,
        onFitWidth: documentView.fitWidth,
        onActualSize: documentView.actualSize,
        zoom: documentView.zoom,
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
                    <ToolRail
                        groups={tools}
                        open={toolsOpen}
                        onToggle={() => setToolsOpen((open) => !open)}
                    />
                    <main
                        ref={documentView.viewportRef}
                        aria-label="Score document"
                        className="document-surface min-w-0 flex-1"
                    >
                        <div
                            ref={documentView.pagesRef}
                            className="document-pages"
                            style={{ zoom: documentView.zoom, padding: DOCUMENT_INSET_PX }}
                        >
                            <ScoreDocument
                                view={store.view}
                                position={store.position}
                                masthead={
                                    <ScoreHeader
                                        document={store.document}
                                        onChange={(next) => store.commit(next, store.position)}
                                    />
                                }
                                onPositionChange={store.setPosition}
                                onKeyDown={editing.handleKeyDown}
                                activeNoteKey={activeNoteKey}
                            />
                        </div>
                    </main>
                </div>
                <OnScreenKeyboard
                    onInput={editing.input}
                    onBackspace={editing.backspace}
                    activeDuration={activeDurationMark(store.document, store.position)}
                />
            </div>
            <PrintScore view={store.view} />
            <ToastViewport messages={toasts} dismiss={dismiss} />
        </TooltipProvider>
    );
}
