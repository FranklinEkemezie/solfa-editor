import { describe, expect, it } from 'vitest';
import { createEmptyScoreDocument, withVoice } from '@/domain/music';
import { beatNotationTokens } from '@/features/score-editor/model/beat-notation';
import { buildScoreView } from '@/features/score-editor/model/build-score';
import type { BeatView } from '@/features/score-editor/model/score-view';

function firstBeat(source: string): BeatView {
    const document = withVoice(createEmptyScoreDocument(), 'soprano', source);
    const beat = buildScoreView(document).parts.soprano.measures[0]?.beats[0];
    if (!beat) throw new Error('The source produced no opening beat.');
    return beat;
}

function display(beat: BeatView): string {
    return beatNotationTokens(beat)
        .map((token) => {
            const mark = token.markBefore ?? '';
            if (token.kind === 'continuation') return `${mark}\u2014`;
            if (token.kind === 'rest') return mark;
            return `${mark}${token.item.syllable}${token.dotted ? '.' : ''}`;
        })
        .join('');
}

describe('beat notation', () => {
    it('marks the silence before an eighth note with a subdivision dot', () => {
        expect(display(firstBeat('. d'))).toBe('.d');
    });

    it('places a half-beat dot where the half actually falls', () => {
        expect(display(firstBeat('.d,r.m'))).toBe('d.r,m');
    });

    it('shortens a dotted note instead of drawing every continuation', () => {
        expect(display(firstBeat(',d--r'))).toBe('d.,r');
    });

    it('keeps a dash for a note that entered from the previous beat', () => {
        expect(display(firstBeat('.d--r'))).toBe('d');
    });

    it('draws one dash when the whole beat is a continuation', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d-');
        const beat = buildScoreView(document).parts.soprano.measures[0]?.beats[1];

        expect(beat ? display(beat) : null).toBe('\u2014');
    });

    it('does not draw a rest glyph but keeps its mark', () => {
        const tokens = beatNotationTokens(firstBeat('. d'));

        expect(tokens.map((token) => token.kind)).toEqual(['rest', 'note']);
        expect(tokens[1]?.markBefore).toBe('.');
    });
});
