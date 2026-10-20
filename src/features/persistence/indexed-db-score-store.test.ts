import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createEmptyScoreDocument, withVoice } from '@/domain/music';
import {
    createIndexedDbScoreStorage,
    type ScoreStorage,
} from '@/features/persistence/indexed-db-score-store';
import { encodeScore, type StoredScore } from '@/features/persistence/score-storage';

let databaseCounter = 0;

function uniqueStorage(): ScoreStorage {
    databaseCounter += 1;
    return createIndexedDbScoreStorage(`solfa-test-${Date.now()}-${databaseCounter}`);
}

const CARET = { part: 'soprano' as const, offset: 0 };

function savedRecord(savedAt: number): StoredScore {
    const document = withVoice(createEmptyScoreDocument(), 'soprano', ':drm');
    return encodeScore(
        { ...document, title: `Score ${savedAt}` },
        CARET,
        1,
        `id-${savedAt}`,
        savedAt,
    );
}

describe('the IndexedDB score store', () => {
    it('answers with nothing when this browser has no saved score', async () => {
        const storage = uniqueStorage();
        try {
            expect(await storage.loadLatest()).toBeNull();
        } finally {
            storage.close();
        }
    });

    it('reads back everything that was written', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save(savedRecord(1000));

            const loaded = await storage.loadLatest();

            expect(loaded?.id).toBe('id-1000');
            expect(loaded?.savedAt).toBe(1000);
            expect(loaded?.document.title).toBe('Score 1000');
            expect(loaded?.document.voices.soprano).toBe(':drm');
            expect(loaded?.caret).toEqual(CARET);
        } finally {
            storage.close();
        }
    });

    it('opens the most recently saved score', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save(savedRecord(1000));
            await storage.save(savedRecord(3000));
            await storage.save(savedRecord(2000));

            const loaded = await storage.loadLatest();

            expect(loaded?.savedAt).toBe(3000);
        } finally {
            storage.close();
        }
    });

    it('rejects a stored score that cannot be read', async () => {
        const storage = uniqueStorage();
        try {
            await storage.save({ version: 1, id: 'broken', savedAt: 1 } as unknown as StoredScore);

            await expect(storage.loadLatest()).rejects.toThrow();
        } finally {
            storage.close();
        }
    });
});
