import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScoreDocument } from '@/domain/music';
import {
    createDocumentFromDetails,
    type NewDocumentDetails,
} from '@/features/document-library/document-details';
import { caretAt, caretAtEnd, type EditorPosition } from '@/features/score-editor/editing/caret';
import { MAX_ZOOM, MIN_ZOOM } from '@/features/score-editor/layout/document-zoom';
import { createAutosave } from '@/features/persistence/autosave';
import {
    scoreStorage,
    type MigrationReport,
    type ScoreStorage,
} from '@/features/persistence/indexed-db-score-store';
import {
    encodeScore,
    type RestoredScore,
    type ScoreSummary,
} from '@/features/persistence/score-storage';

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
    /** Every saved score, newest first, for the Open dialog. */
    listDocuments: () => Promise<ScoreSummary[]>;
    /** Save the current score and start a new one from the supplied details. */
    createDocument: (details: NewDocumentDetails) => Promise<SaveOutcome>;
    /** Save the current score and open another from the library. */
    openDocument: (id: string) => Promise<SaveOutcome>;
    /**
     * Save the current score and add a document from outside the library.
     * Used by `.solfa` import and by opening a sample.
     */
    openDocumentFromScore: (document: ScoreDocument) => Promise<SaveOutcome>;
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
    /** Tell the writer when work from the old database has been brought forward. */
    onMigration?: (report: MigrationReport) => void;
    storage?: ScoreStorage;
    delayMs?: number;
};

/**
 * Keep the current score in the browser's document library.
 *
 * Loading runs once, before autosave is armed, so the blank opening document
 * can never overwrite the score that was last worked on. From then on changes
 * are debounced and coalesced: a burst of typing produces one write, and a
 * write already in progress is followed by the latest snapshot rather than a
 * queue of stale ones. The caret and zoom travel with the document so reopening
 * puts the writer back where they were.
 *
 * Switching scores is deliberately save-first. The current sheet is flushed
 * before a new document is created or another one is loaded; if that write
 * fails, the switch is refused rather than moving on with unsaved work. Undo
 * history is not stored and starts fresh for the opened score.
 */
