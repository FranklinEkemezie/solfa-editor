import { describe, expect, it } from 'vitest';
import {
    createEmptyScoreDocument,
    Key,
    KeySignature,
    Letter,
    Mode,
    Accidental,
    withVoice,
} from '@/domain/music';
import {
    migrateLegacyRecord,
    migrateLegacyScore,
    migrateLegacyScores,
} from '@/features/persistence/legacy-score-migration';
import { encodeScore, type LegacyStoredScore } from '@/features/persistence/score-storage';

function legacyRecord(savedAt = 1700): LegacyStoredScore {
    const document = {
        ...withVoice(createEmptyScoreDocument(), 'soprano', ':drm'),
        title: 'Old Gloria',
        author: 'Jude Nnam',
        key: new Key(Letter.D, new KeySignature(Accidental.SHARP, 2), Mode.MAJOR),
    };

    const current = encodeScore(
        document,
        { part: 'soprano', offset: 3 },
        1.4,
        `old-${savedAt}`,
        savedAt,
    );

    return { ...current, version: 1 } as unknown as LegacyStoredScore;
}

describe('migrating the first persistence format', () => {
    it('keeps the id, music, settings and save time of an old score', () => {
        const migrated = migrateLegacyScore(legacyRecord(1700));

        expect(migrated.version).toBe(2);
        expect(migrated.id).toBe('old-1700');
        expect(migrated.document.title).toBe('Old Gloria');
        expect(migrated.document.author).toBe('Jude Nnam');
        expect(migrated.document.voices.soprano).toBe(':drm');
        expect(migrated.caret).toEqual({ part: 'soprano', offset: 3 });
        expect(migrated.zoom).toBe(1.4);
        expect(migrated.savedAt).toBe(1700);
    });

    it('uses the old save time as the creation time', () => {
        const migrated = migrateLegacyScore(legacyRecord(2400));

        expect(migrated.createdAt).toBe(2400);
    });

    it('reports a damaged record instead of throwing away the others', () => {
        const batch = migrateLegacyScores([
            legacyRecord(1000),
            { version: 1, id: 'broken' },
            legacyRecord(3000),
        ]);

        expect(batch.records.map((record) => record.id)).toEqual(['old-1000', 'old-3000']);
        expect(batch.skipped).toBe(1);
    });

    it('reports the reason a single old record cannot be read', () => {
        const result = migrateLegacyRecord({ version: 2, id: 'newer' });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toMatch(/different version/i);
    });
});
