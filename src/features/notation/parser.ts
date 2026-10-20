import type { Diagnostic } from '@/features/notation/diagnostics';
import {
    isAccepting,
    STATE_HINTS,
    transition,
    type ParserState,
} from '@/features/notation/grammar';
import { tokenCandidatesAt } from '@/features/notation/lexer';
import { sourceRange } from '@/features/notation/source-position';import type {
    ContinuationToken,
    DurationToken,
    PitchModifierToken,
    PitchToken,
    RestToken,
    Token,
} from '@/features/notation/tokens';

/** A duration symbol and the value it establishes. */
export type ParsedDuration = {
    readonly kind: 'duration';
    readonly token: DurationToken;
};

/** A written pitch with every modifier that belongs to it, in source order. */
export type ParsedPitch = {
    readonly kind: 'pitch';
    readonly token: PitchToken;
    readonly modifiers: PitchModifierToken[];
};

export type ParsedRest = {
    readonly kind: 'rest';
    readonly token: RestToken;
};

/** A continuation extends whichever pitch most recently sounded. */
export type ParsedContinuation = {
    readonly kind: 'continuation';
    readonly token: ContinuationToken;
};

export type ParseItem = ParsedDuration | ParsedPitch | ParsedRest | ParsedContinuation;

export type VoiceParseTree = {
    readonly items: readonly ParseItem[];
    /** The chosen token stream, in source order. */
    readonly tokens: readonly Token[];
};

export type ParseSuccess = { readonly ok: true; readonly tree: VoiceParseTree };
export type ParseFailure = { readonly ok: false; readonly diagnostic: Diagnostic };
export type ParseResult = ParseSuccess | ParseFailure;

type Frame = {
    readonly index: number;
    readonly state: ParserState;
    readonly candidates: readonly Token[];
    next: number;
    readonly hasParent: boolean;
};

/**
 * Parse a voice's notation into its structural form.
 *
 * Tokenisation is grammar-directed: at each position the lexer offers every
 * candidate token, longest first, and the parser keeps the first one whose
 * remainder can be read in a valid state. A memo of `(position, state)`
 * failures keeps that search linear in practice.
 *
 * An empty source is the empty voice. Every non-empty source must begin with a
 * duration, as the grammar requires.
 */
export function parseVoiceSource(source: string): ParseResult {
    if (source.length === 0) {
        return { ok: true, tree: { items: [], tokens: [] } };
    }

    const failures = new Set<string>();
    const path: Token[] = [];
    const stack: Frame[] = [
        {
            index: 0,
            state: 'start',
            candidates: tokenCandidatesAt(source, 0),
            next: 0,
            hasParent: false,
        },
    ];

    let furthestIndex = 0;
    let furthestState: ParserState = 'start';

    while (stack.length > 0) {
        const frame = stack[stack.length - 1];

        if (frame.index > furthestIndex) {
            furthestIndex = frame.index;
            furthestState = frame.state;
        }

        if (frame.next >= frame.candidates.length) {
            failures.add(`${frame.index}:${frame.state}`);
            stack.pop();
            if (frame.hasParent) path.pop();
            continue;
        }

        const token = frame.candidates[frame.next];
        frame.next += 1;

        const nextState = transition(frame.state, token.kind);
        if (!nextState) continue;

        const nextIndex = token.range.end;
        if (failures.has(`${nextIndex}:${nextState}`)) continue;

        path.push(token);
        if (nextIndex >= source.length) {
            if (isAccepting(nextState)) {
                return { ok: true, tree: buildTree(path) };
            }
            path.pop();
            continue;
        }

        stack.push({
            index: nextIndex,
            state: nextState,
            candidates: tokenCandidatesAt(source, nextIndex),
            next: 0,
            hasParent: true,
        });
    }

    return { ok: false, diagnostic: diagnosticAt(source, furthestIndex, furthestState) };
}

export type TokenizeResult =
    | { readonly ok: true; readonly tokens: readonly Token[] }
    | { readonly ok: false; readonly diagnostic: Diagnostic };

/** The chosen token stream for a source, which is what the lexer tests read. */
export function tokenize(source: string): TokenizeResult {
    const result = parseVoiceSource(source);
    return result.ok ? { ok: true, tokens: result.tree.tokens } : result;
}

function buildTree(tokens: readonly Token[]): VoiceParseTree {
    const items: ParseItem[] = [];

    for (const token of tokens) {
        switch (token.kind) {
            case 'duration':
                items.push({ kind: 'duration', token });
                break;
            case 'rest':
                items.push({ kind: 'rest', token });
                break;
            case 'continuation':
                items.push({ kind: 'continuation', token });
                break;
            case 'pitch':
                items.push({ kind: 'pitch', token, modifiers: [] });
                break;
            case 'accidental':
            case 'octave': {
                const last = items[items.length - 1];
                if (last?.kind !== 'pitch') {
                    throw new Error('The parser attached a modifier to something other than a pitch.');
                }
                last.modifiers.push(token);
                break;
            }
        }
    }

    return { items, tokens };
}

function diagnosticAt(source: string, index: number, state: ParserState): Diagnostic {
    const char = source[index];
    const range = sourceRange(index, Math.min(index + 1, source.length));

    if (char === undefined) {
        return { message: 'The notation ends before it is complete.', range };
    }

    if (char === '\t' || char === '\n' || char === '\r' || char === '\f' || char === '\v') {
        return {
            message:
                'Only a literal space separates notes; tabs and line breaks are not part of the notation.',
            range,
        };
    }

    return {
        message: `“${char}” cannot be written here. ${STATE_HINTS[state]}`,
        range,
    };
}
