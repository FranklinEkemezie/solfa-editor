import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScoreDocument } from '@/domain/music';
import { caretAt, type EditorPosition } from '@/features/score-editor/editing/caret';
import { MAX_ZOOM, MIN_ZOOM } from '@/features/score-editor/layout/document-zoom';
import { createAutosave } from '@/features/persistence/autosave';
import { scoreStorage, type ScoreStorage } from '@/features/persistence/indexed-db-score-store';
import { encodeScore, type RestoredScore } from '@/features/persistence/score-storage';

const AUTOSAVE_DELAY_MS = 800;

export type PersistenceStatus = 'opening' | 'saving' | 'saved' | 'unsaved' | 'new' | 'error';

export type SaveOutcome =
    | { readonly ok: true; readonly savedAt: number }
    | { readonly ok: false; readonly message: string };

export type ScorePersistence = {
    /** True until the browser's saved score, if any, has been applied. */
    isHydrating: boolean;
    isSaving: boolean;
    isDirty: boolean;
    lastSavedAt: number | null;
    error: string | null;
    status: PersistenceStatus;
    /** Write the current document immediately; used by the Save button. */
    saveNow: () => Promise<SaveOutcome>;
};

type ScoreSnapshot = {
    readonly document: ScoreDocument;
    readonly position: EditorPosition;
    readonly zoom: number;
};

type UseScorePersistenceOptions = {
    document: ScoreDocument;
    position: EditorPosition;
    zoom: number;
    /** Apply the saved score to the editor, before the sheet is editable. */
    onRestore: (score: RestoredScore) => void;
    /** Report a one-off storage failure, such as a score that cannot open. */
    onError?: (message: string) => void;
    storage?: ScoreStorage;
    delayMs?: number;
};

/**
 * Keep the current score in browser storage.
 *
 * Loading runs once, before autosave is armed, so the blank opening document
 * can never overwrite the score that was last saved. From then on changes are
 * debounced and coalesced: a burst of typing produces one write, and a write
 * already in progress is followed by the latest snapshot rather than a queue of
 * stale ones. The caret and zoom travel with the document so reopening puts the
 * writer back where they were.
 */
export function useScorePersistence({
    document,
    position,
    zoom,
    onRestore,
    onError,
    storage = scoreStorage,
    delayMs = AUTOSAVE_DELAY_MS,
}: UseScorePersistenceOptions): ScorePersistence {
    const [isHydrating, setIsHydrating] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const snapshotRef = useRef<ScoreSnapshot>({ document, position, zoom });
    snapshotRef.current = { document, position, zoom };

    const isHydratingRef = useRef(isHydrating);
    isHydratingRef.current = isHydrating;

    const storageRef = useRef(storage);
    storageRef.current = storage;

    const onRestoreRef = useRef(onRestore);
    onRestoreRef.current = onRestore;

    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const baselineRef = useRef<ScoreSnapshot | null>(null);
    const recordIdRef = useRef<string | null>(null);
    const savedAtRef = useRef<number | null>(null);
    const errorRef = useRef<string | null>(null);

    const autosaveRef = useRef<ReturnType<typeof createAutosave<ScoreSnapshot>> | null>(null);

    if (autosaveRef.current === null) {
        autosaveRef.current = createAutosave(async (snapshot) => {
            const id = recordIdRef.current ?? createScoreId();
            recordIdRef.current = id;

            setIsSaving(true);
            try {
                const savedAt = Date.now();
                await storageRef.current.save(
                    encodeScore(snapshot.document, snapshot.position, snapshot.zoom, id, savedAt),
                );

                savedAtRef.current = savedAt;
                errorRef.current = null;
                setLastSavedAt(savedAt);
                setError(null);
                baselineRef.current = snapshot;
                setIsDirty(!sameSnapshot(snapshotRef.current, snapshot));
            } catch (cause) {
                const message = 'Could not save this score to the browser.';
                errorRef.current = message;
                setError(message);
                throw cause;
            } finally {
                setIsSaving(false);
            }
        }, delayMs);
    }

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const saved = await storageRef.current.loadLatest();
                if (cancelled) return;

                if (saved) {
                    const caret = caretAt(
                        saved.caret.part,
                        saved.document.voices[saved.caret.part],
                        saved.caret.offset,
                    );
                    const restored: RestoredScore = {
                        ...saved,
                        caret,
                        zoom: clampZoom(saved.zoom),
                    };

                    recordIdRef.current = saved.id;
                    savedAtRef.current = saved.savedAt;
                    setLastSavedAt(saved.savedAt);
                    baselineRef.current = {
                        document: restored.document,
                        position: restored.caret,
                        zoom: restored.zoom,
                    };
                    onRestoreRef.current(restored);
                } else {
                    baselineRef.current = null;
                }
            } catch {
                if (cancelled) return;
                const message = 'The saved score could not be opened. Starting with a blank sheet.';
                errorRef.current = message;
                setError(message);
                onErrorRef.current?.(message);
                baselineRef.current = null;
            } finally {
                if (!cancelled) setIsHydrating(false);
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (isHydrating) return;

        const current = snapshotRef.current;

        /**
         * A blank opening is only settled once the zoom has been fitted to the
         * window, which happens a layout effect after the first paint. Treat
         * the first snapshot after opening as the baseline so autosave does not
         * mistake that fit for an edit.
         */
        if (baselineRef.current === null) {
            baselineRef.current = current;
            return;
        }

        if (sameSnapshot(current, baselineRef.current)) return;

        setIsDirty(true);
        autosaveRef.current?.schedule(current);
    }, [document, position, zoom, isHydrating]);

    useEffect(() => {
        const flush = () => {
            void autosaveRef.current?.flush().catch(() => undefined);
        };
        const onVisibilityChange = () => {
            if (window.document.visibilityState === 'hidden') flush();
        };

        window.addEventListener('pagehide', flush);
        window.document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('pagehide', flush);
            window.document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    const saveNow = useCallback(async (): Promise<SaveOutcome> => {
        if (isHydratingRef.current) {
            return { ok: false, message: 'The saved score is still opening.' };
        }

        const current = snapshotRef.current;
        const alreadySaved =
            recordIdRef.current !== null &&
            baselineRef.current !== null &&
            sameSnapshot(current, baselineRef.current);
        if (alreadySaved) {
            return { ok: true, savedAt: savedAtRef.current ?? Date.now() };
        }

        const autosave = autosaveRef.current;
        if (!autosave) {
            return { ok: false, message: 'Saving is not available in this browser.' };
        }

        autosave.schedule(current);
        try {
            await autosave.flush();
            return { ok: true, savedAt: savedAtRef.current ?? Date.now() };
        } catch {
            return {
                ok: false,
                message: errorRef.current ?? 'Could not save this score to the browser.',
            };
        }
    }, []);

    const status: PersistenceStatus = isHydrating
        ? 'opening'
        : isSaving
          ? 'saving'
          : error
            ? 'error'
            : isDirty
              ? 'unsaved'
              : lastSavedAt !== null
                ? 'saved'
                : 'new';

    return {
        isHydrating,
        isSaving,
        isDirty,
        lastSavedAt,
        error,
        status,
        saveNow,
    };
}

function sameSnapshot(a: ScoreSnapshot, b: ScoreSnapshot): boolean {
    return (
        a.document === b.document &&
        a.position.part === b.position.part &&
        a.position.offset === b.position.offset &&
        a.zoom === b.zoom
    );
}

function clampZoom(zoom: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function createScoreId(): string {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
        return cryptoApi.randomUUID();
    }
    return `score-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