export function useScorePersistence({
    document,
    position,
    zoom,
    onRestore,
    onError,
    onMigration,
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

    const isDirtyRef = useRef(isDirty);
    isDirtyRef.current = isDirty;

    const storageRef = useRef(storage);
    storageRef.current = storage;

    const onRestoreRef = useRef(onRestore);
    onRestoreRef.current = onRestore;

    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const onMigrationRef = useRef(onMigration);
    onMigrationRef.current = onMigration;

    const baselineRef = useRef<ScoreSnapshot | null>(null);
    const recordIdRef = useRef<string | null>(null);
    const createdAtRef = useRef<number | null>(null);
    const savedAtRef = useRef<number | null>(null);
    const errorRef = useRef<string | null>(null);

    const autosaveRef = useRef<ReturnType<typeof createAutosave<ScoreSnapshot>> | null>(null);

    if (autosaveRef.current === null) {
        autosaveRef.current = createAutosave(async (snapshot) => {
            const id = recordIdRef.current ?? createScoreId();
            const createdAt = createdAtRef.current ?? Date.now();
            recordIdRef.current = id;
            createdAtRef.current = createdAt;

            setIsSaving(true);
            try {
                const savedAt = Date.now();
                await storageRef.current.save(
                    encodeScore(
                        snapshot.document,
                        snapshot.position,
                        snapshot.zoom,
                        id,
                        savedAt,
                        createdAt,
                    ),
                );

                savedAtRef.current = savedAt;
                errorRef.current = null;
                setLastSavedAt(savedAt);
                setError(null);
                baselineRef.current = snapshot;

                const dirty = !sameSnapshot(snapshotRef.current, snapshot);
                isDirtyRef.current = dirty;
                setIsDirty(dirty);
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
                const saved = await storageRef.current.loadLastOpened();
                if (cancelled) return;

                if (saved) {
                    applyRestored(saved);
                } else {
                    baselineRef.current = null;
                }

                const report = storageRef.current.takeMigrationReport();
                if (report && (report.migrated > 0 || report.skipped > 0)) {
                    onMigrationRef.current?.(report);
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
        // The storage handle and callbacks are kept in refs so opening runs once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        isDirtyRef.current = true;
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

    /** Put a restored score into the editor and make it the save target. */
    const applyRestored = useCallback((saved: RestoredScore) => {
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

        recordIdRef.current = restored.id;
        createdAtRef.current = restored.createdAt;
        savedAtRef.current = restored.savedAt;
        errorRef.current = null;
        baselineRef.current = {
            document: restored.document,
            position: restored.caret,
            zoom: restored.zoom,
        };
        isDirtyRef.current = false;
        setLastSavedAt(restored.savedAt);
        setIsDirty(false);
        setError(null);
        onRestoreRef.current(restored);
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

    /**
     * The blank page the editor mounts with is not a document yet. It is not
     * written to the library just because another score is about to be opened;
     * only real work is saved before a switch.
     */
    const saveBeforeSwitch = useCallback(async (): Promise<SaveOutcome> => {
        if (recordIdRef.current === null && !isDirtyRef.current) {
            return { ok: true, savedAt: savedAtRef.current ?? Date.now() };
        }
        return saveNow();
    }, [saveNow]);

    const listDocuments = useCallback(async (): Promise<ScoreSummary[]> => {
        return storageRef.current.list();
    }, []);

    const adoptDocument = useCallback(
        async (next: ScoreDocument, failureMessage: string): Promise<SaveOutcome> => {
            if (isHydratingRef.current) {
                return { ok: false, message: 'The saved score is still opening.' };
            }

            const saved = await saveBeforeSwitch();
            if (!saved.ok) return saved;

            const id = createScoreId();
            const now = Date.now();
            const nextPosition = caretAtEnd(next);
            const nextZoom = clampZoom(snapshotRef.current.zoom);
            const record = encodeScore(next, nextPosition, nextZoom, id, now, now);

            setIsSaving(true);
            try {
                await storageRef.current.save(record);
            } catch {
                errorRef.current = failureMessage;
                setError(failureMessage);
                return { ok: false, message: failureMessage };
            } finally {
                setIsSaving(false);
            }

            applyRestored({
                id,
                document: next,
                caret: nextPosition,
                zoom: nextZoom,
                createdAt: now,
                savedAt: now,
            });

            try {
                await storageRef.current.rememberLastOpened(id);
            } catch {
                // The score is open and saved; remembering the active record is
                // a convenience, not a reason to fail the open.
            }

            return { ok: true, savedAt: now };
        },
        [applyRestored, saveBeforeSwitch],
    );

    const createDocument = useCallback(
        async (details: NewDocumentDetails): Promise<SaveOutcome> => {
            return adoptDocument(
                createDocumentFromDetails(details),
                'The new score could not be created in this browser.',
            );
        },
        [adoptDocument],
    );

    const openDocumentFromScore = useCallback(
        async (next: ScoreDocument): Promise<SaveOutcome> => {
            return adoptDocument(next, 'That score could not be added to this browser.');
        },
        [adoptDocument],
    );

    const openDocument = useCallback(
        async (id: string): Promise<SaveOutcome> => {
            if (isHydratingRef.current) {
                return { ok: false, message: 'The saved score is still opening.' };
            }

            const saved = await saveBeforeSwitch();
            if (!saved.ok) return saved;

            if (id === recordIdRef.current) {
                return { ok: true, savedAt: savedAtRef.current ?? Date.now() };
            }

            setIsSaving(true);
            try {
                const loaded = await storageRef.current.load(id);
                if (!loaded) {
                    return { ok: false, message: 'That saved sheet could not be found.' };
                }

                applyRestored(loaded);
                try {
                    await storageRef.current.rememberLastOpened(id);
                } catch {
                    // The score is open; remembering which one was active is
                    // helpful but must not turn a successful open into an error.
                }
                return { ok: true, savedAt: loaded.savedAt };
            } catch {
                const message = 'That saved sheet could not be opened.';
                errorRef.current = message;
                setError(message);
                return { ok: false, message };
            } finally {
                setIsSaving(false);
            }
        },
        [applyRestored, saveBeforeSwitch],
    );

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
        listDocuments,
        createDocument,
        openDocument,
        openDocumentFromScore,
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
