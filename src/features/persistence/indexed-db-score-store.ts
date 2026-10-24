import { migrateLegacyScore } from '@/features/persistence/legacy-score-migration';
import {
    decodeScore,
    summarizeScore,
    type RestoredScore,
    type ScoreSummary,
    type StoredScore,
} from '@/features/persistence/score-storage';

/**
 * The browser's shelf of scores.
 *
 * Documents live in one IndexedDB database. Each score is a record in the
 * `documents` store, keyed by its id and indexed by `savedAt`, so the Open
 * dialog can list the newest work first without reading every page. A tiny
 * `preferences` store remembers which document was last active, which is what
 * the editor opens on launch; it is written in the same transaction as a save
 * so the two can never disagree about what was last worked on.
 *
 * The database is versioned. Version 2 introduced the document library. A
 * database written by version 1 still has its original `scores` store, and the
 * upgrade copies every readable record into `documents` before the editor sees
 * the library. The old store is deliberately left untouched after migration:
 * it is the fallback copy of the writer's work and must never be a casualty of
 * a schema change.
 *
 * The store is deliberately thin: it moves plain records in and out, and the
 * codec decides what a valid record means. That split keeps the database code
 * testable without a DOM and the validation testable without a database.
 */

export const SCORE_DATABASE_NAME = 'solfa-editor';
export const SCORE_DATABASE_VERSION = 2;
export const SCORE_STORE_NAME = 'documents';
export const SCORE_PREFERENCES_STORE_NAME = 'preferences';
export const LEGACY_SCORE_STORE_NAME = 'scores';

const SAVED_AT_INDEX = 'savedAt';
const LAST_OPENED_KEY = 'lastOpenedDocumentId';

export type MigrationReport = {
    /** Old records copied into the document library. */
    readonly migrated: number;
    /** Old records that could not be read and were left in the old store. */
    readonly skipped: number;
};

type PreferencesRecord = {
    readonly key: string;
    readonly value: string;
};

export type ScoreStorage = {
    /** Every saved score, newest first. Unreadable records are left out. */
    list: () => Promise<ScoreSummary[]>;
    /** One saved score, or null when the id is not in the library. */
    load: (id: string) => Promise<RestoredScore | null>;
    /**
     * The document the editor should open: the last active one, falling back
     * to the most recently saved score.
     */
    loadLastOpened: () => Promise<RestoredScore | null>;
    /** Write a score and make it the active document in one transaction. */
    save: (record: StoredScore) => Promise<void>;
    /** Mark a document active without writing its music again. */
    rememberLastOpened: (id: string) => Promise<void>;
    /** The most recent schema migration, for a one-off notice. */
    takeMigrationReport: () => MigrationReport | null;
    close: () => void;
};

