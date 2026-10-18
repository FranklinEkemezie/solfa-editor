import { useState } from 'react';
import { ToastViewport } from '@/components/feedback/toast-viewport';
import { useToasts } from '@/components/feedback/use-toasts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppFooter } from '@/app/components/app-footer';
import { AppHeader } from '@/app/components/app-header';
import { MeasureCount } from '@/app/components/measure-count';
import { MetadataPanel } from '@/app/components/metadata-panel';
import { MetadataToggle } from '@/app/components/metadata-toggle';
import { exportScoreToPdf } from '@/features/pdf-export/export-score';
import { PrintScore } from '@/features/pdf-export/print-score';
import { usePlayback } from '@/features/playback/hooks/use-playback';
import { PlaybackControls } from '@/features/playback/playback-controls';
import { ScoreCanvas } from '@/features/score-editor/components/score-canvas';
import { ScoreHeader } from '@/features/score-editor/components/score-header';
import { ScoreToolbar } from '@/features/score-editor/components/score-toolbar';
import { OnScreenKeyboard } from '@/features/score-editor/components/on-screen-keyboard';
import { useCommit } from '@/features/score-editor/hooks/use-commit';
import { useMetadataEditing } from '@/features/score-editor/hooks/use-metadata-editing';
import { useScoreEditor } from '@/features/score-editor/hooks/use-score-editor';
import { useScoreKeyboard } from '@/features/score-editor/hooks/use-score-keyboard';
import { useScoreStore } from '@/features/score-editor/state/score-store';

export function App() {
    const store = useScoreStore();
    const { toasts, addToast, dismiss } = useToasts();
    const [isMetadataOpen, setMetadataOpen] = useState(true);

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

    return (
        <TooltipProvider delayDuration={200}>
            <div className="app-shell min-h-screen">
                <AppHeader />
                <main className="mx-auto max-w-[1260px] px-6 md:px-20 py-10">
                    <div className="flex items-center justify-between gap-4">
                        <ScoreHeader document={store.document} />
                        <MetadataToggle
                            isOpen={isMetadataOpen}
                            onToggle={() => setMetadataOpen((open) => !open)}
                        />
                    </div>
                    <MetadataPanel
                        isOpen={isMetadataOpen}
                        document={store.document}
                        onChange={changeMetadata}
                    />
                    <div className="flex items-center justify-between my-5">
                        <ScoreToolbar
                            canUndo={store.canUndo}
                            canRedo={store.canRedo}
                            onUndo={store.undo}
                            onRedo={store.redo}
                            onAddMeasure={store.addMeasure}
                            onRemoveMeasure={removeMeasure}
                            onExport={printResult}
                        />
                        <PlaybackControls
                            isPlaying={isPlaying}
                            onPlayPause={toggle}
                            onStop={stop}
                        />
                    </div>
                    <ScoreCanvas
                        document={store.document}
                        position={store.position}
                        editor={editor}
                        onPositionChange={(next) => store.commit(store.document, next)}
                        onKeyDown={keyboard.handleKeyDown}
                        activeSlotId={activeSlotId}
                    />
                    <MeasureCount document={store.document} />
                    <OnScreenKeyboard onInput={keyboard.input} onBackspace={keyboard.backspace} />
                </main>
                <AppFooter />
            </div>
            <PrintScore document={store.document} />
            <ToastViewport messages={toasts} dismiss={dismiss} />
        </TooltipProvider>
    );
}
