import {
    decodeScore,
    type RestoredScore,
    type StoredScore,
} from '@/features/persistence/score-storage';

/**
 * The browser's copy of the writer's score.
 *
 * Scores live in one IndexedDB database and one object store, keyed by their
 * id. The `savedAt` index lets the editor open the most recently written score
 * without reading every record, which is all the single-document editor needs
 * today and leaves room for a document list later.
 *
 * The store is deliberately thin: it moves plain records in and out, and the
 * codec decides what a valid record means. That split keeps the database code
 * testable without a DOM and the validation testable without a database.
 */

export const SCORE_DATABASE_NAME = 'solfa-editor';
export const SCORE_DATABASE_VERSION = 1;
export const SCORE_STORE_NAME = 'scores';
const SAVED_AT_INDEX = 'savedAt';

export type ScoreStorage = {
    /** The most recently saved score, or null when this browser has none. */
    loadLatest: () => Promise<RestoredScore | null>;
    save: (record: StoredScore) => Promise<void>;
    close: () => void;
};

export function createIndexedDbScoreStorage(databaseName = SCORE_DATABASE_NAME): ScoreStorage {
    let databasePromise: Promise<IDBDatabase> | null = null;

    const openDatabase = (): Promise<IDBDatabase> => {
        if (databasePromise) return databasePromise;

        const pending = new Promise<IDBDatabase>((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('This browser does not provide IndexedDB.'));
                return;
            }

            const request = indexedDB.open(databaseName, SCORE_DATABASE_VERSION);

            request.onupgradeneeded = () => {
                const database = request.result;
                const store = database.objectStoreNames.contains(SCORE_STORE_NAME)
                    ? request.transaction?.objectStore(SCORE_STORE_NAME)
                    : database.createObjectStore(SCORE_STORE_NAME, { keyPath: 'id' });

                if (store && !store.indexNames.contains(SAVED_AT_INDEX)) {
                    store.createIndex(SAVED_AT_INDEX, 'savedAt');
                }
            };

            request.onsuccess = () => {
                const database = request.result;
                database.onversionchange = () => {
                    database.close();
                    databasePromise = null;
                };
                resolve(database);
            };

            request.onerror = () => {
                databasePromise = null;
                reject(request.error ?? new Error('The score database could not be opened.'));
            };

            request.onblocked = () => {
                databasePromise = null;
                reject(new Error('The score database is open in another tab.'));
            };
        });

        databasePromise = pending;
        return pending;
    };

    const loadLatest = async (): Promise<RestoredScore | null> => {
        const database = await openDatabase();

        return new Promise<RestoredScore | null>((resolve, reject) => {
            let stored: unknown = null;
            const transaction = database.transaction(SCORE_STORE_NAME, 'readonly');
            const index = transaction.objectStore(SCORE_STORE_NAME).index(SAVED_AT_INDEX);
            const request = index.openCursor(null, 'prev');

            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) return;
                stored = cursor.value;
            };

            transaction.oncomplete = () => {
                if (stored === null) {
                    resolve(null);
                    return;
                }
                try {
                    resolve(decodeScore(stored));
                } catch (error) {
                    reject(error);
                }
            };

            transaction.onerror = () =>
                reject(transaction.error ?? new Error('The score database could not be read.'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('The score database read was cancelled.'));
        });
    };

    const save = async (record: StoredScore): Promise<void> => {
        const database = await openDatabase();

        return new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(SCORE_STORE_NAME, 'readwrite');
            transaction.objectStore(SCORE_STORE_NAME).put(record);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('The score could not be saved.'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('The score save was cancelled.'));
        });
    };

    const close = () => {
        const pending = databasePromise;
        databasePromise = null;
        if (pending) {
            void pending.then((database) => database.close()).catch(() => undefined);
        }
    };

    return { loadLatest, save, close };
}

/** The editor's shared storage handle. */
export const scoreStorage = createIndexedDbScoreStorage();