export function createIndexedDbScoreStorage(databaseName = SCORE_DATABASE_NAME): ScoreStorage {
    let databasePromise: Promise<IDBDatabase> | null = null;
    let migrationReport: MigrationReport | null = null;

    const openDatabase = (): Promise<IDBDatabase> => {
        if (databasePromise) return databasePromise;

        const pending = new Promise<IDBDatabase>((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('This browser does not provide IndexedDB.'));
                return;
            }

            const request = indexedDB.open(databaseName, SCORE_DATABASE_VERSION);

            request.onupgradeneeded = (event) => {
                const database = request.result;
                const transaction = request.transaction;
                if (!transaction) return;

                const documents = database.objectStoreNames.contains(SCORE_STORE_NAME)
                    ? transaction.objectStore(SCORE_STORE_NAME)
                    : database.createObjectStore(SCORE_STORE_NAME, { keyPath: 'id' });

                if (!documents.indexNames.contains(SAVED_AT_INDEX)) {
                    documents.createIndex(SAVED_AT_INDEX, 'savedAt');
                }

                if (!database.objectStoreNames.contains(SCORE_PREFERENCES_STORE_NAME)) {
                    database.createObjectStore(SCORE_PREFERENCES_STORE_NAME, { keyPath: 'key' });
                }

                if (
                    event.oldVersion < 2 &&
                    database.objectStoreNames.contains(LEGACY_SCORE_STORE_NAME)
                ) {
                    migrateLegacyStore(transaction, documents);
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

    /**
     * Copy version 1 records into the new store inside the upgrade
     * transaction. The old store is only read.
     */
    const migrateLegacyStore = (transaction: IDBTransaction, documents: IDBObjectStore): void => {
        let migrated = 0;
        let skipped = 0;
        let newest: { id: string; savedAt: number } | null = null;
        const legacy = transaction.objectStore(LEGACY_SCORE_STORE_NAME);
        const cursorRequest = legacy.openCursor();

        cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (!cursor) {
                migrationReport = { migrated, skipped };
                if (newest) {
                    transaction.objectStore(SCORE_PREFERENCES_STORE_NAME).put({
                        key: LAST_OPENED_KEY,
                        value: newest.id,
                    } satisfies PreferencesRecord);
                }
                return;
            }

            try {
                const record = migrateLegacyScore(cursor.value);
                documents.put(record);
                migrated += 1;
                if (!newest || record.savedAt > newest.savedAt) {
                    newest = { id: record.id, savedAt: record.savedAt };
                }
            } catch {
                // The original stays in `scores`, so nothing is lost even when
                // one old record is too damaged to bring forward.
                skipped += 1;
            }

            cursor.continue();
        };

        cursorRequest.onerror = () => {
            // The upgrade transaction will roll back, leaving the old database
            // exactly as it was instead of half-migrating it.
            skipped += 1;
        };
    };

    const readLastOpenedId = async (database: IDBDatabase): Promise<string | null> => {
        return new Promise<string | null>((resolve, reject) => {
            let value: string | null = null;
            const transaction = database.transaction(SCORE_PREFERENCES_STORE_NAME, 'readonly');
            const request = transaction
                .objectStore(SCORE_PREFERENCES_STORE_NAME)
                .get(LAST_OPENED_KEY);

            request.onsuccess = () => {
                const record = request.result as PreferencesRecord | undefined;
                value = typeof record?.value === 'string' ? record.value : null;
            };

            transaction.oncomplete = () => resolve(value);
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('The score settings could not be read.'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('The score settings read was cancelled.'));
        });
    };

    const load = async (id: string): Promise<RestoredScore | null> => {
        const database = await openDatabase();

        return new Promise<RestoredScore | null>((resolve, reject) => {
            let stored: unknown = undefined;
            const transaction = database.transaction(SCORE_STORE_NAME, 'readonly');
            const request = transaction.objectStore(SCORE_STORE_NAME).get(id);

            request.onsuccess = () => {
                stored = request.result;
            };

            transaction.oncomplete = () => {
                if (stored === undefined) {
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

    const loadNewest = async (database: IDBDatabase): Promise<RestoredScore | null> => {
        return new Promise<RestoredScore | null>((resolve, reject) => {
            let restored: RestoredScore | null = null;
            let firstError: unknown = null;
            const transaction = database.transaction(SCORE_STORE_NAME, 'readonly');
            const index = transaction.objectStore(SCORE_STORE_NAME).index(SAVED_AT_INDEX);
            const request = index.openCursor(null, 'prev');

            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor || restored) return;

                try {
                    restored = decodeScore(cursor.value);
                } catch (error) {
                    firstError ??= error;
                    cursor.continue();
                }
            };

            transaction.oncomplete = () => {
                if (restored) resolve(restored);
                else if (firstError) reject(firstError);
                else resolve(null);
            };

            transaction.onerror = () =>
                reject(transaction.error ?? new Error('The score database could not be read.'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('The score database read was cancelled.'));
        });
    };

    const loadLastOpened = async (): Promise<RestoredScore | null> => {
        const database = await openDatabase();
        const id = await readLastOpenedId(database);

        if (id) {
            try {
                const score = await load(id);
                if (score) return score;
            } catch {
                // A preference can outlive a record that was removed or damaged.
                // Fall through to the newest readable score.
            }
        }

        return loadNewest(database);
    };

    const list = async (): Promise<ScoreSummary[]> => {
        const database = await openDatabase();

        return new Promise<ScoreSummary[]>((resolve, reject) => {
            const summaries: ScoreSummary[] = [];
            const transaction = database.transaction(SCORE_STORE_NAME, 'readonly');
            const index = transaction.objectStore(SCORE_STORE_NAME).index(SAVED_AT_INDEX);
            const request = index.openCursor(null, 'prev');

            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) return;

                try {
                    summaries.push(summarizeScore(decodeScore(cursor.value)));
                } catch {
                    // A single bad record must not hide the rest of the shelf.
                }
                cursor.continue();
            };

            transaction.oncomplete = () => resolve(summaries);
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('The score library could not be read.'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('The score library read was cancelled.'));
        });
    };

    const save = async (record: StoredScore): Promise<void> => {
        const database = await openDatabase();

        return new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(
                [SCORE_STORE_NAME, SCORE_PREFERENCES_STORE_NAME],
                'readwrite',
            );
            transaction.objectStore(SCORE_STORE_NAME).put(record);
            transaction
                .objectStore(SCORE_PREFERENCES_STORE_NAME)
                .put({ key: LAST_OPENED_KEY, value: record.id } satisfies PreferencesRecord);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('The score could not be saved.'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('The score save was cancelled.'));
        });
    };

    const rememberLastOpened = async (id: string): Promise<void> => {
        const database = await openDatabase();

        return new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(SCORE_PREFERENCES_STORE_NAME, 'readwrite');
            transaction
                .objectStore(SCORE_PREFERENCES_STORE_NAME)
                .put({ key: LAST_OPENED_KEY, value: id } satisfies PreferencesRecord);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error ?? new Error('The score settings could not be saved.'));
            transaction.onabort = () =>
                reject(transaction.error ?? new Error('The score settings save was cancelled.'));
        });
    };

    const takeMigrationReport = (): MigrationReport | null => {
        const report = migrationReport;
        migrationReport = null;
        return report;
    };

    const close = () => {
        const pending = databasePromise;
        databasePromise = null;
        if (pending) {
            void pending.then((database) => database.close()).catch(() => undefined);
        }
    };

    return {
        list,
        load,
        loadLastOpened,
        save,
        rememberLastOpened,
        takeMigrationReport,
        close,
    };
}

/** The editor's shared storage handle. */
export const scoreStorage = createIndexedDbScoreStorage();
