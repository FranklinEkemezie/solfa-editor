import type { Accidental } from '@/domain/accidental';
import type { NoteValue } from '@/domain/note-value';
import type { SolfaSyllable } from '@/domain/solfa';
import type { SourceRange } from '@/features/notation/source-position';

/**
 * The token vocabulary of the notation language.
 *
 * Tokens are lexical, not grammatical: a `b` is an accidental token wherever it
 * is found. Whether that accidental can stand where it was written is the
 * parser's decision, because the same character also begins the pitch `ba`.
 */

export type DurationToken = {
    readonly kind: 'duration';
    readonly text: ':' | '.' | ',';
    readonly value: NoteValue;
    readonly range: SourceRange;
};

export type PitchToken = {
    readonly kind: 'pitch';
    readonly text: SolfaSyllable;
    readonly syllable: SolfaSyllable;
    readonly range: SourceRange;
};

export type AccidentalToken = {
    readonly kind: 'accidental';
    readonly text: '#' | 'b';
    readonly accidental: Accidental;
    readonly range: SourceRange;
};

export type OctaveToken = {
    readonly kind: 'octave';
    readonly text: string;
    /** Whole octaves relative to the voice's reference octave. */
    readonly offset: number;
    readonly range: SourceRange;
};

export type ContinuationToken = {
    readonly kind: 'continuation';
    readonly text: '-';
    readonly range: SourceRange;
};

export type RestToken = {
    readonly kind: 'rest';
    readonly text: ' ';
    readonly range: SourceRange;
};

export type Token =
    DurationToken | PitchToken | AccidentalToken | OctaveToken | ContinuationToken | RestToken;

export type TokenKind = Token['kind'];

export type PitchModifierToken = AccidentalToken | OctaveToken;

export function isPitchModifier(token: Token): token is PitchModifierToken {
    return token.kind === 'accidental' || token.kind === 'octave';
}
