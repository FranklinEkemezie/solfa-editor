import {
    decodeLegacyScore,
    encodeScore,
    type StoredScore,
} from '@/features/persistence/score-storage';

/**
 * Bring a score written by the first persistence format into the library.
 *
 * The old database kept one record per score id, with no distinction between
 * the time a score was created and the time it was last written. Migration
 * keeps its id, title, music, caret and zoom exactly, and uses the save time as
 * the creation time. Re-encoding goes through the current codec, so a migrated
 * record is validated just like a newly saved one.
 *
 * A record that cannot be read is reported rather than guessed at. The caller
 * leaves the original record in the old store, which is never deleted, so a
 * damaged score is not lost or silently replaced.
 */
export function migrateLegacyScore(value: unknown): StoredScore {
    const legacy = decodeLegacyScore(value);
    return encodeScore(
        legacy.document,
        legacy.caret,
        legacy.zoom,
        legacy.id,
        legacy.savedAt,
        legacy.savedAt,
    );
}

export type LegacyMigrationResult =
    | { readonly ok: true; readonly record: StoredScore }
    | { readonly ok: false; readonly reason: string };

/** A record-at-a-time migration that never throws for one unreadable score. */
export function migrateLegacyRecord(value: unknown): LegacyMigrationResult {
    try {
        return { ok: true, record: migrateLegacyScore(value) };
    } catch (error) {
        return {
            ok: false,
            reason: error instanceof Error ? error.message : 'The old score could not be read.',
        };
    }
}

export type LegacyMigrationBatch = {
    readonly records: readonly StoredScore[];
    readonly skipped: number;
};

/** A convenience for migrating a whole store in memory, such as in tests. */
export function migrateLegacyScores(values: readonly unknown[]): LegacyMigrationBatch {
    const records: StoredScore[] = [];
    let skipped = 0;

    for (const value of values) {
        const result = migrateLegacyRecord(value);
        if (result.ok) records.push(result.record);
        else skipped += 1;
    }

    return { records, skipped };
}
