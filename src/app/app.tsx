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
import { useCommit } from '@/features/score-editor/hooks/use-commit';
import { useDocumentZoom } from '@/features/score-editor/hooks/use-document-zoom';
import { useMetadataEditing } from '@/features/score-editor/hooks/use-metadata-editing';
import { useScoreEditor } from '@/features/score-editor/hooks/use-score-editor';
import { useScoreKeyboard } from '@/features/score-editor/hooks/use-score-keyboard';
import { DOCUMENT_INSET_PX } from '@/features/score-editor/layout/document-zoom';
import { useScoreStore } from '@/features/score-editor/state/score-store';

export function App() {
    const store = useScoreStore();
    const { toasts, addToast, dismiss } = useToasts();
    const documentView = useDocumentZoom();
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
                    <main
                        ref={documentView.viewportRef}
                        aria-label="Score document"
                        className="document-surface min-w-0 flex-1"
                    >
                        <div
                            className="document-pages"
                            style={{ zoom: documentView.zoom, padding: DOCUMENT_INSET_PX }}
                        >
                            <ScoreDocument
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
                        </div>
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
