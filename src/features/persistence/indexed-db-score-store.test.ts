import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createEmptyScoreDocument, withVoice, type ScoreDocument } from '@/domain/music';
import {
    createIndexedDbScoreStorage,
    LEGACY_SCORE_STORE_NAME,
    SCORE_STORE_NAME,
    type ScoreStorage,
} from '@/features/persistence/indexed-db-score-store';
import {
    encodeScore,
    type LegacyStoredScore,
    type StoredScore,
} from '@/features/persistence/score-storage';

let databaseCounter = 0;

function uniqueDatabaseName(): string {
    databaseCounter += 1;
    return `solfa-test-${Date.now()}-${databaseCounter}`;
}

function uniqueStorage(name = uniqueDatabaseName()): ScoreStorage {
    return createIndexedDbScoreStorage(name);
}

const CARET = { part: 'soprano' as const, offset: 0 };

function documentNamed(title: string): ScoreDocument {
    return { ...withVoice(createEmptyScoreDocument(), 'soprano', ':drm'), title };
}

function savedRecord(savedAt: number, title = `Score ${savedAt}`): StoredScore {
    return encodeScore(documentNamed(title), CARET, 1, `id-${savedAt}`, savedAt, savedAt - 500);
}

function legacyRecord(savedAt: number): LegacyStoredScore {
    return { ...savedRecord(savedAt), version: 1 } as LegacyStoredScore;
}

/** Build the database exactly as persistence version 1 left it. */
function createLegacyDatabase(name: string, records: readonly unknown[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 1);

        request.onupgradeneeded = () => {
            const store = request.result.createObjectStore(LEGACY_SCORE_STORE_NAME, {
                keyPath: 'id',
            });
            store.createIndex('savedAt', 'savedAt');
        };

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const database = request.result;
            const transaction = database.transaction(LEGACY_SCORE_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(LEGACY_SCORE_STORE_NAME);
            for (const record of records) store.put(record);

            transaction.oncomplete = () => {
                database.close();
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        };
    });
}

function readStoreCount(name: string, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const database = request.result;
            const transaction = database.transaction(storeName, 'readonly');
            const count = transaction.objectStore(storeName).count();
            transaction.oncomplete = () => {
                database.close();
                resolve(count.result);
            };
            transaction.onerror = () => reject(transaction.error);
        };
    });
}

describe('the IndexedDB score store', () => {
    it('answers with an empty shelf when this browser has no scores', async () => {
        const storage = uniqueStorage();
        try {
            expect(await storage.list()).toEqual([]);
            expect(await storage.loadLastOpened()).toBeNull();
        } finally {
            storage.close();
        }
    });

    it('keeps several scores at once and reads each one back', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save(savedRecord(1000, 'First'));
            await storage.save(savedRecord(2000, 'Second'));

            const first = await storage.load('id-1000');
            const second = await storage.load('id-2000');

            expect(first?.document.title).toBe('First');
            expect(second?.document.title).toBe('Second');
            expect(second?.document.voices.soprano).toBe(':drm');
            expect(second?.caret).toEqual(CARET);
            expect(second?.savedAt).toBe(2000);
        } finally {
            storage.close();
        }
    });

    it('lists the newest saved score first', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save(savedRecord(1000, 'First'));
            await storage.save(savedRecord(3000, 'Third'));
            await storage.save(savedRecord(2000, 'Second'));

            const documents = await storage.list();

            expect(documents.map((document) => document.title)).toEqual([
                'Third',
                'Second',
                'First',
            ]);
            expect(documents[0]).toMatchObject({
                id: 'id-3000',
                savedAt: 3000,
                createdAt: 2500,
                measureCount: 4,
            });
        } finally {
            storage.close();
        }
    });

    it('opens the document most recently saved by default', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save(savedRecord(1000, 'First'));
            await storage.save(savedRecord(2000, 'Second'));

            const opened = await storage.loadLastOpened();

            expect(opened?.document.title).toBe('Second');
        } finally {
            storage.close();
        }
    });

    it('opens the document the writer chose even when another is newer', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save(savedRecord(3000, 'Newer'));
            await storage.save(savedRecord(1000, 'Older'));
            await storage.rememberLastOpened('id-1000');

            const opened = await storage.loadLastOpened();

            expect(opened?.document.title).toBe('Older');
        } finally {
            storage.close();
        }
    });

    it('rejects a score that cannot be read without hiding the others', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save(savedRecord(1000));
            await storage.save({
                version: 2,
                id: 'broken',
                savedAt: 2000,
            } as unknown as StoredScore);

            expect(await storage.list()).toHaveLength(1);
            await expect(storage.load('broken')).rejects.toThrow();
        } finally {
            storage.close();
        }
    });
});

describe('migrating the first database format', () => {
    it('copies every old score into the library and keeps the old store', async () => {
        const databaseName = uniqueDatabaseName();
        await createLegacyDatabase(databaseName, [
            legacyRecord(1000),
            legacyRecord(3000),
            legacyRecord(2000),
        ]);
        const storage = uniqueStorage(databaseName);

        try {
            const documents = await storage.list();

            expect(documents.map((document) => document.id)).toEqual([
                'id-3000',
                'id-2000',
                'id-1000',
            ]);
            expect((await storage.load('id-1000'))?.document.title).toBe('Score 1000');
            expect((await storage.loadLastOpened())?.id).toBe('id-3000');
            expect(storage.takeMigrationReport()).toEqual({ migrated: 3, skipped: 0 });

            // The original records remain untouched as a fallback copy.
            expect(await readStoreCount(databaseName, LEGACY_SCORE_STORE_NAME)).toBe(3);
            expect(await readStoreCount(databaseName, SCORE_STORE_NAME)).toBe(3);
        } finally {
            storage.close();
        }
    });

    it('migrates readable records and leaves a damaged one in the old store', async () => {
        const databaseName = uniqueDatabaseName();
        await createLegacyDatabase(databaseName, [
            legacyRecord(1000),
            { version: 1, id: 'broken' },
            legacyRecord(2000),
        ]);
        const storage = uniqueStorage(databaseName);

        try {
            expect(await storage.list()).toHaveLength(2);
            expect(storage.takeMigrationReport()).toEqual({ migrated: 2, skipped: 1 });
            expect(await readStoreCount(databaseName, LEGACY_SCORE_STORE_NAME)).toBe(3);
        } finally {
            storage.close();
        }
    });

    it('does not migrate again on the next open', async () => {
        const databaseName = uniqueDatabaseName();
        await createLegacyDatabase(databaseName, [legacyRecord(1000)]);

        const first = uniqueStorage(databaseName);
        expect(await first.list()).toHaveLength(1);
        first.close();

        const second = uniqueStorage(databaseName);
        try {
            expect(await second.list()).toHaveLength(1);
            expect(second.takeMigrationReport()).toBeNull();
            expect(await readStoreCount(databaseName, LEGACY_SCORE_STORE_NAME)).toBe(1);
        } finally {
            second.close();
        }
    });
});
