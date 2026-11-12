import { describe, expect, it } from 'vitest';
import {
    createEmptyScoreDocument,
    emptyLyricsByPart,
    lyricLine,
    withVoice,
    type ScoreDocument,
} from '@/domain/music';
import {
    appendToSyllable,
    clearLyricLine,
    deleteLastCharacter,
    ensureLyricLine,
    hasLyricLine,
    lyricAnchors,
    setSyllable,
} from '@/features/score-editor/editing/lyrics';
import { buildScoreView } from '@/features/score-editor/model/build-score';

function documentWith(source: string): ScoreDocument {
    return withVoice(createEmptyScoreDocument(), 'soprano', source);
}

function viewOf(source: string) {
    return buildScoreView(documentWith(source));
}

describe('lyric anchors', () => {
    it('gives every note that begins a cell, in reading order', () => {
        const anchors = lyricAnchors(viewOf(':drmf'), 'soprano');

        expect(anchors.map((anchor) => anchor.noteKey)).toEqual([
            'soprano:0',
            'soprano:1',
            'soprano:2',
            'soprano:3',
        ]);
        expect(anchors.map((anchor) => anchor.beat)).toEqual([1, 2, 3, 4]);
    });

    it('skips rests, because a singer has nothing to sing there', () => {
        const anchors = lyricAnchors(viewOf(':d r'), 'soprano');

        expect(anchors).toHaveLength(2);
        expect(anchors[0]?.noteKey).toBe('soprano:0');
        expect(anchors[1]?.noteKey).toBe('soprano:2');
    });

    it('skips a held note, which is the same note still sounding', () => {
        const anchors = lyricAnchors(viewOf(':d-'), 'soprano');

        expect(anchors).toHaveLength(1);
        expect(anchors[0]?.noteKey).toBe('soprano:0');
    });

    it('reports no anchors for an empty part', () => {
        expect(lyricAnchors(buildScoreView(createEmptyScoreDocument()), 'alto')).toEqual([]);
    });
});

describe('lyric line commands', () => {
    it('creates one empty cell per note', () => {
        const document = ensureLyricLine(documentWith(':drmf'), 'soprano', 4);

        expect(lyricLine(document, 'soprano')).toEqual(['', '', '', '']);
        expect(hasLyricLine(document, 'soprano')).toBe(true);
    });

    it('leaves a line that is already long enough untouched', () => {
        const document = ensureLyricLine(documentWith(':drmf'), 'soprano', 4);

        expect(ensureLyricLine(document, 'soprano', 2)).toBe(document);
    });

    it('writes a syllable and extends the line when needed', () => {
        const document = setSyllable(documentWith(':drmf'), 'soprano', 2, 'a');

        expect(lyricLine(document, 'soprano')).toEqual(['', '', 'a']);
    });

    it('appends typed characters to the current syllable', () => {
        const once = appendToSyllable(documentWith(':drmf'), 'soprano', 0, 'G');
        const twice = appendToSyllable(once, 'soprano', 0, 'lo');

        expect(lyricLine(twice, 'soprano')).toEqual(['Glo']);
    });

    it('deletes the last character of the current syllable', () => {
        const document = setSyllable(documentWith(':drmf'), 'soprano', 0, 'Glo');
        const result = deleteLastCharacter(document, 'soprano', 0);

        expect(result.index).toBe(0);
        expect(result.removed).toBe(true);
        expect(lyricLine(result.document, 'soprano')).toEqual(['Gl']);
    });

    it('steps back to the previous syllable when the current one is empty', () => {
        const document = setSyllable(documentWith(':drmf'), 'soprano', 0, 'Glo');
        const result = deleteLastCharacter(document, 'soprano', 1);

        expect(result.index).toBe(0);
        expect(lyricLine(result.document, 'soprano')).toEqual(['Gl']);
    });

    it('does nothing at the very start of an empty line', () => {
        const document = ensureLyricLine(documentWith(':drmf'), 'soprano', 4);
        const result = deleteLastCharacter(document, 'soprano', 0);

        expect(result.removed).toBe(false);
        expect(result.document).toBe(document);
    });

    it('clears a whole part line without touching the music', () => {
        const document = setSyllable(documentWith(':drmf'), 'soprano', 0, 'Glo');
        const cleared = clearLyricLine(document, 'soprano');

        expect(lyricLine(cleared, 'soprano')).toEqual([]);
        expect(cleared.voices).toEqual(document.voices);
    });

    it('keeps other parts lines when one is changed', () => {
        const withAlto = withVoice(documentWith(':drmf'), 'alto', ':drmf');
        const both: ScoreDocument = {
            ...withAlto,
            lyricsByPart: { ...emptyLyricsByPart(), alto: ['Al', 'to', 'line', '!'] },
        };

        const changed = setSyllable(both, 'soprano', 0, 'Sop');

        expect(lyricLine(changed, 'alto')).toEqual(['Al', 'to', 'line', '!']);
    });
});
