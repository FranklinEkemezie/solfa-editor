import type { PartId } from '@/domain/parts';
import { lyricLine, withLyricLine, type ScoreDocument } from '@/domain/score-document';
import type { ScoreView } from '@/features/score-editor/model/score-view';

/**
 * One note a lyric syllable can be written under.
 *
 * Only notes that begin take a syllable. A rest is silent and a continuation
 * is the same note still sounding, so neither is a place to start a word.
 */
export type LyricAnchor = {
    readonly noteKey: string;
    readonly measure: number;
    readonly beat: number;
    /** The caret offset that puts the editor on the beat where the note begins. */
    readonly sourceOffset: number;
};

/** Every note in a part that can carry a lyric, in reading order. */
export function lyricAnchors(view: ScoreView, part: PartId): LyricAnchor[] {
    const anchors: LyricAnchor[] = [];

    for (const measure of view.parts[part].measures) {
        for (const beat of measure.beats) {
            for (const item of beat.items) {
                if (item.kind !== 'note') continue;
                anchors.push({
                    noteKey: item.noteKey,
                    measure: measure.number,
                    beat: beat.number,
                    sourceOffset: beat.sourceOffset,
                });
            }
        }
    }

    return anchors;
}

/** True once the writer has added a lyric line, even if no word is written yet. */
export function hasLyricLine(document: ScoreDocument, part: PartId): boolean {
    return lyricLine(document, part).length > 0;
}

/**
 * Make the lyric line long enough for every note in the part.
 *
 * Adding lyrics to a part with notes creates one empty cell per note, so the
 * line exists before the first syllable is typed and stays aligned as the
 * writer moves along it.
 */
export function ensureLyricLine(
    document: ScoreDocument,
    part: PartId,
    noteCount: number,
): ScoreDocument {
    const line = lyricLine(document, part);
    if (line.length >= noteCount) return document;

    const next = [...line];
    while (next.length < noteCount) next.push('');
    return withLyricLine(document, part, next);
}

/** Write a whole syllable into one cell, extending the line when needed. */
export function setSyllable(
    document: ScoreDocument,
    part: PartId,
    index: number,
    text: string,
): ScoreDocument {
    const line = [...lyricLine(document, part)];
    while (line.length <= index) line.push('');
    line[index] = text;
    return withLyricLine(document, part, line);
}

/** Append a typed character to the syllable at the caret. */
export function appendToSyllable(
    document: ScoreDocument,
    part: PartId,
    index: number,
    text: string,
): ScoreDocument {
    const line = [...lyricLine(document, part)];
    while (line.length <= index) line.push('');
    line[index] = `${line[index] ?? ''}${text}`;
    return withLyricLine(document, part, line);
}

/**
 * Delete the last character of the current syllable, stepping back to the
 * previous cell when the current one is already empty.
 */
export function deleteLastCharacter(
    document: ScoreDocument,
    part: PartId,
    index: number,
): { readonly document: ScoreDocument; readonly index: number; readonly removed: boolean } {
    const line = [...lyricLine(document, part)];

    if ((line[index] ?? '').length > 0) {
        line[index] = (line[index] ?? '').slice(0, -1);
        return { document: withLyricLine(document, part, line), index, removed: true };
    }

    if (index > 0) {
        const previous = index - 1;
        line[previous] = (line[previous] ?? '').slice(0, -1);
        return { document: withLyricLine(document, part, line), index: previous, removed: true };
    }

    return { document, index, removed: false };
}

/** Remove a part's lyric line entirely. */
export function clearLyricLine(document: ScoreDocument, part: PartId): ScoreDocument {
    return withLyricLine(document, part, []);
}
