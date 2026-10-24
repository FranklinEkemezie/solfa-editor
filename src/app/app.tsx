import { useState } from 'react';
import { ToastViewport } from '@/components/feedback/toast-viewport';
import { useToasts } from '@/components/feedback/use-toasts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppHeader } from '@/app/components/app-header';
import { ToolRail } from '@/app/components/tool-rail';
import { buildScoreToolGroups } from '@/app/score-tools';
import { scoreDisplayTitle } from '@/domain/music';
import { NewDocumentDialog } from '@/features/document-library/new-document-dialog';
import { OpenDocumentDialog } from '@/features/document-library/open-document-dialog';
import { exportScoreToPdf } from '@/features/pdf-export/export-score';
import { PrintScore } from '@/features/pdf-export/print-score';
import { SaveButton } from '@/features/persistence/save-button';
import {
    useScorePersistence,
    type PersistenceStatus,
} from '@/features/persistence/use-score-persistence';
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
import { gloriaJudeNnam } from '@/features/score-editor/presets';
import { useScoreStore } from '@/features/score-editor/state/score-store';

const SAVE_STATUS_LABEL: Record<PersistenceStatus, string> = {
    opening: 'Opening…',
    saving: 'Saving…',
    saved: 'Saved',
    unsaved: 'Unsaved changes',
    new: 'Not saved yet',
    error: 'Storage error',
};

export function App() {
    const store = useScoreStore();
    const { toasts, addToast, dismiss } = useToasts();
    const documentView = useDocumentZoom();
    const [toolsOpen, setToolsOpen] = useState(true);
    const [newDocumentOpen, setNewDocumentOpen] = useState(false);
    const [openDocumentOpen, setOpenDocumentOpen] = useState(false);

    usePinchZoom({
        surfaceRef: documentView.viewportRef,
        pagesRef: documentView.pagesRef,
        zoom: documentView.zoom,
        onZoom: documentView.zoomTo,
    });

    const editing = useScoreEditing(store, addToast);
    const { isPlaying, activeNoteKey, toggle, stop } = usePlayback(store.view, addToast);

    const persistence = useScorePersistence({
        document: store.document,
        position: store.position,
        zoom: documentView.zoom,
        onRestore: (saved) => {
            store.restore(saved.document, saved.caret);
            documentView.zoomTo(saved.zoom);
        },
        onError: addToast,
        onMigration: (report) => {
            const messages: string[] = [];

            if (report.migrated > 0) {
                const sheets = report.migrated === 1 ? 'sheet' : 'sheets';
                messages.push(`${report.migrated} earlier ${sheets} moved into Open.`);
            }
            if (report.skipped > 0) {
                const records = report.skipped === 1 ? 'record' : 'records';
                messages.push(
                    `${report.skipped} older ${records} could not be read and stayed in the old store.`,
                );
            }

            addToast(messages.join(' '), report.skipped > 0 ? 'warning' : 'info');
        },
    });

    const printResult = () => {
        const result = exportScoreToPdf(store.view);
        if (!result.ok) addToast(result.message);
    };

    const removeMeasure = () => {
        const result = store.removeMeasure();
        if (!result.ok) addToast(result.message);
    };

    const saveScore = async () => {
        const result = await persistence.saveNow();
        if (result.ok) addToast('Saved to this browser.', 'info');
        else addToast(result.message);
    };

    const tools = buildScoreToolGroups({
        onNewDocument: () => setNewDocumentOpen(true),
        onOpenDocument: () => setOpenDocumentOpen(true),
        canUndo: store.canUndo,
        canRedo: store.canRedo,
        onUndo: store.undo,
        onRedo: store.redo,
        onAddMeasure: store.addMeasure,
        onRemoveMeasure: removeMeasure,
        onOpenGloria: () => store.openPreset(gloriaJudeNnam),
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
                    documentName={scoreDisplayTitle(store.document)}
                    documentStatus={SAVE_STATUS_LABEL[persistence.status]}
                    actions={
                        <>
                            <PlaybackControls
                                isPlaying={isPlaying}
                                onPlayPause={toggle}
                                onStop={stop}
                            />
                            <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
                            <SaveButton
                                onSave={saveScore}
                                isSaving={persistence.isSaving}
                                disabled={persistence.isHydrating || persistence.isSaving}
                            />
                        </>
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
                        aria-busy={persistence.isHydrating}
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
                    {persistence.isHydrating ? (
                        <div className="absolute inset-0 z-20 grid place-items-center bg-paper/70 text-sm text-ink-muted backdrop-blur-[1px]">
                            Opening your sheet…
                        </div>
                    ) : null}
                </div>
                <OnScreenKeyboard
                    onInput={editing.input}
                    onBackspace={editing.backspace}
                    activeDuration={activeDurationMark(store.document, store.position)}
                    octave={editing.octave}
                    onOctave={editing.shiftOctave}
                />
            </div>
            <PrintScore view={store.view} />
            <NewDocumentDialog
                open={newDocumentOpen}
                onOpenChange={setNewDocumentOpen}
                currentDocument={store.document}
                onCreate={persistence.createDocument}
            />
            <OpenDocumentDialog
                open={openDocumentOpen}
                onOpenChange={setOpenDocumentOpen}
                onList={persistence.listDocuments}
                onOpen={persistence.openDocument}
            />
            <ToastViewport messages={toasts} dismiss={dismiss} />
        </TooltipProvider>
    );
}
