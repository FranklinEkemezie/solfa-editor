import type { TokenKind } from '@/features/notation/tokens';

/**
 * The states of the notation grammar.
 *
 * The grammar is small enough to describe as the set of tokens each state
 * accepts. Keeping it in one table is what lets the parser backtrack cheaply:
 * a failure at `(position, state)` will fail again, whatever path reached it.
 *
 * The one refinement to the published EBNF is that a continuation is an item
 * in its own right, so a duration specifier may sit between a pitch and the
 * continuation that lengthens it. The language specification requires that
 * ("if a new duration specifier appears before a continuation, the continuation
 * uses the newly established duration"), and it is what makes it possible to
 * hold a note into a beat of a different value.
 */
export type ParserState = 'start' | 'new' | 'pitch' | 'modifier' | 'continuation' | 'heldDuration';

export function transition(state: ParserState, kind: TokenKind): ParserState | null {
    switch (state) {
        case 'start':
            return kind === 'duration' ? 'new' : null;

        case 'new':
            if (kind === 'duration') return 'new';
            if (kind === 'pitch') return 'pitch';
            if (kind === 'rest') return 'new';
            return null;

        case 'pitch':
        case 'modifier':
            if (kind === 'accidental' || kind === 'octave') return 'modifier';
            if (kind === 'continuation') return 'continuation';
            if (kind === 'duration') return 'heldDuration';
            if (kind === 'pitch') return 'pitch';
            if (kind === 'rest') return 'new';
            return null;

        case 'continuation':
        case 'heldDuration':
            if (kind === 'continuation') return 'continuation';
            if (kind === 'duration') return 'heldDuration';
            if (kind === 'pitch') return 'pitch';
            if (kind === 'rest') return 'new';
            return null;
    }
}

/** A state may end a voice unless it is still waiting for the first duration. */
export function isAccepting(state: ParserState): boolean {
    return state !== 'start';
}

/** What a reader can write next, phrased for the error message. */
export const STATE_HINTS: Record<ParserState, string> = {
    start: 'Start the voice with a duration: : for a quarter note, . for an eighth, or , for a sixteenth.',
    new: 'A note, a rest, or a duration can be written here.',
    pitch: 'A note, a rest, a duration, an accidental, an octave mark, or a continuation can follow.',
    modifier:
        'A note, a rest, a duration, an accidental, an octave mark, or a continuation can follow.',
    continuation: 'A note, a rest, a duration, or another continuation can follow.',
    heldDuration: 'A note, a rest, a duration, or a continuation can follow.',
};
