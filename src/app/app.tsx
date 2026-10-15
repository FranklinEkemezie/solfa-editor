import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '../components/ui/button';
import { ToastViewport, type ToastMessage } from '../components/feedback/toast';
import { PrintScore } from '../features/pdf-export/print-score';
import { exportScoreToPdf } from '../features/pdf-export/export-score';
import { editorToDomain } from '../features/score-editor/adapters/editor-to-domain';
import { toTiptapJson } from '../features/score-editor/adapters/editor-document-schema';
import { createScoreEditor } from '../features/score-editor/editor/create-editor';
import { createEmptyScore } from '../domain/music';
import { domainToEditor } from '../features/score-editor/adapters/domain-to-editor';
import { interpretInput } from '../features/score-editor/editor/input-rules';
import { ScoreCanvas } from '../features/score-editor/components/score-canvas';
import { ScoreHeader } from '../features/score-editor/components/score-header';
import { ScoreMetadata } from '../features/score-editor/components/score-metadata';
import { ScoreToolbar } from '../features/score-editor/components/score-toolbar';
import { useScoreStore } from '../features/score-editor/state/score-store';
import { advancePosition, previousPosition, clearSlot, type EditorPosition } from '../features/score-editor/state/score-commands';
import { NoteValue, TimeSignature } from '../domain/music';
import type { EditorDocument } from '../features/score-editor/adapters/editor-document-schema';
import { PlaybackControls } from '../features/playback/playback-controls';
import { ScorePlayer } from '../features/playback/playback-service';

export function App() {
  const store = useScoreStore();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMetadataOpen, setMetadataOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<ScorePlayer | null>(null);
  const [editor] = useState(() => createScoreEditor(toTiptapJson(domainToEditor(createEmptyScore()))));

  const addToast = useCallback((message: string, tone: ToastMessage['tone'] = 'warning') => {
    setToasts((current) => {
      if (current.some((toast) => toast.message === message)) return current;
      return [...current.slice(-2), { id: Date.now(), tone, message }];
    });
  }, []);

  const syncEditor = useCallback((document: EditorDocument) => {
    if (!editor) return;
    editor.commands.setContent(toTiptapJson(document), false);
  }, [editor]);

  useEffect(() => syncEditor(store.document), [store.document, syncEditor]);

  useEffect(() => {
    playerRef.current?.stop();
    setIsPlaying(false);
    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  const commit = useCallback((document: EditorDocument, position?: EditorPosition) => {
    try {
      editorToDomain(document);
      store.commit(document, position);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'That edit would make the score invalid.');
    }
  }, [addToast, store]);

  const handlePlaybackToggle = useCallback(async () => {
    if (!playerRef.current) {
      playerRef.current = new ScorePlayer();
    }

    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
      return;
    }

    try {
      await playerRef.current.start(store.document);
      setIsPlaying(true);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Playback could not start.');
    }
  }, [addToast, isPlaying, store.document]);

  const handlePlaybackStop = useCallback(() => {
    playerRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) {
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) store.redo(); else store.undo();
      }
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        store.redo();
      }
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      store.commit(store.document, advancePosition(store.document, store.position));
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      store.commit(store.document, previousPosition(store.document, store.position));
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      const currentSlot = store.document.measures.find((measure) => measure.id === store.position.measureId)?.slots[store.position.slotIndex];
      if (currentSlot?.syllable) {
        commit(clearSlot(store.document, store.position), store.position);
      } else {
        const previous = previousPosition(store.document, store.position);
        commit(clearSlot(store.document, previous), previous);
      }
      return;
    }
    if (event.key === 'Delete') {
      event.preventDefault();
      commit(clearSlot(store.document, store.position), store.position);
      return;
    }
    if (event.key.length !== 1) return;

    event.preventDefault();
    const result = interpretInput(store.document, store.position, event.key);
    if (result.rejected) {
      addToast(result.rejected);
      void playErrorTone();
      return;
    }
    commit(result.document, result.position);
    if (result.status) addToast(result.status, 'info');
  };

  const changeMetadata = (document: EditorDocument) => {
    const timeChanged = document.timeSignature.count !== store.document.timeSignature.count || document.timeSignature.note !== store.document.timeSignature.note;
    if (timeChanged) {
      const slotsPerMeasure = document.timeSignature.note === NoteValue.EIGHTH ? document.timeSignature.count : document.timeSignature.count;
      document = {
        ...document,
        measures: document.measures.map((measure) => ({
          ...measure,
          timeSignature: new TimeSignature(document.timeSignature.note, document.timeSignature.count),
          slots: measure.slots.length === slotsPerMeasure
            ? measure.slots
            : Array.from({ length: slotsPerMeasure }, (_, index) => measure.slots[index] ?? { id: `${measure.part}-${measure.number}-${index}`, noteValue: document.timeSignature.note === NoteValue.EIGHTH ? NoteValue.EIGHTH : NoteValue.QUARTER }),
        })),
      };
    }
    commit(document, store.position);
  };

  const printResult = () => {
    const result = exportScoreToPdf(store.document);
    if (!result.ok) addToast(result.message);
  };

  const measureCount = useMemo(() => new Set(store.document.measures.filter((measure) => measure.part === 'soprano').map((measure) => measure.number)).size, [store.document]);

  return (
    <>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand-lockup"><span className="brand-mark">∿</span><span>solfa</span><small>studio</small></div>
          <div className="header-center"><span className="header-status-dot" /> Unsaved composition</div>
          <div className="header-actions"><Button variant="ghost" onClick={() => addToast('Your score is stored locally in this prototype.', 'info')}>Local draft</Button><span className="avatar">C</span></div>
        </header>
        <main className="workspace">
          <div className="workspace-top"><ScoreHeader document={store.document} /><Button variant="ghost" className="metadata-toggle" onClick={() => setMetadataOpen((open) => !open)}>{isMetadataOpen ? 'Hide details' : 'Edit details'} <span>{isMetadataOpen ? '⌃' : '⌄'}</span></Button></div>
          {isMetadataOpen ? <ScoreMetadata document={store.document} onChange={changeMetadata} /> : null}
          <div className="score-actions">
            <ScoreToolbar canUndo={store.canUndo} canRedo={store.canRedo} onUndo={store.undo} onRedo={store.redo} onAddMeasure={store.addMeasure} onRemoveMeasure={() => { if (!store.removeMeasure()) addToast('Keep at least one measure in the score.'); }} onExport={printResult} />
            <PlaybackControls isPlaying={isPlaying} onPlayPause={handlePlaybackToggle} onStop={handlePlaybackStop} />
          </div>
          {editor ? <ScoreCanvas document={store.document} position={store.position} editor={editor} onPositionChange={(next) => store.commit(store.document, next)} onKeyDown={handleKeyDown} /> : null}
          <div className="workspace-footnote"><span><i className="legend-dot legend-active" /> active position</span><span><i className="legend-dot legend-empty" /> empty rhythmic position</span><span className="measure-count">{measureCount} {measureCount === 1 ? 'measure' : 'measures'} · four-part score</span></div>
        </main>
        <footer className="app-footer"><span>Built for clear musical thinking.</span><span>Keyboard-first · structured score · print-ready</span></footer>
      </div>
      <PrintScore document={store.document} />
      <ToastViewport messages={toasts} dismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    </>
  );
}

async function playErrorTone(): Promise<void> {
  try {
    const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 170;
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
    window.setTimeout(() => void context.close(), 150);
  } catch {
    // Audio feedback is optional and can be blocked by browser policy.
  }
}
