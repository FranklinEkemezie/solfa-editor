import { Accidental } from '@/domain/accidental';
import { NoteValue } from '@/domain/note-value';
import { isSolfaSyllable, type SolfaSyllable } from '@/domain/solfa';
import { sourceRange } from '@/features/notation/source-position';
import type { PitchToken, Token } from '@/features/notation/tokens';

/**
 * The lexical layer: what tokens could start at a position.
 *
 * This function deliberately knows nothing about grammar. It recognises every
 * lexeme beginning at `index` and returns them longest-first, so the parser can
 * try the longest sensible reading and fall back to a shorter one when the
 * remainder of the source does not work out.
 */

const DURATION_VALUES: Record<string, NoteValue> = {
    ':': NoteValue.QUARTER,
    '.': NoteValue.EIGHTH,
    ',': NoteValue.SIXTEENTH,
};

function pitchToken(syllable: SolfaSyllable, index: number): PitchToken {
    return {
        kind: 'pitch',
        text: syllable,
        syllable,
        range: sourceRange(index, index + syllable.length),
    };
}

function digitRun(source: string, index: number): string {
    let end = index;
    while (end < source.length && source[end] >= '0' && source[end] <= '9') end += 1;
    return source.slice(index, end);
}

/** Every token that could begin at `index`, longest first. */
export function tokenCandidatesAt(source: string, index: number): Token[] {
    const char = source[index];
    if (char === undefined) return [];

    const candidates: Token[] = [];
    const pair = source.slice(index, index + 2);

    // A two-letter chromatic syllable is always tried before its one-letter
    // natural prefix (`de` before `d`), which is what makes compact runs such
    // as `ddem` readable without separators.
    if (pair.length === 2 && isSolfaSyllable(pair)) {
        candidates.push(pitchToken(pair, index));
    }
    if (isSolfaSyllable(char)) {
        candidates.push(pitchToken(char, index));
    }

    const duration = DURATION_VALUES[char];
    if (duration) {
        candidates.push({
            kind: 'duration',
            text: char as ':' | '.' | ',',
            value: duration,
            range: sourceRange(index, index + 1),
        });
    }

    if (char === '#') {
        candidates.push({
            kind: 'accidental',
            text: '#',
            accidental: Accidental.SHARP,
            range: sourceRange(index, index + 1),
        });
    } else if (char === 'b') {
        candidates.push({
            kind: 'accidental',
            text: 'b',
            accidental: Accidental.FLAT,
            range: sourceRange(index, index + 1),
        });
    }

    if (char === "'") {
        // `''` is one modifier meaning +2, not two modifiers meaning +1 each.
        if (source[index + 1] === "'") {
            candidates.push({
                kind: 'octave',
                text: "''",
                offset: 2,
                range: sourceRange(index, index + 2),
            });
        }
        candidates.push({
            kind: 'octave',
            text: "'",
            offset: 1,
            range: sourceRange(index, index + 1),
        });
    }

    if (char >= '1' && char <= '9') {
        const digits = digitRun(source, index);
        candidates.push({
            kind: 'octave',
            text: digits,
            offset: -Number.parseInt(digits, 10),
            range: sourceRange(index, index + digits.length),
        });
    }

    if (char === '-') {
        candidates.push({
            kind: 'continuation',
            text: '-',
            range: sourceRange(index, index + 1),
        });
    }

    if (char === ' ') {
        candidates.push({
            kind: 'rest',
            text: ' ',
            range: sourceRange(index, index + 1),
        });
    }

    // Longest first. Equal-length candidates cannot both match the same text in
    // this vocabulary, so insertion order is a stable and harmless tie-break.
    return candidates.sort((left, right) => right.range.end - left.range.end);
}
